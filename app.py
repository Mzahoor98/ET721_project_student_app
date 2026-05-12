from flask import Flask, render_template, redirect, url_for, request, flash, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
import os

app = Flask(__name__)
app.config["SECRET_KEY"] = "your-secret-key-change-this"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///student_app.db"
app.config["UPLOAD_FOLDER"] = "static/uploads"
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = "login"

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    tasks = db.relationship("Task", backref="user", lazy=True)
    posts = db.relationship("BlogPost", backref="author", lazy=True)
    notes = db.relationship("Note", backref="user", lazy=True)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), default="academic")
    due_date = db.Column(db.String(50), nullable=True)
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

class BlogPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), default="general")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    comments = db.relationship("Comment", backref="post", lazy=True, cascade="all, delete-orphan")
    likes = db.relationship("Like", backref="post", lazy=True, cascade="all, delete-orphan")

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("blog_post.id"), nullable=False)
    user = db.relationship("User", backref="comments")

class Like(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("blog_post.id"), nullable=False)

class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    subject = db.Column(db.String(100), default="General")
    filename = db.Column(db.String(300), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/")
def index():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))
    return render_template("landing.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        user = User.query.filter_by(email=request.form["email"]).first()
        if user and check_password_hash(user.password, request.form["password"]):
            login_user(user)
            return redirect(url_for("dashboard"))
        flash("Invalid email or password.", "danger")
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        if User.query.filter_by(email=request.form["email"]).first():
            flash("Email already registered.", "danger")
            return redirect(url_for("register"))
        hashed_pw = generate_password_hash(request.form["password"])
        user = User(username=request.form["username"], email=request.form["email"], password=hashed_pw)
        db.session.add(user)
        db.session.commit()
        flash("Account created! Please log in.", "success")
        return redirect(url_for("login"))
    return render_template("register.html")

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))

@app.route("/dashboard")
@login_required
def dashboard():
    tasks = Task.query.filter_by(user_id=current_user.id).order_by(Task.created_at.desc()).limit(5).all()
    posts = BlogPost.query.order_by(BlogPost.created_at.desc()).limit(3).all()
    notes = Note.query.filter_by(user_id=current_user.id).order_by(Note.created_at.desc()).limit(4).all()
    return render_template("dashboard.html", tasks=tasks, posts=posts, notes=notes)

@app.route("/todo")
@login_required
def todo():
    tasks = Task.query.filter_by(user_id=current_user.id).order_by(Task.created_at.desc()).all()
    return render_template("todo.html", tasks=tasks)

@app.route("/todo/add", methods=["POST"])
@login_required
def add_task():
    task = Task(title=request.form["title"], category=request.form.get("category", "academic"), due_date=request.form.get("due_date", ""), user_id=current_user.id)
    db.session.add(task)
    db.session.commit()
    flash("Task added!", "success")
    return redirect(url_for("todo"))

@app.route("/todo/complete/<int:task_id>")
@login_required
def complete_task(task_id):
    task = Task.query.get_or_404(task_id)
    if task.user_id == current_user.id:
        task.completed = not task.completed
        db.session.commit()
    return redirect(url_for("todo"))

@app.route("/todo/delete/<int:task_id>")
@login_required
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    if task.user_id == current_user.id:
        db.session.delete(task)
        db.session.commit()
        flash("Task deleted.", "info")
    return redirect(url_for("todo"))

@app.route("/blog")
@login_required
def blog():
    posts = BlogPost.query.order_by(BlogPost.created_at.desc()).all()
    return render_template("blog.html", posts=posts)

@app.route("/blog/new", methods=["GET", "POST"])
@login_required
def new_post():
    if request.method == "POST":
        post = BlogPost(title=request.form["title"], content=request.form["content"], category=request.form.get("category", "general"), user_id=current_user.id)
        db.session.add(post)
        db.session.commit()
        flash("Post published!", "success")
        return redirect(url_for("blog"))
    return render_template("new_post.html")

@app.route("/blog/<int:post_id>")
@login_required
def blog_post(post_id):
    post = BlogPost.query.get_or_404(post_id)
    liked = Like.query.filter_by(user_id=current_user.id, post_id=post_id).first()
    return render_template("blog_post.html", post=post, liked=liked)

@app.route("/blog/<int:post_id>/like")
@login_required
def like_post(post_id):
    existing = Like.query.filter_by(user_id=current_user.id, post_id=post_id).first()
    if existing:
        db.session.delete(existing)
    else:
        db.session.add(Like(user_id=current_user.id, post_id=post_id))
    db.session.commit()
    return redirect(url_for("blog_post", post_id=post_id))

@app.route("/blog/<int:post_id>/comment", methods=["POST"])
@login_required
def add_comment(post_id):
    comment = Comment(content=request.form["content"], user_id=current_user.id, post_id=post_id)
    db.session.add(comment)
    db.session.commit()
    flash("Comment added!", "success")
    return redirect(url_for("blog_post", post_id=post_id))

@app.route("/blog/<int:post_id>/delete")
@login_required
def delete_post(post_id):
    post = BlogPost.query.get_or_404(post_id)
    if post.user_id == current_user.id:
        db.session.delete(post)
        db.session.commit()
        flash("Post deleted.", "info")
    return redirect(url_for("blog"))

@app.route("/notes")
@login_required
def notes():
    all_notes = Note.query.filter_by(user_id=current_user.id).order_by(Note.created_at.desc()).all()
    return render_template("notes.html", notes=all_notes)

@app.route("/notes/upload", methods=["POST"])
@login_required
def upload_note():
    if "file" not in request.files:
        flash("No file selected.", "danger")
        return redirect(url_for("notes"))
    file = request.files["file"]
    if file.filename == "" or not allowed_file(file.filename):
        flash("Invalid file type.", "danger")
        return redirect(url_for("notes"))
    filename = secure_filename(f"{current_user.id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{file.filename}")
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
    note = Note(title=request.form.get("title", file.filename), subject=request.form.get("subject", "General"), filename=filename, user_id=current_user.id)
    db.session.add(note)
    db.session.commit()
    flash("Note uploaded!", "success")
    return redirect(url_for("notes"))

@app.route("/notes/delete/<int:note_id>")
@login_required
def delete_note(note_id):
    note = Note.query.get_or_404(note_id)
    if note.user_id == current_user.id:
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], note.filename)
        if os.path.exists(filepath):
            os.remove(filepath)
        db.session.delete(note)
        db.session.commit()
        flash("Note deleted.", "info")
    return redirect(url_for("notes"))

@app.route("/notes/download/<int:note_id>")
@login_required
def download_note(note_id):
    note = Note.query.get_or_404(note_id)
    if note.user_id == current_user.id:
        return send_from_directory(app.config["UPLOAD_FOLDER"], note.filename, as_attachment=True)
    flash("Access denied.", "danger")
    return redirect(url_for("notes"))

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
