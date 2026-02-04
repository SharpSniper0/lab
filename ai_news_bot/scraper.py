import feedparser
from datetime import datetime, timedelta
import time

class NewsScraper:
    def __init__(self):
        self.feeds = [
            "https://openai.com/blog/rss.xml",
            "https://blog.google/technology/ai/rss/",
            "https://aws.amazon.com/blogs/machine-learning/feed/",
            "https://techcrunch.com/category/artificial-intelligence/feed/",
            "https://www.theverge.com/rss/artificial-intelligence/index.xml",
            "https://news.mit.edu/rss/topic/artificial-intelligence2"
        ]
        self.seen_entries = set()

    def get_news(self, lookback_hours=24):
        """
        Fetches news from the last `lookback_hours` from configured feeds.
        """
        news_items = []
        # Calculate the cutoff time (current time - lookback period)
        # Note: robust time comparison depends on feed time formats (struct_time).
        # For simplicity, we'll fetch everything on the first run or filtering loosely if needed.
        # But commonly we just want "new stuff since last check" or "last 24h".
        
        print(f"Checking {len(self.feeds)} feeds...")
        
        for url in self.feeds:
            try:
                feed = feedparser.parse(url)
                print(f"Parsed {url}: found {len(feed.entries)} entries")
                
                for entry in feed.entries:
                    # Basic deduplication
                    if entry.link in self.seen_entries:
                        continue
                        
                    # Time filtering (optional, but good for 'daily' digest)
                    # Many feeds have 'published_parsed' which is a struct_time
                    if hasattr(entry, 'published_parsed') and entry.published_parsed:
                        published_dt = datetime.fromtimestamp(time.mktime(entry.published_parsed))
                        if datetime.now() - published_dt > timedelta(hours=lookback_hours):
                            continue
                            
                    self.seen_entries.add(entry.link)
                    news_items.append({
                        'title': entry.title,
                        'link': entry.link,
                        'summary': getattr(entry, 'summary', 'No summary available.'),
                        'source': feed.feed.get('title', url),
                        'published': getattr(entry, 'published', 'Unknown date')
                    })
            except Exception as e:
                print(f"Error parsing {url}: {e}")

        return news_items

if __name__ == "__main__":
    # Test run
    scraper = NewsScraper()
    items = scraper.get_news(lookback_hours=48)
    for item in items:
        print(f"- {item['title']} ({item['source']})")
