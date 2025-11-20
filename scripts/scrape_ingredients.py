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
from bs4 import BeautifulSoup
import time
from tqdm import tqdm
import os

BASE_URL = "https://incidecoder.com"
INGREDIENTS_PATH = "/ingredients"
OUTPUT_DIR = "data"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "ingredient_urls.txt")
ITERATIONS = 100
DELAY = 1

def scrape_ingredient_urls():
    """
    Scrapes ingredient URLs from incidecoder.com by repeatedly fetching the ingredients page.
    """
    ingredient_urls = set()

    print(f"Scraping {BASE_URL}{INGREDIENTS_PATH} for ingredient URLs...")
    
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

def save_urls_to_file(urls):
    """
    Saves a set of URLs to a text file.
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        for url in sorted(list(urls)):
            f.write(f"{url}\n")
    print(f"Successfully saved {len(urls)} unique URLs to {OUTPUT_FILE}")

if __name__ == "__main__":
    urls = scrape_ingredient_urls()
    if urls:
        save_urls_to_file(urls)
