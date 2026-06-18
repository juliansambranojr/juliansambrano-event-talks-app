import os
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Simple in-memory cache
cache = {
    "data": None,
    "last_fetched": None
}

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_releases():
    """Fetches the XML feed and parses it into structured release note entries."""
    response = requests.get(FEED_URL, timeout=10)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch release notes: HTTP {response.status_code}")
    
    root = ET.fromstring(response.content)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = root.findall('atom:entry', ns)
    
    parsed_updates = []
    
    for entry in entries:
        date_str = entry.find('atom:title', ns).text
        updated_str = entry.find('atom:updated', ns).text
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ""
        
        soup = BeautifulSoup(content_html, 'html.parser')
        
        current_category = "General"
        current_content_blocks = []
        
        # Sibling elements are grouped under preceding H2/H3/H4 headers
        for child in soup.children:
            if not child.name:
                continue
            
            if child.name in ['h2', 'h3', 'h4']:
                # Save the accumulated block
                if current_content_blocks or current_category != "General":
                    parsed_updates.append({
                        'date': date_str,
                        'updated': updated_str,
                        'category': current_category,
                        'content': "".join(str(c) for c in current_content_blocks).strip()
                    })
                current_category = child.get_text(strip=True)
                current_content_blocks = []
            else:
                current_content_blocks.append(child)
        
        # Add final block
        if current_content_blocks or current_category != "General":
            parsed_updates.append({
                'date': date_str,
                'updated': updated_str,
                'category': current_category,
                'content': "".join(str(c) for c in current_content_blocks).strip()
            })
            
    return parsed_updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    if force_refresh or cache["data"] is None:
        try:
            updates = fetch_and_parse_releases()
            cache["data"] = updates
            return jsonify({
                "success": True,
                "source": "network",
                "count": len(updates),
                "data": updates
            })
        except Exception as e:
            # Fallback to cache if available on failure
            if cache["data"] is not None:
                return jsonify({
                    "success": True,
                    "source": "cache_fallback",
                    "error": str(e),
                    "count": len(cache["data"]),
                    "data": cache["data"]
                })
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
            
    return jsonify({
        "success": True,
        "source": "cache",
        "count": len(cache["data"]),
        "data": cache["data"]
    })

if __name__ == '__main__':
    # Run on port 8080 or environment port
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)
