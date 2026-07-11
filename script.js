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
        '.about-intro, .hl-item, .im-card, .tf-card, .eco-field, .ci-card, .tp-stage, .rd-card, .ipw-card, .hs-year, .tl-card, .ec-card, .ea-card, .comp-ach-card, .eoc-item, .cm-phase, .about-video-wrapper'
    );
    anims.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    initCounters();
    initAboutVideo();
});

/* ===== About Video — HLS 自适应码率 + 播放控制 ===== */
function initAboutVideo() {
    const video = document.querySelector('.about-video');
    const wrapper = document.querySelector('.about-video-wrapper');
    if (!video || !wrapper) return;

    const placeholder = wrapper.querySelector('.about-video-placeholder');
    const loadingEl = wrapper.querySelector('.about-video-loading');
    const playBtn = wrapper.querySelector('.vc-play-btn');
    const iconPlay = wrapper.querySelector('.vc-icon-play');
    const iconPause = wrapper.querySelector('.vc-icon-pause');
    const muteBtn = wrapper.querySelector('.vc-mute-btn');
    const iconMuted = wrapper.querySelector('.vc-icon-muted');
    const iconVolume = wrapper.querySelector('.vc-icon-volume');
    const volSlider = wrapper.querySelector('.vc-volume-slider');
    const volFill = wrapper.querySelector('.vc-volume-fill');
    const volThumb = wrapper.querySelector('.vc-volume-thumb');
    const volTrack = wrapper.querySelector('.vc-volume-track');
    const progressBar = wrapper.querySelector('.video-progress-bar');
    const progressFill = wrapper.querySelector('.video-progress-fill');
    const progressThumb = wrapper.querySelector('.video-progress-thumb');
    const curTimeEl = wrapper.querySelector('.vc-current');
    const durTimeEl = wrapper.querySelector('.vc-duration');

    const hlsSrc = video.getAttribute('data-hls-src');
    const mp4Src = video.getAttribute('data-mp4-src');

    /* ===================================================
       网络质量检测 — 始终从最低码率起播，快速首帧
       =================================================== */
    function getNetworkStartLevel() {
        return 0; // 强制 360p 起播 — 首帧优先于画质
    }

    /* ===================================================
       CDN 源地址 — jsDelivr 中国节点加速
       =================================================== */
    const CDN_BASE = 'https://cdn.jsdelivr.net/gh/JohnnyDengANU/tech-enterprise@main';
    const ORIGIN_BASE = ''; // GitHub Pages 原始源（降级用）

    function resolveSrc(attrValue) {
        // 如果 data-src 已是绝对 URL，直接使用；否则拼接 CDN
        if (!attrValue) return '';
        if (attrValue.startsWith('http')) return attrValue;
        return CDN_BASE + '/' + attrValue;
    }

    /* ===================================================
       HLS.js 播放器初始化
       =================================================== */
    let hlsInstance = null;
    let loaded = false;
    let cdnFailed = false;

    function loadVideo() {
        if (loaded) return;
        loaded = true;
        wrapper.classList.add('video-loading');

        // 解析源地址 — 优先 CDN，CDN 失败后降级到原始源
        const cdnHlsSrc = cdnFailed ? hlsSrc : resolveSrc(hlsSrc);
        const cdnMp4Src = cdnFailed ? mp4Src : resolveSrc(mp4Src);
        console.log('[Video] HLS源:', cdnHlsSrc, 'MP4降级:', cdnMp4Src);

        // Safari 原生 HLS 支持
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            console.log('[Video] 使用 Safari 原生 HLS');
            video.src = cdnHlsSrc;
            video.load();
        }
        // 其他浏览器使用 hls.js (MSE)
        else if (window.Hls && Hls.isSupported()) {
            hlsInstance = new Hls({
                // ===== 自适应码率 (ABR) 配置 =====
                startLevel: 0,                        // 强制 360p 起播
                capLevelToPlayerSize: true,
                abrEwmaDefaultEstimate: 800000,       // 初始带宽估计 800kbps（更积极）
                abrEwmaLatencyDefaultEstimate: 1,
                abrBandWidthFactor: 0.8,              // 降级阈值更敏感
                abrBandWidthUpFactor: 0.5,            // 升级更保守（避免频繁切换）

                // ===== 缓冲策略 =====
                maxBufferLength: 20,                  // 前方缓冲 20 秒（减少内存）
                maxMaxBufferLength: 40,               // 绝对上限 40 秒
                backBufferLength: 5,                  // 后方保留 5 秒
                maxBufferSize: 30 * 1000 * 1000,      // 30MB 内存上限
                nudgeOffset: 0.2,                     // 更积极的 nudge

                // ===== 分片加载 =====
                fragLoadingTimeOut: 30000,            // 超时 30s（适应跨海网络）
                fragLoadingMaxRetry: 10,              // 最多重试 10 次
                fragLoadingRetryDelay: 1000,          // 重试间隔 1s
                fragLoadingMaxRetryTimeout: 64000,

                // ===== manifest/level 加载 =====
                manifestLoadingTimeOut: 15000,
                manifestLoadingMaxRetry: 5,
                manifestLoadingRetryDelay: 800,
                levelLoadingTimeOut: 30000,
                levelLoadingMaxRetry: 10,
                levelLoadingRetryDelay: 1000,

                // ===== 错误恢复 =====
                enableWorker: true,
                lowLatencyMode: false,
                recoverMediaError: true,
                recoverOnNetworkError: true,

                // ===== XHR 配置 =====
                xhrSetup: function(xhr) {
                    xhr.withCredentials = false;
                }
            });

            hlsInstance.loadSource(cdnHlsSrc);
            hlsInstance.attachMedia(video);

            // 监听 HLS 事件
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, function() {
                console.log('[HLS] manifest 解析完成，共', hlsInstance.levels.length, '个码率等级');
                // 预加载：manifest 解析后立即请求第一个分片
                hlsInstance.startLoad(0);
            });

            hlsInstance.on(Hls.Events.LEVEL_SWITCHED, function(event, data) {
                const level = hlsInstance.levels[data.level];
                const height = level ? level.height : '?';
                const bitrate = level ? Math.round(level.bitrate / 1000) : '?';
                console.log('[HLS] 码率切换至:', height + 'p', bitrate + 'kbps');

                // 更新占位层显示当前质量
                if (placeholder) {
                    var qualityLabel = placeholder.querySelector('.quality-badge');
                    if (!qualityLabel) {
                        qualityLabel = document.createElement('span');
                        qualityLabel.className = 'quality-badge';
                        qualityLabel.style.cssText = 'position:absolute;top:8px;right:8px;background:rgba(196,151,59,0.9);color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;z-index:4;pointer-events:none;';
                        wrapper.appendChild(qualityLabel);
                    }
                    qualityLabel.textContent = height + 'p';
                }
            });

            hlsInstance.on(Hls.Events.ERROR, function(event, data) {
                console.warn('[HLS] 错误:', data.type, data.details);

                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            // 网络错误 — 先尝试降低码率
                            if (hlsInstance.currentLevel > 0) {
                                console.log('[HLS] 网络错误，降低码率至 360p');
                                hlsInstance.currentLevel = 0;
                            }
                            console.log('[HLS] 网络错误，尝试恢复...');
                            hlsInstance.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('[HLS] 媒体错误，尝试恢复...');
                            hlsInstance.recoverMediaError();
                            break;
                        default:
                            // 致命错误 — 如果还在用 CDN，尝试切换到原始源
                            if (!cdnFailed) {
                                console.warn('[HLS] CDN 致命错误，切换到原始源重试');
                                cdnFailed = true;
                                destroyHls();
                                loaded = false;
                                loadVideo();
                            } else {
                                console.error('[HLS] 致命错误，降级到 MP4');
                                destroyHls();
                                loadMp4Fallback();
                            }
                            break;
                    }
                }
            });
        }
        // 完全不支持 HLS — 降级到 H.264 MP4
        else {
            console.warn('[Video] HLS.js 未加载或浏览器不支持 MSE，降级到 MP4');
            loadMp4Fallback();
        }
    }

    function destroyHls() {
        if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
        }
    }

    function loadMp4Fallback() {
        const fallbackMp4 = cdnFailed ? (mp4Src || 'assets/about-intro.mp4') : resolveSrc(mp4Src);
        console.log('[Video] 降级到 MP4 播放:', fallbackMp4);
        video.preload = 'auto';
        var source = document.createElement('source');
        source.src = fallbackMp4;
        source.type = 'video/mp4';
        video.appendChild(source);
        video.load();
    }

    /* ---- 1. 懒加载：视口可见时才加载视频（提前400px预加载） ---- */
    const videoObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting && !loaded) {
                loadVideo();
                videoObs.unobserve(video);
            }
        });
    }, { rootMargin: '400px' });
    videoObs.observe(video);

    /* ---- 2. 视频事件 ---- */
    function showVideo() {
        wrapper.classList.remove('video-loading');
        wrapper.classList.add('video-loaded');
        if (placeholder) placeholder.style.display = 'none';
    }

    video.addEventListener('loadeddata', function() {
        showVideo();
        video.play().catch(function() {});
    });
    video.addEventListener('canplay', showVideo);
    video.addEventListener('waiting', function() { wrapper.classList.add('video-loading'); });
    video.addEventListener('playing', function() { wrapper.classList.remove('video-loading'); });
    video.addEventListener('stalled', function() { wrapper.classList.add('video-loading'); });
    video.addEventListener('error', function() {
        wrapper.classList.remove('video-loading');
        wrapper.classList.add('video-error');
        console.warn('视频加载失败');
    });

    /* ---- 3. 时间格式化 ---- */
    function fmtTime(sec) {
        if (!sec || !isFinite(sec)) return '0:00';
        var m = Math.floor(sec / 60);
        var s = Math.floor(sec % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    /* ---- 4. 播放/暂停按钮 ---- */
    function syncPlayIcon() {
        if (video.paused) {
            iconPlay.style.display = '';
            iconPause.style.display = 'none';
        } else {
            iconPlay.style.display = 'none';
            iconPause.style.display = '';
        }
    }
    video.addEventListener('play', syncPlayIcon);
    video.addEventListener('pause', syncPlayIcon);

    if (playBtn) {
        playBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (video.paused) video.play().catch(function() {});
            else video.pause();
        });
    }

    video.addEventListener('click', function() {
        if (video.paused) video.play().catch(function() {});
        else video.pause();
    });

    /* ---- 5. 静音/音量控制 ---- */
    var lastVolume = 1;

    function syncMuteIcon() {
        if (video.muted || video.volume === 0) {
            iconMuted.style.display = '';
            iconVolume.style.display = 'none';
        } else {
            iconMuted.style.display = 'none';
            iconVolume.style.display = '';
        }
    }

    function updateVolUI() {
        var pct = (video.muted ? 0 : video.volume) * 100;
        if (volFill) volFill.style.width = pct + '%';
        if (volThumb) volThumb.style.left = pct + '%';
        syncMuteIcon();
    }

    if (muteBtn) {
        muteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (video.muted) {
                video.muted = false;
                video.volume = lastVolume || 1;
            } else {
                lastVolume = video.volume;
                video.muted = true;
            }
            updateVolUI();
        });
    }

    if (volTrack) {
        var volDragging = false;

        function volFromEvent(e) {
            var rect = volTrack.getBoundingClientRect();
            var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            return Math.max(0, Math.min(1, x / rect.width));
        }

        function setVol(e) {
            var v = volFromEvent(e);
            video.volume = v;
            video.muted = (v === 0);
            if (v > 0) lastVolume = v;
            updateVolUI();
        }

        volTrack.addEventListener('mousedown', function(e) {
            volDragging = true;
            setVol(e);
            e.preventDefault();
        });
        volTrack.addEventListener('touchstart', function(e) {
            volDragging = true;
            setVol(e);
        }, { passive: true });

        document.addEventListener('mousemove', function(e) {
            if (volDragging) setVol(e);
        });
        document.addEventListener('touchmove', function(e) {
            if (volDragging) setVol(e);
        }, { passive: true });
        document.addEventListener('mouseup', function() { volDragging = false; });
        document.addEventListener('touchend', function() { volDragging = false; });
    }

    video.addEventListener('volumechange', updateVolUI);
    video.volume = 1;
    video.muted = true;
    updateVolUI();

    /* ---- 6. 进度条 ---- */
    var isDragging = false;

    function updateProgress(percent) {
        if (progressFill) progressFill.style.width = percent + '%';
        if (progressThumb) progressThumb.style.left = percent + '%';
    }

    function getPercentFromEvent(e) {
        var rect = progressBar.getBoundingClientRect();
        var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        return Math.max(0, Math.min(100, (x / rect.width) * 100));
    }

    video.addEventListener('timeupdate', function() {
        if (!isDragging && video.duration) {
            updateProgress((video.currentTime / video.duration) * 100);
        }
        if (curTimeEl) curTimeEl.textContent = fmtTime(video.currentTime);
    });

    video.addEventListener('loadedmetadata', function() {
        if (durTimeEl) durTimeEl.textContent = fmtTime(video.duration);
    });

    function onDragStart(e) {
        isDragging = true;
        progressBar.classList.add('dragging');
        var percent = getPercentFromEvent(e);
        if (video.duration) video.currentTime = (percent / 100) * video.duration;
        updateProgress(percent);
        e.preventDefault();
    }
    function onDragMove(e) {
        if (!isDragging) return;
        var percent = getPercentFromEvent(e);
        if (video.duration) video.currentTime = (percent / 100) * video.duration;
        updateProgress(percent);
        e.preventDefault();
    }
    function onDragEnd() {
        isDragging = false;
        progressBar.classList.remove('dragging');
    }

    if (progressBar) {
        progressBar.addEventListener('mousedown', onDragStart);
        progressBar.addEventListener('touchstart', onDragStart, { passive: false });
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('touchmove', onDragMove, { passive: false });
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('touchend', onDragEnd);
    }

    /* ---- 7. 页面不可见时暂停视频（节省资源） ---- */
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && !video.paused) {
            video.pause();
        }
    });
}

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
