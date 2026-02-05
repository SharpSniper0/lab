from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import json
import os
from functools import wraps

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev_key_for_session')

# Configuration
DATA_FILE = os.path.join('data', 'content.json')

def load_content():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_content(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

# Login Decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    content = load_content()
    return render_template('index.html', content=content)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        password = request.form.get('password')
        # Simple env-based auth
        if password == os.environ.get('ADMIN_PASSWORD', 'admin'):
            session['logged_in'] = True
            return redirect(url_for('admin'))
        else:
            return render_template('login.html', error="Invalid password")
    return render_template('login.html')

@app.route('/admin')
@login_required
def admin():
    content = load_content()
    return render_template('admin.html', content=content)

@app.route('/api/save', methods=['POST'])
@login_required
def api_save():
    new_data = request.json
    save_content(new_data)
    return jsonify({"status": "success"})

# Stub for Gemini AI
@app.route('/api/refine', methods=['POST'])
@login_required
def api_refine():
    text = request.json.get('text')
    api_key = os.environ.get('GEMINI_API_KEY')
    
    if not api_key:
        return jsonify({"suggestion": "Error: GEMINI_API_KEY not found in environment."})

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash') # Using newer model if avail, or pro

        prompt = f"""
        Act as a senior executive coach. Rewrite the text below to be "Executive Style":
        1. Concise and high-impact.
        2. Focus on decision-making, constraints, and outcomes.
        3. Remove fluff and buzzwords.
        
        Input Text:
        "{text}"
        """
        
        response = model.generate_content(prompt)
        return jsonify({"suggestion": response.text})
    except Exception as e:
        return jsonify({"suggestion": f"AI Error: {str(e)}"})

if __name__ == '__main__':
    app.run(debug=True)
