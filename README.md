# BigQuery Release Notes Web Application

A modern, fast, and responsive web application built with Python Flask and plain vanilla HTML, JavaScript, and CSS that aggregates, parses, and displays Google Cloud BigQuery Release Notes from the official XML feed. 

It organizes updates into an interactive timeline, categorizes them, and provides a built-in Tweet/X preview composer to share individual updates.

---

## 🚀 Key Features

* **Advanced XML Parsing**: Fetches the GCP Atom feed and groups the unstructured HTML inside it into individual update cards by category (Feature, Announcement, Deprecation, Issue).
* **Interactive Timeline UI**: Renders release updates chronologically in a sleek, dark-themed responsive timeline.
* **On-Demand Refresh & Caching**: Employs an in-memory cache to ensure sub-50ms page loads, paired with a manual "Refresh" button that animates a loading spinner and pulls live updates.
* **Instant Filtering & Fuzzy Search**: Fast client-side searching across titles, dates, categories, and descriptions.
* **Interactive Tweet Composer**: Automatically drafts structured updates and opens a customization modal with real-time character limit enforcement (280 characters) before sharing to Twitter/X.

---

## 🛠️ Technology Stack

* **Backend**: Python 3, Flask, Requests, BeautifulSoup4
* **Frontend**: HTML5, Vanilla CSS3 (custom dark slate theme, responsive flexbox/grid layout), Vanilla JS (ES6)
* **API Ingest**: Google Cloud Release Notes Atom Feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`)

---

## 📂 Project Structure

```text
bq-releases-notes/
├── templates/
│   └── index.html      # Main HTML interface & layout structure
├── static/
│   ├── app.js          # Client-side routing, filtering, and modal rendering
│   └── style.css       # Core design styles, timeline lines, and dark mode theme
├── app.py              # Flask server, parsing algorithms, caching, and API routing
├── requirements.txt    # Frozen Python packages
├── .gitignore          # Version control file exclusions
└── README.md           # This project documentation
```

---

## ⚙️ Getting Started

### Prerequisites
* Python 3.8 or higher installed on your machine.

### 1. Set up Virtual Environment & Install Dependencies
Navigate to the project directory and run:

```bash
# Initialize venv
python3 -m venv .venv

# Activate venv & install packages
.venv/bin/pip install -r requirements.txt
```

### 2. Run the Server
Launch the Flask development server locally:

```bash
.venv/bin/python app.py
```

By default, the server runs on `http://localhost:8080`. Open this address in your browser to view the application.

---

## 🔌 API Endpoints

### Get Release Notes
* **Endpoint**: `/api/releases`
* **Method**: `GET`
* **Query Parameters**:
  * `refresh` (optional): Set to `true` (`/api/releases?refresh=true`) to bypass the local cache and query the Google Cloud XML feed directly.
* **Response Preview**:
  ```json
  {
    "success": true,
    "source": "network",
    "count": 66,
    "data": [
      {
        "date": "June 17, 2026",
        "updated": "2026-06-17T00:00:00-07:00",
        "category": "Feature",
        "content": "<p>You can enable autonomous embedding generation on new or existing tables...</p>"
      }
    ]
  }
  ```
