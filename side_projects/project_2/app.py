from flask import Flask, render_template, url_for
import os
import json

app = Flask(__name__)

# Configuration
PHOTO_FOLDER = os.path.join('static', 'photos')
CONTENT_FILE = 'content.json'

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
    """Extracts YouTube ID from URL (Basic implementation)"""
    if 'youtu.be/' in url:
        return url.split('youtu.be/')[1].split('?')[0]
    if 'youtube.com/watch?v=' in url:
        return url.split('v=')[1].split('&')[0]
    return url # Fallback

@app.context_processor
def utility_processor():
    return dict(get_video_id=get_video_id)

@app.route('/')
def home():
    photos = get_photos()
    videos = get_videos()
    return render_template('index.html', photos=photos, videos=videos)

if __name__ == '__main__':
    print(f"Project 2 running locally. Open http://localhost:5002")
    # Put some demo photos if empty?
    app.run(debug=True, port=5002)
