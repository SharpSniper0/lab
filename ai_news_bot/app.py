from flask import Flask, render_template, request, jsonify
import schedule
import time
import threading
import json
import os
from scraper import NewsScraper
from mailer import EmailService

app = Flask(__name__)
SUBSCRIBERS_FILE = 'subscribers.json'

def load_subscribers():
    if not os.path.exists(SUBSCRIBERS_FILE):
        return []
    with open(SUBSCRIBERS_FILE, 'r') as f:
        try:
            return json.load(f)
        except:
            return []

def save_subscribers(subs):
    with open(SUBSCRIBERS_FILE, 'w') as f:
        json.dump(subs, f, indent=4)

def run_job():
    print("Running scheduled job...")
    # Use the cache updater to get fresh news
    news = update_cache()
    
    if news:
        recipients = load_subscribers()
        if recipients:
            emailer = EmailService()
            emailer.send_digest(news, recipients)
        else:
            print("No subscribers to send to.")
    else:
        print("No new news found.")

def run_schedule():
    schedule.every().day.at("09:00").do(run_job)
    while True:
        schedule.run_pending()
        time.sleep(1)

# Start scheduler in background
scheduler_thread = threading.Thread(target=run_schedule, daemon=True)
scheduler_thread.start()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/subscribers', methods=['GET'])
def get_subscribers():
    return jsonify(load_subscribers())

@app.route('/api/subscribers', methods=['POST'])
def add_subscriber():
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    subs = load_subscribers()
    if email not in subs:
        subs.append(email)
        save_subscribers(subs)
    
    return jsonify(subs)

@app.route('/api/subscribers', methods=['DELETE'])
def remove_subscriber():
    data = request.json
    email = data.get('email')
    subs = load_subscribers()
    if email in subs:
        subs.remove(email)
        save_subscribers(subs)
    return jsonify(subs)

# Global Cache
NEWS_CACHE = {
    'data': [],
    'last_updated': 0
}
CACHE_DURATION = 1800  # 30 minutes

def update_cache():
    global NEWS_CACHE
    print("Updating news cache...")
    scraper = NewsScraper()
    news = scraper.get_news(lookback_hours=24)
    if news:
        NEWS_CACHE['data'] = news
        NEWS_CACHE['last_updated'] = time.time()
        print(f"Cache updated with {len(news)} articles.")
    return news

def get_cached_news():
    global NEWS_CACHE
    current_time = time.time()
    
    # If cache is empty or stale, refresh
    if not NEWS_CACHE['data'] or (current_time - NEWS_CACHE['last_updated'] > CACHE_DURATION):
        return update_cache()
    
    return NEWS_CACHE['data']

@app.route('/api/news', methods=['GET'])
def get_news_api():
    try:
        # Return cached news to avoid blocking
        # If the cache is empty, this calls update_cache() which might block, 
        # but only for the first user or after restart.
        news = get_cached_news()
        return jsonify(news)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/refresh-cache', methods=['POST'])
def force_refresh():
    threading.Thread(target=update_cache).start()
    return jsonify({'status': 'Background refresh started'})


@app.route('/api/run-now', methods=['POST'])
def trigger_run():
    # Run in a separate thread to not block response
    threading.Thread(target=run_job).start()
    return jsonify({'status': 'Job started'})

if __name__ == '__main__':
    # Warm up cache immediately on startup
    threading.Thread(target=update_cache, daemon=True).start()
    
    print("Starting server on http://localhost:5000 (accessible on network)")
    app.run(debug=True, port=5000, use_reloader=False, host='0.0.0.0') 
    # use_reloader=False to prevent double scheduler execution
