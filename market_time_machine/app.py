import os
import json
from flask import Flask, render_template, jsonify, request
from abc import ABC, abstractmethod

app = Flask(__name__)

# --- Scalable Data Layer ---
class DataProvider(ABC):
    """
    Abstract Base Class for Data Fetching.
    Allows easy swapping between local JSON (MVP) and Paid APIs (Scale).
    """
    @abstractmethod
    def get_scenarios(self):
        """Returns list of available eras."""
        pass

    @abstractmethod
    def get_era_data(self, era_id):
        """Returns detailed simulation data for a specific era."""
        pass

class JsonDataProvider(DataProvider):
    """MVP: Loads data from local JSON files."""
    def __init__(self, data_path='data/scenarios.json'):
        self.data_path = os.path.join(os.path.dirname(__file__), data_path)

    def _load_data(self):
        with open(self.data_path, 'r') as f:
            return json.load(f)

    def get_scenarios(self):
        data = self._load_data()
        # Return summary list for the timeline
        return [
            {
                "id": era["id"],
                "name": era["name"],
                "year_start": era["year_start"],
                "year_end": era["year_end"],
                "description": era["description"]
            }
            for era in data["eras"]
        ]

    def get_era_data(self, era_id):
        data = self._load_data()
        for era in data["eras"]:
            if era["id"] == era_id:
                return era
        return None

# Future: class PolygonApiProvider(DataProvider): ...

# Initialize Provider (Swap this line to scale later!)
data_provider = JsonDataProvider()

# --- Routes ---
@app.route('/')
def index():
    """Timeline Landing Page"""
    scenarios = data_provider.get_scenarios()
    return render_template('index.html', scenarios=scenarios)

@app.route('/simulate/<era_id>')
def simulate(era_id):
    """Simulation Game Interface"""
    data = data_provider.get_era_data(era_id)
    if not data:
        return "Era not found", 404
    return render_template('simulate.html', era=data)

@app.route('/api/data/<era_id>')
def get_data(era_id):
    """JSON API for Chart.js"""
    data = data_provider.get_era_data(era_id)
    if not data:
        return jsonify({"error": "Era not found"}), 404
    return jsonify(data)

if __name__ == '__main__':
    print("Market Time Machine running on http://localhost:5003")
    app.run(debug=True, port=5003)
