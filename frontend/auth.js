/**
 * ZENTOX-SATHI - Authentication JavaScript
 * Handles login, signup, and OTP verification
 */

// ============================================
// FORM NAVIGATION
// ============================================

function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('otpForm').classList.add('hidden');
}

function showSignup() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
    document.getElementById('otpForm').classList.add('hidden');
}

function showOTP() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('otpForm').classList.remove('hidden');
    startOTPTimer();
}

// ============================================
// FORM HANDLERS
// ============================================

function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Validate inputs
    if (!email || !password) {
        showToast('Error', 'Please fill in all fields', 'error');
        return;
    }

    // Simulate login
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

    setTimeout(() => {
        // Store user session
        const userData = {
            email: email,
            name: email.split('@')[0],
            isLoggedIn: true,
            loginTime: new Date().toISOString()
        };

        if (rememberMe) {
            localStorage.setItem('safeRouteUser', JSON.stringify(userData));
        } else {
            sessionStorage.setItem('safeRouteUser', JSON.stringify(userData));
        }

        showToast('Success', 'Login successful! Redirecting...', 'success');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    }, 1500);
}

function handleSignup(event) {
    event.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('signupEmail').value;
    const phone = document.getElementById('signupPhone').value;
    const city = document.getElementById('signupCity').value;
    const password = document.getElementById('signupPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    // Validate inputs
    if (!firstName || !lastName || !email || !phone || !city || !password) {
        showToast('Error', 'Please fill in all fields', 'error');
        return;
    }

    if (!agreeTerms) {
        showToast('Error', 'Please agree to the terms and conditions', 'error');
        return;
    }

    if (phone.length !== 10) {
        showToast('Error', 'Please enter a valid 10-digit phone number', 'error');
        return;
    }

    if (password.length < 8) {
        showToast('Error', 'Password must be at least 8 characters', 'error');
        return;
    }

    // Simulate signup
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

    setTimeout(() => {
        // Store user data
        const userData = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: '+91' + phone,
            city: city,
            isLoggedIn: true,
            createdAt: new Date().toISOString()
        };

        localStorage.setItem('safeRouteUser', JSON.stringify(userData));

        showToast('Success', 'Account created successfully!', 'success');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    }, 1500);
}

function handleOTP(event) {
    event.preventDefault();

    const otpInputs = document.querySelectorAll('.otp-input');
    let otp = '';
    otpInputs.forEach(input => otp += input.value);

    if (otp.length !== 6) {
        showToast('Error', 'Please enter complete OTP', 'error');
        return;
    }

    // Simulate OTP verification
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

    setTimeout(() => {
        showToast('Success', 'Phone verified successfully!', 'success');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    }, 1500);
}

// ============================================
// OTP HELPERS
// ============================================

function moveToNext(currentInput, index) {
    if (currentInput.value.length === 1) {
        const nextInput = currentInput.nextElementSibling;
        if (nextInput) {
            nextInput.focus();
        }
    }
}

let otpTimerInterval;
function startOTPTimer() {
    let seconds = 30;
    const timerElement = document.getElementById('otpTimer');

    clearInterval(otpTimerInterval);

    otpTimerInterval = setInterval(() => {
        seconds--;
        timerElement.textContent = `(${seconds}s)`;

        if (seconds <= 0) {
            clearInterval(otpTimerInterval);
            timerElement.textContent = '';
        }
    }, 1000);
}

function resendOTP() {
    showToast('Info', 'OTP resent to your phone', 'success');
    startOTPTimer();
}

// ============================================
// SOCIAL LOGIN
// ============================================

function socialLogin(provider) {
    if (provider === 'google') {
        showToast('Info', 'Google login coming soon', 'warning');
    } else if (provider === 'phone') {
        showOTP();
    }
}

// ============================================
// PASSWORD HELPERS
// ============================================

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('.toggle-password i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Password strength checker
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('signupPassword');
    const strengthIndicator = document.getElementById('passwordStrength');

    if (passwordInput && strengthIndicator) {
        passwordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            const strength = checkPasswordStrength(password);

            strengthIndicator.className = 'password-strength';
            if (password.length > 0) {
                strengthIndicator.classList.add(strength);
            }
        });
    }

    // ============================================
    // GSAP ANIMATIONS
    // ============================================
    initGSAPAnimations();
});

// ============================================
// GSAP ANIMATION FUNCTIONS
// ============================================

function initGSAPAnimations() {
    // Check if GSAP is loaded
    if (typeof gsap === 'undefined') {
        console.warn('GSAP not loaded');
        return;
    }

    // Set initial states for animation
    gsap.set('.brand-logo', { opacity: 0, y: -30 });
    gsap.set('.branding-content h1', { opacity: 0, y: 30 });
    gsap.set('.branding-content > p', { opacity: 0, y: 20 });
    gsap.set('.feature-item', { opacity: 0, x: -30 });
    gsap.set('.stat-item', { opacity: 0, y: 30, scale: 0.8 });
    gsap.set('.branding-footer', { opacity: 0 });
    gsap.set('.form-container:not(.hidden)', { opacity: 0, x: 50 });
    gsap.set('.form-header', { opacity: 0, y: -20 });
    gsap.set('.input-group', { opacity: 0, y: 20 });
    gsap.set('.form-options', { opacity: 0 });
    gsap.set('.btn-primary', { opacity: 0, scale: 0.9 });
    gsap.set('.divider', { opacity: 0, scaleX: 0 });
    gsap.set('.social-buttons', { opacity: 0, y: 20 });
    gsap.set('.form-footer', { opacity: 0 });

    // Master timeline for coordinated animations
    const masterTL = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Branding panel animations
    masterTL
        .to('.brand-logo', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'back.out(1.7)'
        })
        .to('.branding-content h1', {
            opacity: 1,
            y: 0,
            duration: 0.7
        }, '-=0.4')
        .to('.branding-content > p', {
            opacity: 1,
            y: 0,
            duration: 0.6
        }, '-=0.4')
        .to('.feature-item', {
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out'
        }, '-=0.3')
        .to('.stat-item', {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.15,
            ease: 'back.out(1.5)',
            onComplete: animateStatNumbers
        }, '-=0.3')
        .to('.branding-footer', {
            opacity: 1,
            duration: 0.5
        }, '-=0.4');

    // Form panel animations (slightly delayed)
    const formTL = gsap.timeline({ defaults: { ease: 'power2.out' }, delay: 0.3 });

    formTL
        .to('.form-container:not(.hidden)', {
            opacity: 1,
            x: 0,
            duration: 0.8
        })
        .to('.form-header', {
            opacity: 1,
            y: 0,
            duration: 0.5
        }, '-=0.5')
        .to('.input-group', {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.1
        }, '-=0.3')
        .to('.form-options', {
            opacity: 1,
            duration: 0.4
        }, '-=0.2')
        .to('.btn-primary', {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: 'back.out(1.5)'
        }, '-=0.2')
        .to('.divider', {
            opacity: 1,
            scaleX: 1,
            duration: 0.5
        }, '-=0.3')
        .to('.social-buttons', {
            opacity: 1,
            y: 0,
            duration: 0.4
        }, '-=0.2')
        .to('.form-footer', {
            opacity: 1,
            duration: 0.4
        }, '-=0.2');

    // Floating animation for brand logo icon
    gsap.to('.brand-logo i', {
        y: -8,
        duration: 1.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
    });

    // Subtle pulse on shield icon
    gsap.to('.brand-logo i', {
        scale: 1.1,
        duration: 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
    });

    // Add hover animations for feature items
    document.querySelectorAll('.feature-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            gsap.to(item, {
                x: 10,
                duration: 0.3,
                ease: 'power2.out'
            });
            gsap.to(item.querySelector('i'), {
                scale: 1.3,
                rotation: 15,
                duration: 0.3
            });
        });
        item.addEventListener('mouseleave', () => {
            gsap.to(item, {
                x: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
            gsap.to(item.querySelector('i'), {
                scale: 1,
                rotation: 0,
                duration: 0.3
            });
        });
    });

    // Add hover animations for input fields
    document.querySelectorAll('.input-field').forEach(field => {
        field.addEventListener('focusin', () => {
            gsap.to(field, {
                scale: 1.02,
                duration: 0.2,
                ease: 'power2.out'
            });
        });
        field.addEventListener('focusout', () => {
            gsap.to(field, {
                scale: 1,
                duration: 0.2,
                ease: 'power2.out'
            });
        });
    });

    // Button hover shimmer effect
    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            gsap.to(btn, {
                scale: 1.03,
                duration: 0.2,
                ease: 'power2.out'
            });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                scale: 1,
                duration: 0.2,
                ease: 'power2.out'
            });
        });
    });

    // Social buttons stagger animation on hover
    document.querySelectorAll('.btn-social').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            gsap.to(btn.querySelector('i'), {
                rotation: 360,
                duration: 0.5,
                ease: 'power2.out'
            });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn.querySelector('i'), {
                rotation: 0,
                duration: 0.3
            });
        });
    });
}

// Animate stat numbers counting up
function animateStatNumbers() {
    document.querySelectorAll('.stat-number').forEach(stat => {
        const text = stat.textContent;
        const numMatch = text.match(/(\d+)/);

        if (numMatch) {
            const targetNum = parseInt(numMatch[1]);
            const suffix = text.replace(/\d+/, '');

            gsap.fromTo(stat,
                { textContent: 0 },
                {
                    textContent: targetNum,
                    duration: 2,
                    ease: 'power1.out',
                    snap: { textContent: 1 },
                    onUpdate: function () {
                        stat.textContent = Math.round(gsap.getProperty(stat, 'textContent')) + suffix;
                    }
                }
            );
        }
    });
}

// Enhanced form switching with GSAP
const originalShowLogin = showLogin;
showLogin = function () {
    if (typeof gsap !== 'undefined') {
        const currentForm = document.querySelector('.form-container:not(.hidden)');
        if (currentForm && currentForm.id !== 'loginForm') {
            gsap.to(currentForm, {
                opacity: 0,
                x: 50,
                duration: 0.3,
                onComplete: () => {
                    originalShowLogin();
                    animateFormIn('loginForm');
                }
            });
        } else {
            originalShowLogin();
        }
    } else {
        originalShowLogin();
    }
};

const originalShowSignup = showSignup;
showSignup = function () {
    if (typeof gsap !== 'undefined') {
        const currentForm = document.querySelector('.form-container:not(.hidden)');
        if (currentForm && currentForm.id !== 'signupForm') {
            gsap.to(currentForm, {
                opacity: 0,
                x: -50,
                duration: 0.3,
                onComplete: () => {
                    originalShowSignup();
                    animateFormIn('signupForm');
                }
            });
        } else {
            originalShowSignup();
        }
    } else {
        originalShowSignup();
    }
};

const originalShowOTP = showOTP;
showOTP = function () {
    if (typeof gsap !== 'undefined') {
        const currentForm = document.querySelector('.form-container:not(.hidden)');
        if (currentForm && currentForm.id !== 'otpForm') {
            gsap.to(currentForm, {
                opacity: 0,
                x: -50,
                duration: 0.3,
                onComplete: () => {
                    originalShowOTP();
                    animateFormIn('otpForm');
                    animateOTPInputs();
                }
            });
        } else {
            originalShowOTP();
        }
    } else {
        originalShowOTP();
    }
};

function animateFormIn(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    gsap.fromTo(form,
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
    );

    // Animate form elements
    gsap.fromTo(form.querySelectorAll('.input-group'),
        { opacity: 0, y: 20 },
        {
            opacity: 1,
            y: 0,
            duration: 0.3,
            stagger: 0.08,
            delay: 0.2
        }
    );
}

function animateOTPInputs() {
    gsap.fromTo('.otp-input',
        { scale: 0, rotation: -180 },
        {
            scale: 1,
            rotation: 0,
            duration: 0.4,
            stagger: 0.1,
            ease: 'back.out(1.7)',
            delay: 0.3
        }
    );
}

function checkPasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 1) return 'weak';
    if (strength <= 2) return 'medium';
    return 'strong';
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(title, message, type = 'success') {
    const container = document.getElementById('toastContainer');

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================
// SESSION CHECK
// ============================================

function checkSession() {
    const user = localStorage.getItem('safeRouteUser') || sessionStorage.getItem('safeRouteUser');

    if (user) {
        const userData = JSON.parse(user);
        if (userData.isLoggedIn) {
            // User is already logged in, redirect to main app
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'index.html';
            }
        }
    }
}

// Check session on page load
checkSession();
