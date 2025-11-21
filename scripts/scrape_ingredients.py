#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "requests",
#     "beautifulsoup4",
#     "tqdm"
# ]
# ///
"""
scrape_ingredients.py

A script to scrape ingredient URLs from incidecoder.com.
"""
import requests
from bs4 import BeautifulSoup # type: ignore
import time
from tqdm import tqdm
import os

BASE_URL = "https://incidecoder.com"
INGREDIENTS_PATH = "/ingredients"
OUTPUT_DIR = "data"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "ingredient_urls.txt")
ITERATIONS = 100
DELAY = 1

def load_existing_urls():
    """
    Loads existing URLs from the output file into a set.
    """
    if not os.path.exists(OUTPUT_FILE):
        return set()
    with open(OUTPUT_FILE, "r") as f:
        return {line.strip() for line in f if line.strip()}

def scrape_ingredient_urls():
    """
    Scrapes ingredient URLs from incidecoder.com by repeatedly fetching the ingredients page.
    """
    ingredient_urls = load_existing_urls()
    initial_count = len(ingredient_urls)
    print(f"Loaded {initial_count} existing URLs from {OUTPUT_FILE}")

    print(f"Scraping {BASE_URL}{INGREDIENTS_PATH} for new ingredient URLs...")
    
    for _ in tqdm(range(ITERATIONS), desc="Scraping pages"):
        try:
            response = requests.get(f"{BASE_URL}{INGREDIENTS_PATH}")
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, "html.parser")
            
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                if href.startswith("/ingredients/"):
                    ingredient_urls.add(BASE_URL + href)
            
            time.sleep(DELAY)
            
        except requests.exceptions.RequestException as e:
            print(f"An error occurred: {e}")
            break

    return ingredient_urls

def save_urls_to_file(urls, initial_count):
    """
    Saves a set of URLs to a text file, reporting new and total counts.
    """
    total_urls = len(urls)
    newly_added = total_urls - initial_count

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        for url in sorted(list(urls)):
            f.write(f"{url}\n")

    print(f"\nFound {newly_added} new URLs.")
    print(f"Successfully saved {total_urls} total unique URLs to {OUTPUT_FILE}")

if __name__ == "__main__":
    initial_url_count = len(load_existing_urls())
    all_urls = scrape_ingredient_urls()
    if all_urls:
        save_urls_to_file(all_urls, initial_url_count)
