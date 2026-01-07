#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["requests", "beautifulsoup4", "lxml"]
# ///
"""
incidecoder_to_jsonl_v3.py

V3 of the INCIDecoder → JSONL scraper, implementing the agreed changes:
- Provenance-based ingredients merge (skim → overview → explained) + ingredients_provenance
- Optional ingredient index JSONL emitter (lightweight upsert)
- Capture image alt + srcset; include product_url; emit brand_slug & product_slug
- Full details blurb including hidden "more" content; optional raw HTML
- CLI flags: --join-ingredients-sources, --include-details-html, --emit-ingredient-index, --product-id-from
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
import urllib.parse
from urllib import robotparser

import requests
from bs4 import BeautifulSoup

# -------------------------
# Config
# -------------------------
UA = "LilaSkinBot/1.0 (+https://example.com) Contact: ops@example.com"
DEFAULT_PARSER = "lxml"  # or "html.parser"

# Treat these as generic/placeholder brands when JSON-LD is noisy
GENERIC_BRANDS = {"incidecoder", "decode inci", "inci decoder", "decodeinci"}

# Map long, UI-ish function labels to canonical family slugs
_CANON_FAMILY = {
    "skin_identical_ingredient": "skin_identical",
    "moisturizer_humectant": "humectant",
    "surfactant_cleansing": "surfactant",
}


def canonicalize_family(slug: str) -> str:
    return _CANON_FAMILY.get(slug, slug)


# -------------------------
# Helpers
# -------------------------
_slug_rx = re.compile("[^a-z0-9]+")


def slugify(label: str) -> str:
    s = (label or "").strip().lower()
    s = s.replace("&", " and ")
    s = _slug_rx.sub("_", s)
    s = s.strip("_")
    return s or "unknown"


def textnorm(s: str | None) -> str:
    return " ".join((s or "").split())


def is_allowed_by_robots(url: str, user_agent: str = UA) -> bool:
    parsed = urllib.parse.urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp = robotparser.RobotFileParser()
    try:
        rp.set_url(robots_url)
        rp.read()
        allowed = rp.can_fetch(user_agent, url)
        return allowed
    except Exception:
        # Be conservative: fail closed
        return False


def fetch_html(url: str, timeout: float = 20.0, user_agent: str = UA) -> str:
    resp = requests.get(url, headers={"User-Agent": user_agent}, timeout=timeout)
    resp.raise_for_status()
    return resp.text


def parse_jsonld_product(soup: BeautifulSoup) -> tuple[str | None, str | None]:
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "")
        except Exception:
            continue
        items = data if isinstance(data, list) else [data]
        for obj in items:
            if isinstance(obj, dict) and obj.get("@type") == "Product":
                name = (obj.get("name") or "").strip() or None
                brand = None
                b = obj.get("brand")
                if isinstance(b, dict):
                    brand = (b.get("name") or "").strip() or None
                elif isinstance(b, str):
                    brand = b.strip()
                return brand, name
    return None, None


# Fallbacks & explicit ID-based extraction


def fallback_name_brand(soup: BeautifulSoup) -> tuple[str | None, str | None]:
    h1 = soup.find("h1")
    name = textnorm(h1.get_text()) if h1 else None
    brand = None
    if h1:
        for a in h1.find_all_previous("a", href=True, limit=6):
            t = textnorm(a.get_text())
            if 1 <= len(t) <= 60 and t.isascii():
                brand = t
                break
    return brand, name


def parse_brand_name_by_ids(soup: BeautifulSoup) -> tuple[str | None, str | None]:
    brand = None
    name = None
    brand_a = soup.select_one("#product-brand-title a[href]")
    if brand_a:
        brand = textnorm(brand_a.get_text())
    name_span = soup.select_one("#product-title")
    if name_span:
        name = textnorm(name_span.get_text())
    return brand or None, name or None


# Section iter helper


def iter_section_nodes(header_tag) -> list[str]:
    lines: list[str] = []
    cur = header_tag.find_next_sibling()
    while cur and cur.name not in ["h2", "h3"]:
        lines.append(cur.get_text(" ", strip=True))
        cur = cur.find_next_sibling()
    return lines


# --- Ingredient collectors (with provenance) ---


def extract_ingredients_overview(soup: BeautifulSoup) -> list[str]:
    ing_header = soup.find(lambda t: t.name in ["h2", "h3"] and "Ingredients overview" in t.get_text())
    out: list[str] = []
    if not ing_header:
        return out
    cont = ing_header.find_next()
    if not cont:
        return out
    for a in cont.find_all("a", href=True):
        href = a.get("href", "")
        label = a.get_text(strip=True)
        if label and (href.startswith("/ingredients/") or "incidecoder.com/ingredients/" in href):
            out.append(label)
    return out


def extract_ingredients_skim(soup: BeautifulSoup) -> list[str]:
    skim_header = soup.find(lambda t: t.name in ["h2", "h3"] and "Skim through" in t.get_text())
    out: list[str] = []
    if not skim_header:
        return out
    table = skim_header.find_next("table")
    if not table:
        return out
    for row in table.find_all("tr"):
        a = row.find("a", href=True)
        if not a:
            continue
        href = a.get("href", "")
        if href.startswith("/ingredients/") or "incidecoder.com/ingredients/" in href:
            label = a.get_text(strip=True)
            if label:
                out.append(label)
    return out


def extract_ingredients_explained(soup: BeautifulSoup) -> list[str]:
    expl_header = soup.find(lambda t: t.name in ["h2", "h3"] and "Ingredients explained" in t.get_text())
    out: list[str] = []
    if not expl_header:
        return out
    sect = expl_header.find_next()
    if not sect:
        return out
    for a in sect.select("a.product-long-ingred-link"):
        label = a.get_text(strip=True)
        if label:
            out.append(label)
    return out


def merge_ingredients_with_provenance(
    skim: list[str], overview: list[str], explained: list[str]
) -> tuple[list[str], dict[str, list[str]]]:
    order: list[str] = []
    prov: dict[str, list[str]] = {}

    def add_items(items: list[str], tag: str):
        for name in items:
            if not name:
                continue
            prov.setdefault(name, [])
            if tag not in prov[name]:
                prov[name].append(tag)
            if name not in order:
                order.append(name)

    add_items(skim, "skim")
    add_items(overview, "overview")
    add_items(explained, "explained")

    return order, prov


# Highlights hashtags


def extract_highlights(soup: BeautifulSoup) -> dict[str, bool]:
    flags = {"fragrance_free": False, "essential_oil_free": False, "alcohol_free": False}
    high = soup.find(lambda t: t.name in ["h2", "h3"] and "Highlights" in t.get_text())
    if not high:
        return flags
    container = high.find_next()
    texts: list[str] = []
    # Visible hashtag chips
    for tag in (container or soup).select(".hashtags .hashtag"):
        texts.append(tag.get_text(" ", strip=True))
        tt = tag.get("data-tooltip-content")
        if tt and tt.startswith("#"):
            node = soup.select_one(tt)
            if node:
                texts.append(node.get_text(" ", strip=True))
    # Fallback: any tooltip texts nearby
    for node in (container or soup).select(".tooltip_templates .ingred-tooltip-text"):
        texts.append(node.get_text(" ", strip=True))

    def norm(x: str) -> str:
        x = x.lower()
        x = x.replace("&", " and ").replace("-", " ").replace("–", " ").replace("—", " ")
        return " ".join(x.split())

    tokens = [norm(t) for t in texts if t]
    for t in tokens:
        if "alcohol" in t and "free" in t:
            flags["alcohol_free"] = True
        if "fragrance" in t and "free" in t:
            flags["fragrance_free"] = True
        if ("essential oil" in t or "essentialoil" in t) and "free" in t:
            flags["essential_oil_free"] = True
        if "fragrance and essential oil free" in t:
            flags["fragrance_free"] = True
            flags["essential_oil_free"] = True
    return flags
    texts = iter_section_nodes(high)
    low = " ".join(texts).lower()
    if "#alcohol-free" in low or "alcohol free" in low:
        flags["alcohol_free"] = True
    if "#fragrance & essentialoil-free" in low or "fragrance and essential oil free" in low:
        flags["fragrance_free"] = True
        flags["essential_oil_free"] = True
    return flags


# Key Ingredients block → page-derived actives


def extract_key_ingredients_from_page(soup: BeautifulSoup) -> list[dict[str, str | None]]:
    results: list[dict[str, str | None]] = []
    key_header = soup.find(lambda t: t.name in ["h2", "h3"] and "Key Ingredients" in t.get_text())
    if not key_header:
        return results
    sect = key_header.find_next()
    cur = sect
    seen = set()
    while cur and cur.name not in ["h2", "h3"]:
        txt = cur.get_text(" ", strip=True)
        if ":" in txt:
            label = txt.split(":", 1)[0].strip()
            fam_slug = canonicalize_family(slugify(label))
            for a in cur.find_all("a", href=True):
                href = a.get("href", "")
                if not (href.startswith("/ingredients/") or "incidecoder.com/ingredients/" in href):
                    continue
                inci = a.get_text(strip=True)
                key = (fam_slug, inci)
                if inci and key not in seen:
                    results.append(
                        {
                            "family": fam_slug,
                            "family_raw": label,
                            "inci": inci,
                            "pct_declared": None,
                            "pct_type": "unknown",
                            "source": "key_ingredients",
                        }
                    )
                    seen.add(key)
        cur = cur.find_next_sibling()
    return results


def augment_with_map(ingredients_inci: list[str], map_json: dict[str, str] | None) -> list[dict[str, str | None]]:
    out: list[dict[str, str | None]] = []
    if not map_json or not isinstance(map_json, dict):
        return out
    elif "inci_to_family" in map_json and isinstance(map_json["inci_to_family"], dict):
        m = map_json["inci_to_family"]
    else:
        m = map_json
    for inci in ingredients_inci:
        fam = m.get(inci)
        if fam:
            out.append(
                {
                    "family": slugify(fam),
                    "family_raw": fam,
                    "inci": inci,
                    "pct_declared": None,
                    "pct_type": "unknown",
                    "source": "map-json",
                }
            )
    return out


def dedupe_actives(actives: list[dict[str, str | None]]) -> list[dict[str, str | None]]:
    out: list[dict[str, str | None]] = []
    seen = set()
    for a in actives:
        fam = (a.get("family") or "").lower().strip()
        inci = (a.get("inci") or "").lower().strip()
        if not fam or not inci:
            continue
        key = (fam, inci)
        if key in seen:
            continue
        seen.add(key)
        out.append(a)
    return out


# Details blurb (visible + hidden)


def extract_details_blurb(soup: BeautifulSoup, include_html: bool = False) -> tuple[str | None, str | None]:
    details = soup.select_one("#product-details")
    if not details:
        return None, None
    text = textnorm(details.get_text(" ", strip=True)) or None
    html = None
    if include_html:
        sm = details.select_one(".showmore-section") or details
        html = str(sm)
    return text, html


# Images (alt + srcset)


def _parse_srcset(value: str) -> list[str]:
    if not value:
        return []
    out: list[str] = []
    for part in value.split(","):
        url_only = part.strip().split(" ")[0]
        if url_only:
            out.append(url_only)
    return out


def extract_image_assets(soup: BeautifulSoup) -> tuple[str | None, str | None, dict[str, list[str]]]:
    image_alt = None
    image_url = None
    srcsets: dict[str, list[str]] = {}
    pic = soup.select_one("#product-main-image")
    if not pic:
        return None, None, srcsets
    img = pic.select_one("img[src]")
    if img:
        image_url = img.get("src")
        image_alt = img.get("alt") or None
    for source in pic.select("source[srcset]"):
        typ = (source.get("type") or "").split("/")[-1].lower()
        key = "webp" if "webp" in typ else "jpeg" if "jpeg" in typ or "jpg" in typ else (typ or "other")
        srcsets[key] = _parse_srcset(source.get("srcset", ""))
    return image_url, image_alt, srcsets


# Skim through metrics + rows for ingredient index


def extract_skim_metrics_and_rows(
    soup: BeautifulSoup,
) -> tuple[int | None, int | None, int | None, int | None, list[dict], list[str]]:
    warnings: list[str] = []
    irr_vals: list[int] = []
    com_vals: list[int] = []
    rows_for_index: list[dict] = []
    try:
        skim_header = soup.find(lambda t: t.name in ["h2", "h3"] and "Skim through" in t.get_text())
        if not skim_header:
            warnings.append("skim_section_missing")
            return None, None, None, None, rows_for_index, warnings
        table = skim_header.find_next("table")
        if not table:
            warnings.append("skim_table_missing")
            return None, None, None, None, rows_for_index, warnings
        for row in table.find_all("tr"):
            cells = row.find_all(["td", "th"])
            if len(cells) < 2:
                continue
            ing_a = cells[0].find("a", href=True)
            if not ing_a:
                continue
            ing_name = ing_a.get_text(strip=True)
            ing_href = ing_a.get("href", "")
            if "/ingredients/" not in ing_href:
                continue
            ing_slug = ing_href.split("/ingredients/")[-1].strip("/")

            func_cell = cells[1]
            func_slugs: list[str] = []
            for a in func_cell.find_all("a"):
                f = canonicalize_family(slugify(a.get_text(" ", strip=True)))
                if f:
                    func_slugs.append(f)

            rating = None
            if len(cells) >= 4:
                rate_cell = cells[3]
                span = rate_cell.find(class_=re.compile("our-take"))
                if span and isinstance(span.get("class"), list):
                    for c in span.get("class", []):
                        if c.startswith("our-take-"):
                            rating = c.replace("our-take-", "").strip()
                            break

            if len(cells) >= 3:
                cell = cells[2]
                titled = cell.select("span[title]")
                if titled:
                    for sp in titled:
                        title = (sp.get("title") or "").lower()
                        nums = re.findall("[0-9]+", title)
                        for idx, val_s in enumerate(nums):
                            val = int(val_s)
                            # Heuristic: the first number is irritancy, second is comedogenicity
                            if idx == 0:
                                irr_vals.append(val)
                            elif idx == 1:
                                com_vals.append(val)
                else:
                    nums = [int(x) for x in re.findall("[0-9]+", cell.get_text(" ", strip=True))]
                    if nums:
                        irr_vals.append(nums[0])
                        if len(nums) >= 2:
                            com_vals.append(nums[1])

            rows_for_index.append(
                {
                    "ingredient_slug": ing_slug,
                    "name": ing_name,
                    "functions": list(dict.fromkeys(func_slugs)),
                    "our_take": rating,
                }
            )
    except Exception:
        warnings.append("skim_parse_error")
    irr_max = max(irr_vals) if irr_vals else None
    com_max = max(com_vals) if com_vals else None
    irr_med = int(__import__("statistics").median(irr_vals)) if irr_vals else None
    com_med = int(__import__("statistics").median(com_vals)) if com_vals else None
    return irr_max, com_max, irr_med, com_med, rows_for_index, warnings


# -------------------------
# Core parse
# -------------------------


def guess_category_and_usage(name: str) -> tuple[str | None, str | None, str | None]:
    n = (name or "").lower()
    if "cleanser" in n or "face wash" in n or "oil cleanser" in n or "cleansing oil" in n:
        subtype = "oil_cleanser" if "oil" in n else "gel_cleanser" if "gel" in n else None
        return "cleanser", "rinse_off", subtype
    if "toner" in n:
        return "exfoliant", "leave_on", "toner"
    if "serum" in n or "booster" in n or "treatment" in n:
        return "serum", "leave_on", None
    if "sunscreen" in n or "spf" in n:
        return "sunscreen", "leave_on", None
    if any(k in n for k in ["cream", "moisturizer", "lotion", "emulsion", "balm", "gel-cream"]):
        return "moisturizer", "leave_on", None
    return None, None, None


def parse_brand_anchor_and_slug(soup: BeautifulSoup) -> tuple[str | None, str | None, str | None]:
    a = soup.select_one('a[href^="/brand/"], a[href^="/brands/"]')
    if not a or not a.get("href"):
        return None, None, None
    try:
        from urllib.parse import urljoin

        label = textnorm(a.get_text())
        url = urljoin("https://incidecoder.com", a["href"])  # absolute
        slug = urllib.parse.urlparse(url).path.split("/")[-1]
        return label, url, slug
    except Exception:
        return textnorm(a.get_text()), None, None


def product_slug_from_url(url: str) -> str | None:
    try:
        path = urllib.parse.urlparse(url).path
        parts = [p for p in path.split("/") if p]
        if len(parts) >= 2 and parts[0] == "products":
            return parts[1]
    except Exception:
        return None
    return None


def compute_product_id(url: str, brand_slug: str | None, product_slug: str | None, method: str) -> str:
    if method == "slug" and brand_slug and product_slug:
        return f"prd_{slugify(brand_slug)}__{slugify(product_slug)}"
    return "prd_" + hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]


def parse_product_page(
    html: str,
    url: str,
    *,
    parser: str = DEFAULT_PARSER,
    map_json: dict[str, str] | None = None,
    join_sources: list[str] = None,
    include_details_html: bool = False,
    product_id_from: str = "url_hash",
) -> tuple[dict, list[dict]]:
    soup = BeautifulSoup(html, features=parser)

    id_brand, id_name = parse_brand_name_by_ids(soup)

    brand, name = parse_jsonld_product(soup)
    brand = brand or id_brand
    name = name or id_name

    if not name:
        fb_brand, fb_name = fallback_name_brand(soup)
        brand = brand or fb_brand
        name = name or fb_name

    b2_label, b2_url, brand_slug = parse_brand_anchor_and_slug(soup)
    if b2_label:
        if (not brand) or (brand.strip().lower() in GENERIC_BRANDS):
            brand = b2_label

    if brand and name and name.lower().startswith((brand or "").lower() + " "):
        name = name[len(brand) :].strip()

    skim_list = extract_ingredients_skim(soup)
    overview_list = extract_ingredients_overview(soup)
    explained_list = extract_ingredients_explained(soup)

    join_sources = join_sources or ["skim", "overview", "explained"]
    use_skim = "skim" in join_sources
    use_overview = "overview" in join_sources
    use_explained = "explained" in join_sources

    ingredients_inci, ingredients_provenance = merge_ingredients_with_provenance(
        skim_list if use_skim else [],
        overview_list if use_overview else [],
        explained_list if use_explained else [],
    )

    flags = extract_highlights(soup)
    details_blurb, details_html = extract_details_blurb(soup, include_html=include_details_html)
    image_url, image_alt, image_srcset = extract_image_assets(soup)
    irr_max, com_max, irr_med, com_med, skim_rows, warn_list = extract_skim_metrics_and_rows(soup)

    actives_page = extract_key_ingredients_from_page(soup)
    actives_map = augment_with_map(ingredients_inci, map_json)
    actives = dedupe_actives(actives_page + actives_map)

    category, usage_mode, subtype = guess_category_and_usage(name or "")
    prod_slug = product_slug_from_url(url)
    pid = compute_product_id(url, brand_slug, prod_slug, product_id_from)

    rec = {
        "product_id": pid,
        "brand": brand or None,
        "brand_slug": brand_slug,
        "product_slug": prod_slug,
        "name": name or None,
        "category": category,
        "subtype": subtype,
        "usage_mode": usage_mode,
        "actives": actives,
        "ingredients_inci": ingredients_inci,
        "ingredients_provenance": ingredients_provenance,
        "claims_flags": {
            "fragrance_free": flags["fragrance_free"],
            "essential_oil_free": flags["essential_oil_free"],
            "alcohol_free": flags["alcohol_free"],
            "non_comedogenic": None,
        },
        "size": {"amount": None, "unit": None},
        "price": {"value": None, "currency": None, "collected_at_iso": None},
        "availability_regions": [],
        "links": {
            "brand_url": b2_url,
            "product_url": url,
            "image_url": image_url,
            "image_alt": image_alt,
            "image_srcset": image_srcset,
            "inci_source": url,
        },
        "metadata": {
            "shelf_life_months": None,
            "country_of_origin": None,
            "barcode_sku": None,
            "irritancy_est_0_3": irr_max,
            "irritancy_est_median_0_3": irr_med,
            "comedogenicity_est_0_5": com_max,
            "comedogenicity_est_median_0_5": com_med,
            "details_blurb": details_blurb,
        },
        "_trace": {
            "source": "incidecoder",
            "scraped_iso": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "metrics_method": "skim_table_max_and_median",
            "extraction_warnings": warn_list or [],
        },
    }

    if include_details_html:
        rec["metadata"]["details_blurb_html"] = details_html

    return rec, skim_rows


# -------------------------
# Ingredient index (lightweight JSONL)
# -------------------------


def load_index(path: str) -> dict[str, dict]:
    if not path or not os.path.exists(path):
        return {}
    out: dict[str, dict] = {}
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except Exception:
                continue
            slug = row.get("ingredient_slug")
            if slug:
                out[slug] = row
    return out


def best_rating(a: str | None, b: str | None) -> str | None:
    rank = {"superstar": 2, "goodie": 1}
    ai = rank.get(a or "", -1)
    bi = rank.get(b or "", -1)
    return a if ai >= bi else b


def upsert_index(
    index: dict[str, dict], rows: list[dict], product_url: str, now_iso: str, cap_sources: int = 10
) -> dict[str, dict]:
    for r in rows:
        slug = r.get("ingredient_slug")
        if not slug:
            continue
        cur = index.get(slug) or {
            "ingredient_id": "ing_" + hashlib.sha1(slug.encode("utf-8")).hexdigest()[:12],
            "ingredient_slug": slug,
            "name": r.get("name"),
            "aliases": [],
            "functions": [],
            "our_take": None,
            "first_seen_iso": now_iso,
            "last_seen_iso": now_iso,
            "source_urls": [],
        }
        fset = set(cur.get("functions") or []) | set(r.get("functions") or [])
        cur["functions"] = sorted(fset)
        cur["name"] = cur.get("name") or r.get("name")
        cur["our_take"] = best_rating(cur.get("our_take"), r.get("our_take"))
        cur["first_seen_iso"] = min(cur.get("first_seen_iso", now_iso), now_iso)
        cur["last_seen_iso"] = max(cur.get("last_seen_iso", now_iso), now_iso)
        srcs = [u for u in [product_url] + (cur.get("source_urls") or []) if u]
        dedup: list[str] = []
        for u in srcs:
            if u not in dedup:
                dedup.append(u)
        cur["source_urls"] = dedup[:cap_sources]
        index[slug] = cur
    return index


def write_index(path: str, index: dict[str, dict]) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        for slug in sorted(index.keys()):
            row = index[slug]
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")


# -------------------------
# IO / CLI
# -------------------------


def append_jsonl(path: str, record: dict) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def main():
    ap = argparse.ArgumentParser(
        description="Scrape an INCIDecoder product page into a JSONL row (provenance ingredients; image assets; optional ingredient index)"
    )
    ap.add_argument("url", help="INCIDecoder product URL")
    ap.add_argument("out_jsonl", nargs="?", help="Output JSONL file path (appends). If omitted, prints JSON to stdout")
    ap.add_argument("--sleep", type=float, default=2.0, help="Seconds to sleep after request (politeness)")
    ap.add_argument("--timeout", type=float, default=20.0, help="HTTP timeout seconds")
    ap.add_argument("--ua", type=str, default=UA, help="User-Agent string")
    ap.add_argument("--parser", choices=["lxml", "html.parser"], default=DEFAULT_PARSER, help="HTML parser choice")
    ap.add_argument(
        "--map-json", type=str, help='Path to JSON mapping (either {inci: family} or {"inci_to_family": {...}})'
    )
    ap.add_argument("--ignore-robots", action="store_true", help="Skip robots.txt check (use only if permitted)")

    ap.add_argument(
        "--join-ingredients-sources",
        type=str,
        default="skim,overview,explained",
        help="Comma-separated sources to join in order (any of: skim,overview,explained)",
    )
    ap.add_argument("--include-details-html", action="store_true", help="Also store metadata.details_blurb_html")
    ap.add_argument("--emit-ingredient-index", type=str, help="Path to ingredient index JSONL (upsert). Off if omitted")
    ap.add_argument(
        "--product-id-from",
        choices=["url_hash", "slug"],
        default="slug",
        help="How to compute product_id (default slug; fallback to url_hash if slugs missing)",
    )

    args = ap.parse_args()

    if not args.ignore_robots and not is_allowed_by_robots(args.url, args.ua):
        sys.stderr.write(
            "Blocked by robots.txt or failed to fetch robots — aborting politely. Use --ignore-robots if you have permission."
        )
        sys.exit(2)

    map_json = None
    if args.map_json:
        try:
            with open(args.map_json, encoding="utf-8") as fh:
                map_json = json.load(fh)
        except Exception as e:
            sys.stderr.write(f"Warning: failed to load --map-json: {e}")

    html = fetch_html(args.url, timeout=args.timeout, user_agent=args.ua)

    join = [s.strip().lower() for s in (args.join_ingredients_sources or "").split(",") if s.strip()]
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%S")

    rec, skim_rows = parse_product_page(
        html,
        args.url,
        parser=args.parser,
        map_json=map_json,
        join_sources=join,
        include_details_html=args.include_details_html,
        product_id_from=args.product_id_from,
    )

    if args.out_jsonl:
        append_jsonl(args.out_jsonl, rec)
        print(f"Appended {rec['product_id']} → {args.out_jsonl}")
    else:
        sys.stdout.write(json.dumps(rec, ensure_ascii=False) + "\n")

    if args.emit_ingredient_index:
        idx_path = args.emit_ingredient_index
        index = load_index(idx_path)
        index = upsert_index(index, skim_rows, rec["links"]["product_url"], now_iso, cap_sources=10)
        write_index(idx_path, index)

    time.sleep(max(0.0, args.sleep))


if __name__ == "__main__":
    main()
