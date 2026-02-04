import schedule
import time
from scraper import NewsScraper
from mailer import EmailService
from datetime import datetime
import sys

def job():
    print(f"[{datetime.now()}] Starting daily news job...")
    scraper = NewsScraper()
    news = scraper.get_news(lookback_hours=24)
    
    if news:
        print(f"Found {len(news)} new items. Sending email...")
        emailer = EmailService()
        emailer.send_digest(news)
    else:
        print("No new news found in the last 24 hours.")

def main():
    print("AI News Bot started.")
    print("Scheduling daily digest for 09:00 AM EST (System time).")
    
    # Schedule the job
    schedule.every().day.at("09:00").do(job)
    
    # Also run once on startup if requested (for testing)
    if "--run-now" in sys.argv:
        print("Running immediate check...")
        job()
    
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    main()
