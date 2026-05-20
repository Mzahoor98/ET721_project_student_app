document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  // Defensive: no-op on templates that don't include the expected elements.
  setupTaskListeners();
  setupBlogListeners();
  setupNoteListeners();
  setupFormValidation();
  setupToasts();

  setupNavHelpers();
  setupSmoothAnchorScrolling();
}

const $ = (sel, root = document) => root.querySelector(sel);
const $all = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ---------- Tasks (To-Do) ----------
function setupTaskListeners() {
  // Current UI is mostly server-rendered links; keep JS listeners optional.
  $all('.task-checkbox').forEach(cb => cb.addEventListener('change', () => toggleTaskComplete(cb)));
  $all('.delete-task-btn').forEach(btn => btn.addEventListener('click', () => deleteTask(btn)));
}

function toggleTaskComplete(checkbox) {
  const taskItem = checkbox.closest('.task-item');
  if (!taskItem) return;
  checkbox.checked ? taskItem.classList.add('completed') : taskItem.classList.remove('completed');
}

function deleteTask(button) {
  const taskItem = button.closest('.task-item');
  if (!taskItem) return;
  if (!confirm('Are you sure you want to delete this task?')) return;
  taskItem.style.opacity = '0';
  taskItem.style.transform = 'translateX(-100px)';
  setTimeout(() => taskItem.remove(), 300);
}

// ---------- Blog ----------
function setupBlogListeners() {
  $all('.like-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      toggleLike(btn);
    });
  });

  const commentForm = $('#comment-form');
  if (commentForm) {
    commentForm.addEventListener('submit', e => {
      e.preventDefault();
      submitComment(commentForm);
    });
  }

  $all('.delete-comment-btn').forEach(btn => btn.addEventListener('click', () => deleteComment(btn)));
  $all('.delete-post-btn').forEach(btn => btn.addEventListener('click', () => deletePost(btn)));
}

function toggleLike(button) {
  if (!button) return;
  button.classList.toggle('liked');

  const likeCountEl = button.querySelector('.like-count');
  const current = parseInt(likeCountEl?.textContent || '0', 10);
  const next = button.classList.contains('liked') ? current + 1 : Math.max(0, current - 1);

  if (likeCountEl) likeCountEl.textContent = String(next);
  // If markup exists, update heart icon too.
  if (button.querySelector('.like-count')) {
    button.innerHTML = (button.classList.contains('liked') ? '❤️' : '🤍') + ' <span class="like-count">' + next + '</span>';
  }
}

function submitComment(form) {
  const textarea = form.querySelector('textarea[name="content"]');
  const content = textarea?.value?.trim();
  if (!content) return showToast('Please enter a comment', 'warning');

  const commentList = $('#comments-list');
  if (!commentList) return form.submit?.();

  const commentItem = document.createElement('div');
  commentItem.className = 'comment-item fade-in';
  commentItem.innerHTML = `
    <strong>You</strong>
    <p>${escapeHtml(content)}</p>
    <small>${new Date().toLocaleDateString()}</small>
  `;

  commentList.prepend(commentItem);
  form.reset();
  showToast('Comment added!', 'success');
}

function deleteComment(button) {
  const comment = button.closest('.comment-item');
  if (!comment) return;
  if (!confirm('Delete this comment?')) return;
  comment.style.opacity = '0';
  setTimeout(() => comment.remove(), 300);
}

function deletePost(button) {
  if (!button) return;
  if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
  const postId = button.dataset.postId;
  if (postId) window.location.href = `/delete-post/${postId}`;
}

// ---------- Notes ----------
function setupNoteListeners() {
  $all('.delete-note-btn').forEach(btn => btn.addEventListener('click', () => deleteNote(btn)));

  const fileInput = $('#note-file');
  if (fileInput) fileInput.addEventListener('change', () => showFilePreview(fileInput));

  const noteForm = $('#note-form');
  if (noteForm) noteForm.addEventListener('submit', e => validateNoteForm(e, noteForm));
}

function deleteNote(button) {
  const noteItem = button.closest('.note-item');
  if (!noteItem) return;
  if (!confirm('Delete this note?')) return;
  noteItem.style.opacity = '0';
  noteItem.style.transform = 'scale(0.95)';
  setTimeout(() => noteItem.remove(), 300);
}

function showFilePreview(input) {
  const file = input.files?.[0];
  const preview = $('#file-preview');
  if (!file || !preview) return;

  const fileSize = (file.size / 1024).toFixed(2);
  preview.innerHTML = `
    <div class="file-preview-box">
      <p><strong>File:</strong> ${escapeHtml(file.name)}</p>
      <p><strong>Size:</strong> ${fileSize} KB</p>
    </div>
  `;
}

function validateNoteForm(e, form) {
  const title = form.querySelector('input[name="title"]')?.value?.trim();
  const file = form.querySelector('input[type="file"]')?.files?.[0];
  const maxSize = 16 * 1024 * 1024;

  if (!title) {
    e.preventDefault();
    return showToast('Please enter a note title', 'danger');
  }
  if (!file) {
    e.preventDefault();
    return showToast('Please select a file', 'danger');
  }
  if (file.size > maxSize) {
    e.preventDefault();
    return showToast('File size exceeds 16MB limit', 'danger');
  }
}

// ---------- Forms / Validation ----------
function setupFormValidation() {
  const loginForm = $('#login-form');
  if (loginForm) loginForm.addEventListener('submit', function (e) {
    if (!validateLoginForm(this)) e.preventDefault();
  });

  const registerForm = $('#register-form');
  if (registerForm) registerForm.addEventListener('submit', function (e) {
    if (!validateRegisterForm(this)) e.preventDefault();
  });

  const postForm = $('#post-form');
  if (postForm) postForm.addEventListener('submit', function (e) {
    if (!validatePostForm(this)) e.preventDefault();
  });
}

function validateLoginForm(form) {
  const email = form.querySelector('input[name="email"]')?.value?.trim();
  const password = form.querySelector('input[name="password"]')?.value;
  if (!email || !password) return showToast('Please fill in all fields', 'danger'), false;
  if (!isValidEmail(email)) return showToast('Please enter a valid email', 'danger'), false;
  return true;
}

function validateRegisterForm(form) {
  const username = form.querySelector('input[name="username"]')?.value?.trim();
  const email = form.querySelector('input[name="email"]')?.value?.trim();
  const password = form.querySelector('input[name="password"]')?.value;
  const confirmPassword = form.querySelector('input[name="confirm_password"]')?.value;

  if (!username || !email || !password || !confirmPassword) return showToast('Please fill in all fields', 'danger'), false;
  if (username.length < 3) return showToast('Username must be at least 3 characters', 'danger'), false;
  if (!isValidEmail(email)) return showToast('Please enter a valid email', 'danger'), false;
  if (password.length < 6) return showToast('Password must be at least 6 characters', 'danger'), false;
  if (password !== confirmPassword) return showToast('Passwords do not match', 'danger'), false;
  return true;
}

function validatePostForm(form) {
  const title = form.querySelector('input[name="title"]')?.value?.trim();
  const content = form.querySelector('textarea[name="content"]')?.value?.trim();
  if (!title || !content) return showToast('Please fill in all fields', 'danger'), false;
  if (title.length < 5) return showToast('Title must be at least 5 characters', 'danger'), false;
  if (content.length < 10) return showToast('Content must be at least 10 characters', 'danger'), false;
  return true;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------- Toasts ----------
function setupToasts() {
  $all('.alert').forEach(alert => {
    setTimeout(() => {
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-20px)';
      setTimeout(() => alert.remove(), 300);
    }, 4000);

    const closeBtn = alert.querySelector('.close');
    if (closeBtn) closeBtn.addEventListener('click', () => alert.remove());
  });
}

function showToast(message, type = 'info') {
  const toastContainer = $('#toast-container') || createToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast alert alert-${type}`;
  toast.innerHTML = `
    <button type="button" class="close" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
    ${escapeHtml(message)}
  `;

  toastContainer.appendChild(toast);

  const closeBtn = toast.querySelector('.close');
  if (closeBtn) closeBtn.addEventListener('click', () => toast.remove());

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// ---------- Helpers ----------
function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '<', '>': '>', '"': '"', "'": '&#039;' };
  return String(text ?? '').replace(/[&<>"']/g, m => map[m]);
}

function setupNavHelpers() {
  const currentPath = window.location.pathname;
  $all('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) link.classList.add('active');
  });
}

function setupSmoothAnchorScrolling() {
  $all('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  const navToggle = $('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const navMenu = document.querySelector('.nav-menu');
      if (navMenu) navMenu.classList.toggle('active');
    });
  }
}

