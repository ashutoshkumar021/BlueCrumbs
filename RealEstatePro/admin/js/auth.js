document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const statusMessage = document.getElementById('login-status');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('toggle-password');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            statusMessage.textContent = '';
            
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                // Check if response is JSON
                const contentType = response.headers.get("content-type");
                let result;
                
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    result = await response.json();
                } else {
                    // If not JSON, likely server is not running or returning HTML error
                    const text = await response.text();
                    console.error('Non-JSON response:', text);
                    throw new Error('Server error. Please ensure the server is running properly.');
                }

                if (!response.ok) {
                    throw new Error(result.error || result.message || 'Login failed');
                }
                
                showToaster(result.message, 'success');
                localStorage.setItem('adminToken', result.token);
                setTimeout(() => {
                    window.location.href = '/admin/dashboard.html';
                }, 1500);

            } catch (error) {
                statusMessage.textContent = error.message;
                showToaster(error.message, 'error');
            }
        });
    }

    if (passwordInput && togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                togglePasswordBtn.textContent = 'Hide';
            } else {
                passwordInput.type = 'password';
                togglePasswordBtn.textContent = 'Show';
            }
        });
    }
});

function showToaster(message, type) {
    const toaster = document.getElementById('toaster');
    toaster.textContent = message;
    toaster.className = `show ${type}`;
    setTimeout(() => {
        toaster.className = toaster.className.replace('show', '');
    }, 2000);
}

// Password Reset Functionality
const forgotPasswordLink = document.getElementById('forgot-password');
const resetModal = document.getElementById('reset-modal');
const resetForm = document.getElementById('reset-form');
const cancelResetBtn = document.getElementById('cancel-reset');
const resetStatus = document.getElementById('reset-status');
const sendOtpBtn = document.getElementById('send-otp');

if (forgotPasswordLink && resetModal) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        resetModal.style.display = 'block';
    });
}

if (cancelResetBtn && resetModal && resetForm && resetStatus) {
    cancelResetBtn.addEventListener('click', () => {
        resetModal.style.display = 'none';
        resetForm.reset();
        resetStatus.textContent = '';
        resetStatus.style.color = '#666';
    });
}

if (sendOtpBtn && resetStatus) {
    sendOtpBtn.addEventListener('click', async () => {
        const email = document.getElementById('reset-email').value;
        if (!email) {
            resetStatus.style.color = 'red';
            resetStatus.textContent = 'Please enter admin email first.';
            return;
        }

        resetStatus.style.color = '#666';
        resetStatus.textContent = 'Sending OTP...';

        try {
            const response = await fetch('/api/admin/request-reset-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const contentType = response.headers.get("content-type");
            let result;

            if (contentType && contentType.indexOf("application/json") !== -1) {
                result = await response.json();
            } else {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned an invalid response. Please ensure the server is running.');
            }

            if (response.ok) {
                resetStatus.style.color = 'green';
                resetStatus.textContent = result.message || 'OTP sent to your email.';
            } else {
                resetStatus.style.color = 'red';
                resetStatus.textContent = result.error || 'Failed to send OTP';
            }
        } catch (error) {
            resetStatus.style.color = 'red';
            resetStatus.textContent = 'Error: ' + error.message;
        }
    });
}

if (resetForm && resetStatus) {
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('reset-email').value;
        const otp = document.getElementById('reset-otp').value;
        const newPassword = document.getElementById('new-password').value;

        try {
            const response = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword })
            });

            const contentType = response.headers.get("content-type");
            let result;

            if (contentType && contentType.indexOf("application/json") !== -1) {
                result = await response.json();
            } else {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned an invalid response. Please ensure the server is running.');
            }

            if (response.ok) {
                resetStatus.style.color = 'green';
                resetStatus.textContent = 'Password reset successfully! You can now login.';
                setTimeout(() => {
                    resetModal.style.display = 'none';
                    resetForm.reset();
                    resetStatus.textContent = '';
                    resetStatus.style.color = '#666';
                }, 2000);
            } else {
                resetStatus.style.color = 'red';
                resetStatus.textContent = result.error || result.message || 'Failed to reset password';
            }
        } catch (error) {
            resetStatus.style.color = 'red';
            resetStatus.textContent = 'Error: ' + error.message;
        }
    });
}