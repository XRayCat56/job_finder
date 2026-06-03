import requests
from bs4 import BeautifulSoup


def scrape_website(url):
    # 1. Define headers to mimic a real browser visit (prevents some basic blocks)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        # 2. Send a GET request to the URL
        print(f"Fetching content from: {url}...")
        response = requests.get(url, headers=headers, timeout=10)

        # Check if the request was successful (Status Code 200)
        response.raise_for_status()

    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")
        return
    except requests.exceptions.RequestException as err:
        print(f"An error occurred: {err}")
        return

    # 3. Parse the HTML content using BeautifulSoup
    soup = BeautifulSoup(response.text, "html.parser")

    # -------------------------------------------------------------------------
    # 4. Extract Data (Modify this section based on what you actually want!)
    # -------------------------------------------------------------------------

    html_content = soup.prettify()
    with open("linkedin_jobs.html", "w", encoding="utf-8") as file:
        file.write(html_content)

    print("HTML content saved to linkedin_jobs.html")

# --- Execute the script ---
if __name__ == "__main__":
    # Replace this with the target URL you want to scrape
    # (Make sure the site allows scraping!)
    target_url = "https://www.linkedin.com/jobs/view/4423917852/"
    scrape_website(target_url)
