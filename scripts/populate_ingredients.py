#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "requests",
#     "beautifulsoup4",
#     "tqdm",
#     "supabase",
#     "python-dotenv",
#     "loguru",
#     "pydantic-ai"
# ]
# ///
"""
populate_ingredients.py

A script to scrape ingredient details from incidecoder.com and populate the Supabase database.
"""
import requests
from bs4 import BeautifulSoup
import time
from tqdm import tqdm
import os
import json
from skin_lib import get_supabase_client, setup_logger

INPUT_FILE = "data/ingredient_urls.txt"
DELAY = 1

def parse_ingredient_page(soup):
    """
    Parses the HTML soup of an ingredient page and extracts the required data.
    """
    data = {}
    
    # Extract ingredient name
    name_tag = soup.find("h1")
    data["name"] = name_tag.get_text(strip=True) if name_tag else None

    # Extract "what-it-does"
    what_it_does_tags = soup.select("div.itemprop .value a")
    data["what_it_does"] = [tag.get_text(strip=True) for tag in what_it_does_tags]

    # Extract "our_take"
    our_take_tag = soup.select_one("div.ourtake")
    data["our_take"] = our_take_tag.get_text(strip=True) if our_take_tag else None

    # Extract "quick_facts"
    quick_facts_tags = soup.select("#quickfacts ul.starlist li")
    data["quick_facts"] = [tag.get_text(strip=True) for tag in quick_facts_tags]

    # Extract image_url
    image_tag = soup.select_one(".inginfocontainer .imgcontainer img")
    data["image_url"] = image_tag["src"] if image_tag else None

    # Extract description
    details_tag = soup.find("div", id="details")
    data["description"] = details_tag.get_text(strip=True) if details_tag else None

    # Extract CosIng info
    cosing_info = {}
    cosing_table = soup.find("table", class_="cosing")
    if cosing_table:
        for row in cosing_table.find_all("tr"):
            cells = row.find_all("td")
            if len(cells) == 2:
                key = cells[0].get_text(strip=True).replace(":", "")
                value = cells[1].get_text(strip=True)
                cosing_info[key] = value
    data["cosing_info"] = cosing_info if cosing_info else None

    return data

def main():
    """
    Main function to scrape and populate ingredient data.
    """
    logger = setup_logger()
    
    if not os.path.exists(INPUT_FILE):
        logger.error(f"Input file not found: {INPUT_FILE}")
        return

    with open(INPUT_FILE, "r") as f:
        urls = [line.strip() for line in f.readlines()]

    supabase = get_supabase_client()
    if not supabase:
        logger.error("Failed to connect to Supabase.")
        return

    logger.info(f"Starting to process {len(urls)} ingredient URLs...")

    for url in tqdm(urls, desc="Populating ingredients"):
        try:
            response = requests.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, "html.parser")
            ingredient_data = parse_ingredient_page(soup)
            
            if not ingredient_data.get("name"):
                logger.warning(f"Could not parse ingredient name for URL: {url}")
                continue

            # Prepare data for upsert
            db_record = {
                "name": ingredient_data["name"],
                "what_it_does": ingredient_data["what_it_does"],
                "our_take": ingredient_data["our_take"],
                "quick_facts": ingredient_data["quick_facts"],
                "image_url": ingredient_data["image_url"],
                "description": ingredient_data["description"],
                "cosing_info": json.dumps(ingredient_data["cosing_info"]) if ingredient_data["cosing_info"] else None,
                "source_url": url,
                "updated_at": "now()"
            }
            
            # Upsert into Supabase
            supabase.table("ingredients").upsert(db_record, on_conflict="name").execute()
            
            time.sleep(DELAY)

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching {url}: {e}")
        except Exception as e:
            logger.error(f"An error occurred while processing {url}: {e}")

    logger.info("Ingredient population script finished.")

if __name__ == "__main__":
    main()
