/**
 * 同济人工智能（苏州）研究院 — 交互脚本
 */

/* ===== Navbar Scroll ===== */
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveNavLink();
});

/* ===== Mobile Menu ===== */
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
    });
});

/* ===== Active Nav Link ===== */
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id], header[id]');
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');

        if (scrollPos >= top && scrollPos < top + height) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + id) {
                    link.classList.add('active');
                }
            });
        }
    });
}

/* ===== Scroll Animations ===== */
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -40px 0px' };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const anims = document.querySelectorAll(
        '.about-intro, .hl-item, .im-card, .tf-card, .eco-field, .ci-card, .tp-stage'
    );
    anims.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    initCounters();
});

/* ===== Counter Animation ===== */
function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    const counterObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-counter'));
                const duration = 2000;
                const start = performance.now();

                function tick(now) {
                    const p = Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - p, 3);
                    el.textContent = Math.floor(eased * target).toLocaleString();
                    if (p < 1) requestAnimationFrame(tick);
                    else el.textContent = target.toLocaleString();
                }

                requestAnimationFrame(tick);
                counterObs.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(c => counterObs.observe(c));
}

/* ===== Contact Form — 入驻申请邮件通知 ===== */
const contactForm = document.getElementById('contactForm');
const submitBtn = contactForm.querySelector('button[type="submit"]');
const submitBtnHTML = submitBtn.innerHTML;

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 收集表单数据
    const data = {
        name: document.getElementById('cname').value.trim(),
        company: document.getElementById('ccompany').value.trim(),
        phone: document.getElementById('cphone').value.trim(),
        email: document.getElementById('cemail').value.trim(),
        direction: document.getElementById('cdirection').value,
        message: document.getElementById('cmessage').value.trim()
    };

    // 基础验证
    if (!data.name) { showToast('请填写联系人姓名'); return; }
    if (!data.phone) { showToast('请填写联系电话'); return; }

    // 检查邮件服务是否已配置
    if (typeof EmailService !== 'undefined' && !EmailService.isConfigured()) {
        // 未配置邮件服务 — 降级为本地保存
        console.warn('[Form] 邮件服务未配置，请编辑 email-config.js 填入 Access Key');
        showToast('邮件服务尚未配置，请联系管理员设置 email-config.js', 'error');
        return;
    }

    // 进入加载状态
    setSubmitLoading(true, '发送中...');

    try {
        const result = await EmailService.sendApplication(data, (progress) => {
            // 进度回调 — 更新按钮文字
            if (progress.phase === 'retrying') {
                setSubmitLoading(true, `重试中(${progress.attempt}/${progress.maxAttempts})...`);
            } else if (progress.phase === 'waiting_retry') {
                setSubmitLoading(true, `${progress.nextRetryIn}秒后重试...`);
            }
        });

        // 发送成功
        showToast('申请提交成功！我们将在2个工作日内与您联系。', 'success');
        contactForm.reset();

        // 检查是否有历史积压的待发送申请
        const pending = EmailService.getPendingCount();
        if (pending > 0) {
            showToast(`检测到 ${pending} 条历史申请待补发，正在自动重发...`, '');
            EmailService.retryPendingApplications().then(r => {
                if (r.succeeded > 0) {
                    showToast(`已自动补发 ${r.succeeded} 条历史申请`, 'success');
                }
            });
        }

    } catch (error) {
        // 发送失败
        console.error('[Form] 邮件发送失败:', error);

        let msg = '提交失败，请稍后重试';
        if (error.type === 'RATE_LIMITED') {
            msg = error.message;
        } else if (error.type === 'CONFIG_ERROR') {
            msg = '邮件服务配置错误: ' + error.message;
        } else if (error.type === 'VALIDATION_ERROR') {
            msg = error.message;
        } else if (error.savedLocally) {
            msg = '网络异常，您的申请已暂存，恢复网络后将自动补发';
        }

        showToast(msg, 'error');
    } finally {
        setSubmitLoading(false);
    }
});

/**
 * 切换提交按钮的加载状态
 */
function setSubmitLoading(loading, loadingText) {
    if (loading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="btn-spinner"></span> ${loadingText || '处理中...'}`;
        submitBtn.classList.add('btn-loading');
    } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitBtnHTML;
        submitBtn.classList.remove('btn-loading');
    }
}

/* ===== Toast ===== */
function showToast(message, type) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type || ''}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

/* ===== Smooth scroll ===== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const id = this.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (target) {
            e.preventDefault();
            window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
        }
    });
});
