# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "httpx",
#     "beautifulsoup4",
#     "tqdm",
#     "orjson",
# ]
# ///

import asyncio
import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Set, Optional
import logging
import sys
from urllib.parse import urljoin
from tqdm.asyncio import tqdm
import orjson
import re
import argparse

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

class SkinsortScraper:
    def __init__(self, concurrency: int = 5):
        self.base_url = "https://skinsort.com"
        self.client = httpx.AsyncClient(
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            timeout=30.0,
            follow_redirects=True
        )
        self.semaphore = asyncio.Semaphore(concurrency)
        self.seen_ingredients: Set[str] = set()
        self.ingredients_data: List[Dict] = []
        self.products_data: List[Dict] = []

    async def fetch_page(self, url: str) -> Optional[str]:
        """Fetch a page with retry logic and concurrency limits."""
        async with self.semaphore:
            for attempt in range(3):
                try:
                    response = await self.client.get(url)
                    response.raise_for_status()
                    return response.text
                except httpx.HTTPError as e:
                    if attempt == 2:
                        logger.error(f"Failed to fetch {url}: {e}")
                        return None
                    await asyncio.sleep(1 * (attempt + 1))
        return None

    def clean_text(self, text: Optional[str]) -> Optional[str]:
        if not text:
            return None
        return " ".join(text.split())

    async def parse_ingredient(self, url: str) -> Optional[Dict]:
        """Scrapes details from a specific ingredient page using specific selectors."""
        html = await self.fetch_page(url)
        if not html:
            return None

        soup = BeautifulSoup(html, 'html.parser')
        data = {
            "url": url,
            "name": None,
            "description": None,
            "tags": [],
            "what_it_does": [],
            "prevalence": {},
            "cosing_data": {},
            "references": [],
            "user_sentiment": {}
        }

        # 1. Name
        h1 = soup.find("h1")
        if h1:
            data["name"] = self.clean_text(h1.text)

        # 2. Tags
        tags_container = soup.find("div", class_="max-w-xl")
        if tags_container:
            tag_items = tags_container.find_all("div", class_=lambda x: x and "rounded-lg" in x and "text-[11px]" in x)
            for item in tag_items:
                tag_name_element = item.find("button")
                tag_name = self.clean_text(tag_name_element.text) if tag_name_element else None

                description_element = item.find("div", class_=lambda x: x and "prose" in x)
                description = self.clean_text(description_element.text) if description_element else None
                
                if tag_name:
                    data["tags"].append({"name": tag_name, "description": description})

        # 3. Description
        desc_div = soup.find(class_="ingredient-description")
        if desc_div:
            paragraphs = desc_div.find_all("p")
            desc_text = " ".join([p.get_text() for p in paragraphs])
            data["description"] = self.clean_text(desc_text)
        elif soup.find("meta", {"name": "description"}):
             data["description"] = soup.find("meta", {"name": "description"})["content"]

        # 3. User Sentiment (Like/Avoid)
        # Look for containers with specific text
        sentiment_container = soup.find(class_=lambda x: x and "bg-white rounded-xl flex flex-col text-warm-gray-700" in x)
        if sentiment_container:
            for row in sentiment_container.find_all(class_=lambda x: x and "flex justify-between" in x):
                row_text = row.get_text().lower()
                value_div = row.find(class_="font-bold")
                if value_div:
                    value = self.clean_text(value_div.get_text())
                    if "users who like it" in row_text:
                        data["user_sentiment"]["likes"] = value
                    elif "users who avoid it" in row_text:
                        data["user_sentiment"]["avoids"] = value

        # 4. "What it does" / Functions
        what_it_does_header = soup.find("h2", string=re.compile("What it does", re.I))
        if what_it_does_header:
            container = what_it_does_header.find_next_sibling("div")
            if container:
                # Items often look like: <div ...> Function Name <span ...>Description</span> </div>
                # We iterate through direct child divs
                items = container.find_all(recursive=False)
                if not items:
                    # Fallback to finding by border class if recursive check fails
                    items = container.find_all(class_=lambda x: x and "border-warm-gray-100" in x)

                for item in items:
                    # The function name is usually the text node before the span
                    # Or we can just extract the text excluding the span, then the span
                    span = item.find("span")
                    if span:
                        desc = self.clean_text(span.get_text())
                        # Remove the span from a copy to get just the name
                        name_text = self.clean_text(item.get_text().replace(span.get_text(), ""))
                        data["what_it_does"].append({"function": name_text, "description": desc})
                    else:
                         data["what_it_does"].append({"function": self.clean_text(item.get_text())})


        # 5. Prevalence
        prevalence_header = soup.find("h2", string=re.compile("Prevalence", re.I))
        if prevalence_header:
            prev_container = prevalence_header.find_next_sibling("div")
            if prev_container:
                # Commonality & Percentage (First row)
                first_row = prev_container.find(class_="flex justify-between")
                if first_row:
                    # "Somewhat common" text is in a span or div
                    commonality_container = first_row.find("span", class_="flex flex-col")
                    if commonality_container:
                         # It might contain a sub-span we want to ignore for the main text
                         sub_span = commonality_container.find("span")
                         full_text = commonality_container.get_text()
                         if sub_span:
                             main_text = full_text.replace(sub_span.get_text(), "")
                             data["prevalence"]["commonality"] = self.clean_text(main_text)
                         else:
                             data["prevalence"]["commonality"] = self.clean_text(full_text)
                    
                    percentage_div = first_row.find(class_=lambda x: x and "rounded-full" in x)
                    if percentage_div:
                        data["prevalence"]["percentage"] = self.clean_text(percentage_div.get_text())

                # Top Categories (Look for "Top categories" text)
                cats_row = prev_container.find(string=re.compile("Top categories", re.I))
                if cats_row:
                    cats_parent = cats_row.find_parent("div")
                    if cats_parent:
                        cat_tags = cats_parent.find_all(class_=lambda x: x and "rounded-full" in x)
                        data["prevalence"]["top_categories"] = [self.clean_text(t.text) for t in cat_tags]

        # 6. CosIng Data
        cosing_header = soup.find("h2", string=re.compile("CosIng Data", re.I))
        if cosing_header:
            cosing_container = cosing_header.find_next_sibling("div")
            if cosing_container:
                rows = cosing_container.find_all(class_=lambda x: x and ("border-b" in x or "flex" in x))
                for row in rows:
                    # Structure: Label <span ...>Value</span> OR Label <div ...>Value</div>
                    # We look for the label text (usually first part) and value (usually in a span/div with color class)
                    value_elem = row.find(class_=lambda x: x and "text-warm-gray-600" in x)
                    if value_elem:
                        full_text = row.get_text()
                        value = self.clean_text(value_elem.get_text())
                        # Label is basically full text minus value
                        label = self.clean_text(full_text.replace(value_elem.get_text(), ""))
                        if label and value:
                            data["cosing_data"][label] = value

        # 7. References
        refs_header = soup.find("h2", string=re.compile("References", re.I))
        if refs_header:
            refs_container = refs_header.find_next_sibling("div")
            if refs_container:
                links = refs_container.find_all("a")
                for link in links:
                    data["references"].append(link.get('href'))

        return data

    async def parse_product(self, url: str) -> Dict:
        """Scrapes details from a product page based on provided HTML structure."""
        html = await self.fetch_page(url)
        if not html:
            return {"url": url, "error": "failed_fetch"}

        soup = BeautifulSoup(html, 'html.parser')
        
        product = {
            "url": url,
            "name": None,
            "brand": None,
            "description": None,
            "attributes": [], # Alcohol-free, Vegan, etc.
            "overview": {}, # What it is, Suited for, etc.
            "highlights": {}, # Benefits, Concerns, Key Ingredients
            "meta_data": {}, # pH, Country
            "rating": None,
            "review_count": None,
            "ingredient_urls": []
        }

        # 1. Product Name & Brand (Split H1 structure)
        # <h1 ...> <span ...>The Ordinary</span> <span ...>Salicylic Acid...</span> </h1>
        h1 = soup.find("h1")
        if h1:
            spans = h1.find_all("span", recursive=False)
            if len(spans) >= 2:
                # Brand is usually the first span (or nested anchor inside it)
                brand_text = self.clean_text(spans[0].text)
                product["brand"] = brand_text
                
                # Name is the second span
                name_text = self.clean_text(spans[1].text)
                product["name"] = name_text
            else:
                # Fallback
                product["name"] = self.clean_text(h1.text)

        # 2. Description
        # Look for the prose section or meta description
        prose_div = soup.find(class_=lambda x: x and "prose" in x and "text-warm-gray-800" in x)
        if prose_div:
            product["description"] = self.clean_text(prose_div.get_text())
        else:
            meta_desc = soup.find("meta", {"name": "description"})
            if meta_desc:
                product["description"] = meta_desc.get("content")

        # 3. Attributes (Alcohol-free, Vegan, etc.)
        # These are inside buttons/divs with data-attribute-key
        attr_containers = soup.find_all(attrs={"data-attribute-key": True})
        for container in attr_containers:
            # The text is usually inside a button/span inside this container
            # The provided HTML shows text like "Alcohol-free" inside a button span
            text = self.clean_text(container.get_text())
            if text:
                product["attributes"].append(text)

        # 4. Overview Section (What it is, Suited For, etc.)
        # Found in <div id="ingredients"> ... <h2>Overview</h2> ... </div>
        overview_container = soup.find(id="ingredients")
        if overview_container:
            overview_sections = overview_container.find_all("div", class_="pt-2")
            for section in overview_sections:
                header = section.find("h3")
                content = section.find("p")
                if header and content:
                    header_text = self.clean_text(header.get_text())
                    if header_text:
                        key = header_text.lower().replace(" ", "_")
                        value = self.clean_text(content.get_text())
                        product["overview"][key] = value

        # 5. At a Glance Highlights (Benefits, Concerns, Key Ingredients)
        # Found in <section id="at_a_glance">
        glance_section = soup.find(id="at_a_glance")
        if glance_section:
            # Each category is in a rounded-3xl div with an h3 header
            categories = glance_section.find_all("div", class_="ring-1")
            for cat in categories:
                cat_header = cat.find("h3")
                if cat_header:
                    cat_name = self.clean_text(cat_header.get_text())
                    items = []
                    # Items are usually buttons or divs with text
                    # Look for the bold text span inside the buttons
                    buttons = cat.find_all("button")
                    for btn in buttons:
                        # The main title of the benefit/concern is usually in a span with text-[15px]
                        title_span = btn.find("span", class_=lambda x: x and "text-[15px]" in x)
                        if title_span:
                            items.append(self.clean_text(title_span.get_text()))
                    
                    if items:
                        product["highlights"][cat_name] = items

        # 6. Meta Data (Origin, pH)
        # Often found in max-w-2xl mx-auto mt-8 blocks with h2 headers
        # "Where it's from", "Product acidity level"
        
        # Origin
        origin_header = soup.find("h2", string=re.compile("Where it's from", re.I))
        if origin_header:
            origin_container = origin_header.find_next("div", class_="grid")
            if origin_container:
                origin_text = self.clean_text(origin_container.get_text())
                product["meta_data"]["origin"] = origin_text

        # pH Level
        ph_header = soup.find("h2", string=re.compile("Product acidity level", re.I))
        if ph_header:
            ph_text_elem = ph_header.find_next_sibling("p")
            if ph_text_elem:
                product["meta_data"]["ph_level"] = self.clean_text(ph_text_elem.get_text())

        # 7. Ratings & Reviews
        # Rating: <span class="text-3xl ...">2.90</span>
        rating_span = soup.find("span", class_=lambda x: x and "text-3xl" in x)
        if rating_span:
            try:
                rating_text = self.clean_text(rating_span.get_text())
                if rating_text:
                    product["rating"] = float(rating_text)
            except (ValueError, TypeError):
                pass
        
        # Review Count: <span class="text-sm font-medium underline">24 reviews</span>
        review_span = soup.find("span", string=re.compile(r'\d+\s+reviews', re.I))
        if review_span:
            review_text = self.clean_text(review_span.text)
            # Extract number
            if review_text:
                match = re.search(r'(\d+)', review_text)
                if match:
                    product["review_count"] = int(match.group(1))

        # 8. Extract Ingredients
        # Target specific sections: #ingredients-explained-list or #ingredients_list
        unique_ing_urls = set()
        
        # Method A: Ingredients Explained List (Detailed rows)
        explained_list = soup.find(id="ingredients-explained-list")
        if explained_list:
            links = explained_list.find_all("a", href=lambda x: x and "/ingredients/" in x)
            for link in links:
                full_url = urljoin(self.base_url, link['href'])
                unique_ing_urls.add(full_url)
        
        # Method B: Simple Ingredients List (Grid) - as fallback or addition
        simple_list = soup.find(id="ingredients_list")
        if simple_list:
            links = simple_list.find_all("a", href=lambda x: x and "/ingredients/" in x)
            for link in links:
                full_url = urljoin(self.base_url, link['href'])
                unique_ing_urls.add(full_url)

        product["ingredient_urls"] = list(unique_ing_urls)
        
        return product

    async def run(self, product_urls: List[str], products_output: str, ingredients_output: str):
        logger.info(f"Starting scrape for {len(product_urls)} products...")

        # 1. Scrape Products
        tasks = [self.parse_product(url) for url in product_urls]
        for f in tqdm(asyncio.as_completed(tasks), total=len(tasks), desc="Processing Products"):
            result = await f
            if "error" not in result:
                self.products_data.append(result)
                # Collect new ingredients to scrape
                for ing_url in result["ingredient_urls"]:
                    if ing_url not in self.seen_ingredients:
                        self.seen_ingredients.add(ing_url)

        logger.info(f"Found {len(self.seen_ingredients)} unique ingredients to scrape.")

        # 2. Scrape Ingredients
        ing_tasks = [self.parse_ingredient(url) for url in self.seen_ingredients]
        for f in tqdm(asyncio.as_completed(ing_tasks), total=len(ing_tasks), desc="Processing Ingredients"):
            result = await f
            if result:
                self.ingredients_data.append(result)

        # 3. Save Data
        self.save_jsonl(self.products_data, products_output)
        self.save_jsonl(self.ingredients_data, ingredients_output)
        
        await self.client.aclose()
        logger.info("Scraping complete.")

    def save_jsonl(self, data: List[Dict], filename: str):
        with open(filename, 'wb') as f:
            for entry in data:
                f.write(orjson.dumps(entry) + b'\n')
        logger.info(f"Saved {len(data)} records to {filename}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape product and ingredient data from skinsort.com.")
    
    # Input group
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument("--url", type=str, help="A single product URL to scrape.")
    input_group.add_argument("--file", type=str, help="Path to a text file with one product URL per line.")

    # Output group
    parser.add_argument("--output-products", type=str, default="skinsort_products.jsonl", help="Output file for product data.")
    parser.add_argument("--output-ingredients", type=str, default="skinsort_ingredients.jsonl", help="Output file for ingredient data.")
    
    # Configuration
    parser.add_argument("--concurrency", type=int, default=5, help="Number of concurrent requests.")

    args = parser.parse_args()

    # Determine target products
    target_products = []
    if args.url:
        target_products.append(args.url)
    elif args.file:
        try:
            with open(args.file, 'r') as f:
                target_products = [line.strip() for line in f if line.strip()]
        except FileNotFoundError:
            logger.error(f"Error: Input file not found at {args.file}")
            sys.exit(1)

    if not target_products:
        logger.error("No product URLs provided. Please specify a URL with --url or a file with --file.")
        sys.exit(1)

    scraper = SkinsortScraper(concurrency=args.concurrency)
    asyncio.run(scraper.run(target_products, args.output_products, args.output_ingredients))
