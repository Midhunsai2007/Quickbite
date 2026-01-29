// ===== AUTHENTICATION MODULE =====

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const roleButtons = document.querySelectorAll('.role-btn');
    const roleInput = document.getElementById('role');
    const signupLink = document.getElementById('signup-link');

    // Role selection
    roleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            roleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            roleInput.value = btn.dataset.role;

            // Hide signup link for admin
            if (signupLink) {
                signupLink.style.display = btn.dataset.role === 'admin' ? 'none' : 'block';
            }
        });
    });

    // Show/hide forms
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const loginContainer = document.getElementById('login-form-container');
    const signupContainer = document.getElementById('signup-form-container');

    if (showSignup) {
        showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.style.display = 'none';
            signupContainer.style.display = 'block';
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            signupContainer.style.display = 'none';
            loginContainer.style.display = 'block';
        });
    }

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const selectedRole = roleInput.value;

            if (!username || !password) {
                showToast('Please fill in all fields', 'error');
                return;
            }

            try {
                if (selectedRole === 'admin') {
                    const isValid = await validateAdmin(username, password);
                    if (isValid) {
                        setSession(username, 'admin');
                        showToast('Welcome, Admin!');
                        setTimeout(() => {
                            window.location.href = 'admin.html';
                        }, 500);
                    } else {
                        showToast('Invalid admin credentials', 'error');
                    }
                } else {
                    const user = await validateUser(username, password);
                    if (user) {
                        setSession(username, 'customer');
                        showToast('Welcome back!');
                        setTimeout(() => {
                            window.location.href = 'customer.html';
                        }, 500);
                    } else {
                        showToast('Invalid credentials. Please sign up first.', 'error');
                    }
                }
            } catch (error) {
                showToast('Login failed. Please try again.', 'error');
                console.error('Login error:', error);
            }
        });
    }

    // Signup form submission
    if (signupForm) {
        signupForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const username = document.getElementById('signup-username').value.trim();
            const password = document.getElementById('signup-password').value;
            const confirm = document.getElementById('signup-confirm').value;

            if (!username || !password || !confirm) {
                showToast('Please fill in all fields', 'error');
                return;
            }

            if (password.length < 4) {
                showToast('Password must be at least 4 characters', 'error');
                return;
            }

            if (password !== confirm) {
                showToast('Passwords do not match', 'error');
                return;
            }

            try {
                const user = await registerUser(username, password);
                if (user) {
                    setSession(username, 'customer');
                    showToast('Account created successfully!');
                    setTimeout(() => {
                        window.location.href = 'customer.html';
                    }, 500);
                } else {
                    showToast('Username already exists', 'error');
                }
            } catch (error) {
                showToast('Registration failed. Please try again.', 'error');
                console.error('Registration error:', error);
            }
        });
    }
});

// Toast notification
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
