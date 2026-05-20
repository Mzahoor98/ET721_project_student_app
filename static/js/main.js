document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupTaskListeners();
    setupBlogListeners();
    setupNoteListeners();
    setupFormValidation();
    setupToasts();
}

function setupTaskListeners() {
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            toggleTaskComplete(this);
        });
    });
    document.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteTask(this);
        });
    });
    const addTaskForm = document.getElementById('add-task-form');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addTask(this);
        });
    }
}

function toggleTaskComplete(checkbox) {
    const taskId = checkbox.dataset.taskId;
    const taskItem = checkbox.closest('.task-item');
    
    if (checkbox.checked) {
        taskItem.classList.add('completed');
    } else {
        taskItem.classList.remove('completed');
    }
}

function deleteTask(button) {
    const taskItem = button.closest('.task-item');
    const taskId = button.dataset.taskId;

    if (confirm('Are you sure you want to delete this task?')) {
        taskItem.style.opacity = '0';
        taskItem.style.transform = 'translateX(-100px)';
        setTimeout(() => {
            taskItem.remove();
        }, 300);
    }
}

function addTask(form) {
    const title = form.querySelector('input[name="title"]').value.trim();
    const category = form.querySelector('select[name="category"]')?.value || 'academic';
    const dueDate = form.querySelector('input[name="due_date"]')?.value || '';

    if (!title) {
        showToast('Please enter a task title', 'warning');
        return;
    }

    // Create task item
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.innerHTML = `
        <input type="checkbox" class="task-checkbox" data-task-id="0">
        <div class="task-content">
            <h4>${escapeHtml(title)}</h4>
            ${dueDate ? `<small class="due-date">Due: ${escapeHtml(dueDate)}</small>` : ''}
            <span class="task-category">${category}</span>
        </div>
        <button type="button" class="delete-task-btn" data-task-id="0">
            <i class="icon">×</i>
        </button>
    `;

    const taskList = document.getElementById('task-list');
    if (taskList) {
        taskList.prepend(taskItem);
        form.reset();
        showToast('Task added successfully!', 'success');

        // Re-attach listeners to new elements
        setupTaskListeners();
    }
}

function setupBlogListeners() {
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleLike(this);
        });
    });
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitComment(this);
        });
    }

    // Delete comment
    document.querySelectorAll('.delete-comment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteComment(this);
        });
    });
    document.querySelectorAll('.delete-post-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            deletePost(this);
        });
    });
}

function toggleLike(button) {
    button.classList.toggle('liked');
    const likeCount = button.querySelector('.like-count');
    
    if (button.classList.contains('liked')) {
        likeCount.textContent = parseInt(likeCount.textContent) + 1;
        button.innerHTML = '❤️ <span class="like-count">' + likeCount.textContent + '</span>';
    } else {
        likeCount.textContent = parseInt(likeCount.textContent) - 1;
        button.innerHTML = '🤍 <span class="like-count">' + likeCount.textContent + '</span>';
    }

    // Optional: Send like to backend
    // const postId = button.dataset.postId;
    // fetch(`/api/post/${postId}/like`, { method: 'POST' });
}

function submitComment(form) {
    const content = form.querySelector('textarea[name="content"]').value.trim();

    if (!content) {
        showToast('Please enter a comment', 'warning');
        return;
    }

    const commentList = document.getElementById('comments-list');
    const commentItem = document.createElement('div');
    commentItem.className = 'comment-item fade-in';
    commentItem.innerHTML = `
        <strong>You</strong>
        <p>${escapeHtml(content)}</p>
        <small>${new Date().toLocaleDateString()}</small>
    `;

    if (commentList) {
        commentList.prepend(commentItem);
        form.reset();
        showToast('Comment added!', 'success');
    }
}

function deleteComment(button) {
    const comment = button.closest('.comment-item');
    if (confirm('Delete this comment?')) {
        comment.style.opacity = '0';
        setTimeout(() => comment.remove(), 300);
    }
}

function deletePost(button) {
    if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
        // Redirect or remove post
        window.location.href = button.dataset.postId ? `/delete-post/${button.dataset.postId}` : '#';
    }
}

function setupNoteListeners() {
    document.querySelectorAll('.delete-note-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteNote(this);
        });
    });
    const fileInput = document.getElementById('note-file');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            showFilePreview(this);
        });
    }

    // Note form submission
    const noteForm = document.getElementById('note-form');
    if (noteForm) {
        noteForm.addEventListener('submit', function(e) {
            validateNoteForm(e, this);
        });
    }
}

function deleteNote(button) {
    const noteItem = button.closest('.note-item');
    if (confirm('Delete this note?')) {
        noteItem.style.opacity = '0';
        noteItem.style.transform = 'scale(0.95)';
        setTimeout(() => noteItem.remove(), 300);
    }
}

function showFilePreview(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const fileName = file.name;
        const fileSize = (file.size / 1024).toFixed(2);

        const preview = document.getElementById('file-preview');
        if (preview) {
            preview.innerHTML = `
                <div class="file-preview-box">
                    <p><strong>File:</strong> ${escapeHtml(fileName)}</p>
                    <p><strong>Size:</strong> ${fileSize} KB</p>
                </div>
            `;
        }
    }
}

function setupFormValidation() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            if (!validateLoginForm(this)) {
                e.preventDefault();
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            if (!validateRegisterForm(this)) {
                e.preventDefault();
            }
        });
    }

    // Blog post form
    const postForm = document.getElementById('post-form');
    if (postForm) {
        postForm.addEventListener('submit', function(e) {
            if (!validatePostForm(this)) {
                e.preventDefault();
            }
        });
    }
}

function validateLoginForm(form) {
    const email = form.querySelector('input[name="email"]')?.value.trim();
    const password = form.querySelector('input[name="password"]')?.value;

    if (!email || !password) {
        showToast('Please fill in all fields', 'danger');
        return false;
    }

    if (!isValidEmail(email)) {
        showToast('Please enter a valid email', 'danger');
        return false;
    }

    return true;
}

function validateRegisterForm(form) {
    const username = form.querySelector('input[name="username"]')?.value.trim();
    const email = form.querySelector('input[name="email"]')?.value.trim();
    const password = form.querySelector('input[name="password"]')?.value;
    const confirmPassword = form.querySelector('input[name="confirm_password"]')?.value;

    if (!username || !email || !password || !confirmPassword) {
        showToast('Please fill in all fields', 'danger');
        return false;
    }

    if (username.length < 3) {
        showToast('Username must be at least 3 characters', 'danger');
        return false;
    }

    if (!isValidEmail(email)) {
        showToast('Please enter a valid email', 'danger');
        return false;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'danger');
        return false;
    }

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'danger');
        return false;
    }

    return true;
}

function validatePostForm(form) {
    const title = form.querySelector('input[name="title"]')?.value.trim();
    const content = form.querySelector('textarea[name="content"]')?.value.trim();

    if (!title || !content) {
        showToast('Please fill in all fields', 'danger');
        return false;
    }

    if (title.length < 5) {
        showToast('Title must be at least 5 characters', 'danger');
        return false;
    }

    if (content.length < 10) {
        showToast('Content must be at least 10 characters', 'danger');
        return false;
    }

    return true;
}

function validateNoteForm(e, form) {
    const title = form.querySelector('input[name="title"]')?.value.trim();
    const file = form.querySelector('input[type="file"]')?.files[0];

    if (!title) {
        e.preventDefault();
        showToast('Please enter a note title', 'danger');
        return;
    }

    if (!file) {
        e.preventDefault();
        showToast('Please select a file', 'danger');
        return;
    }

    const maxSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxSize) {
        e.preventDefault();
        showToast('File size exceeds 16MB limit', 'danger');
        return;
    }
}

function setupToasts() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-20px)';
            setTimeout(() => alert.remove(), 300);
        }, 4000);
        const closeBtn = alert.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                alert.remove();
            });
        }
    });
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
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
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            toast.remove();
        });
    }

    // Auto-dismiss
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

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Add active state to navigation
function setActiveNav() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

setActiveNav();

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

const navToggle = document.querySelector('.nav-toggle');
if (navToggle) {
    navToggle.addEventListener('click', function() {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.classList.toggle('active');
        }
    });
}
