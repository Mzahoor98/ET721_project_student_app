# Learnova (Flask Student App)

A small Flask web application that lets students manage:
- **Tasks (To-Do)**
- **Blog posts + likes + comments**
- **Notes** (now supports **image uploads**)

---

## Project structure

- `app.py`
  - Flask application entry point
  - Database models (SQLAlchemy)
  - Routes for authentication, tasks, blog, and notes
- `templates/`
  - Jinja2 HTML templates:
    - `base.html` (shared layout + top navigation)
    - `landing.html` (public landing page)
    - `login.html`, `register.html`
    - `dashboard.html` (summary widgets)
    - `todo.html` (task list + add/toggle/delete)
    - `blog.html`, `new_post.html`, `blog_post.html` (blog + likes/comments)
    - `notes.html` (image uploader + image previews)
- `static/`
  - `static/css/style.css` (site styles)
  - `static/js/main.js` (client-side helpers)
  - `static/uploads/` (uploaded note images)
- `instance/student_app.db`
  - SQLite database created/used by SQLAlchemy
- `TODO.md`
  - Tracking checklist for project changes

---

## Setup & installation

### 1) Create/activate Python environment (recommended)

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2) Install dependencies

```bash
pip install flask flask_sqlalchemy flask_login werkzeug
```

---

## Run the application

From the project root:

```bash
python3 app.py
```

Then open:
- http://127.0.0.1:5000

---

## Notes (image upload)

The Notes page lets logged-in users upload an **image**.
- Upload form posts to: `POST /notes/upload`
- Saved files are stored in: `static/uploads/`
- Each note image is previewed using:
  - `GET /notes/download/<note_id>`

Only image extensions are allowed by the server configuration.

---

## How to use

1. Register a new account (or log in)
2. Go to:
   - **To-Do** to add/complete/delete tasks
   - **Blog** to publish posts and comment
   - **Notes** to upload images and see previews

