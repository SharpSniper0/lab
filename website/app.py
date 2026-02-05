from flask import Flask, render_template, url_for
import os
import json
import time
from dotenv import load_dotenv
import yt_dlp

load_dotenv()

app = Flask(__name__)

# Configuration
PHOTO_FOLDER = os.path.join('static', 'photos')
CONTENT_FILE = os.path.join('content', 'content.json')
MUSIC_CHANNEL_ID = os.environ.get('MUSIC_CHANNEL_ID')

# Cache for music
MUSIC_CACHE = {
    'data': [],
    'last_updated': 0
}
CACHE_DURATION = 43200 # 12 hours

def get_latest_songs():
    """Fetches top 5 videos from the channel's Uploads playlist."""
    global MUSIC_CACHE
    if not MUSIC_CHANNEL_ID:
        return []

    # Check cache
    if time.time() - MUSIC_CACHE['last_updated'] < CACHE_DURATION and MUSIC_CACHE['data']:
        return MUSIC_CACHE['data']
    
    # Fetch fresh
    try:
        # Convert Channel ID (UC...) to Uploads Playlist ID (UU...)
        # If it's already a playlist (PL...) or uploads (UU...), use as is.
        if MUSIC_CHANNEL_ID.startswith('UC'):
             playlist_id = MUSIC_CHANNEL_ID.replace('UC', 'UU', 1) 
        else:
             playlist_id = MUSIC_CHANNEL_ID
        playlist_url = f"https://www.youtube.com/playlist?list={playlist_id}"
        
        ydl_opts = {
            'quiet': True,
            'extract_flat': True,
            'playlistend': 9,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(playlist_url, download=False)
            if 'entries' in info:
                # Return list of full URLs
                urls = [f"https://www.youtube.com/watch?v={entry['id']}" for entry in info['entries']]
                MUSIC_CACHE['data'] = urls
                MUSIC_CACHE['last_updated'] = time.time()
                print(f"Refreshed Music Cache: {len(urls)} songs")
                return urls
    except Exception as e:
        print(f"Error fetching music: {e}")
        return MUSIC_CACHE['data'] # Return old data if fail
    
    return []

def get_photos():
    """Returns a list of filenames in the photo folder."""
    if not os.path.exists(PHOTO_FOLDER):
        os.makedirs(PHOTO_FOLDER)
    
    # Get all valid image files
    files = [f for f in os.listdir(PHOTO_FOLDER) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))]
    return files

def get_videos():
    """Reads video links from content.json"""
    if not os.path.exists(CONTENT_FILE):
        return {}
    with open(CONTENT_FILE, 'r') as f:
        try:
            return json.load(f)
        except:
            return {}

def get_video_id(url):
    """Extracts YouTube ID from URL (Handles standard and YT Music links)"""
    # Handle known patterns
    if 'youtu.be/' in url:
        return url.split('youtu.be/')[1].split('?')[0]
    
    if 'v=' in url: # Covers youtube.com and music.youtube.com
        return url.split('v=')[1].split('&')[0]
        
    return url # Fallback

@app.context_processor
def utility_processor():
    return dict(get_video_id=get_video_id)

@app.route('/')
def home():
    photos = get_photos()
    videos = get_videos()
    
    # Overwrite the 'music' key in videos if we have dynamic data
    latest_music = get_latest_songs()
    if latest_music:
        videos['music'] = latest_music
        
    return render_template('index.html', photos=photos, videos=videos)

@app.after_request
def add_header(response):
    """
    Add headers to disable caching so updates appear instantly.
    """
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

if __name__ == '__main__':
    print(f"Project 2 running locally. Open http://localhost:5002")
    # Put some demo photos if empty?
    app.run(debug=True, port=5002)
