/**
 * ============================================================
 *  邮件服务模块 — 同济人工智能（苏州）研究院
 * ============================================================
 *
 *  功能清单：
 *    1. HTML 邮件模板生成（专业品牌风格）
 *    2. 多服务商适配（Web3Forms / Formspree / EmailJS）
 *    3. 指数退避重试机制
 *    4. 完善的错误处理（网络错误/超时/限流/服务端错误）
 *    5. 本地存储降级（所有重试失败后保存到 localStorage）
 *    6. 防刷限流（最小提交间隔检查）
 *
 *  依赖：email-config.js（需在本文件之前加载）
 * ============================================================
 */

const EmailService = (function () {

    'use strict';

    /* ========================================================
     *  第一部分：HTML 邮件模板
     * ======================================================== */

    /**
     * 生成专业风格的 HTML 邮件内容
     * @param {Object} data - 申请数据
     * @returns {string} HTML 邮件字符串
     */
    function buildEmailHTML(data) {
        const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        const dir = data.direction || '未选择';

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- 邮件头部 -->
        <tr>
          <td style="background:linear-gradient(135deg,#1B3A5C 0%,#2a5a8c 100%);padding:32px 40px;text-align:center;">
            <div style="font-size:20px;font-weight:700;color:#C4973B;letter-spacing:1px;margin-bottom:8px;">同济人工智能（苏州）研究院</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:0.5px;">Tongji Research Institute of Artificial Intelligence (Suzhou)</div>
            <div style="margin-top:16px;display:inline-block;background:rgba(196,151,59,0.15);border:1px solid rgba(196,151,59,0.4);border-radius:20px;padding:6px 20px;">
              <span style="font-size:14px;color:#C4973B;font-weight:600;">新入驻申请通知</span>
            </div>
          </td>
        </tr>

        <!-- 申请人信息 -->
        <tr>
          <td style="padding:32px 40px 8px;">
            <div style="font-size:16px;color:#1a1a1a;font-weight:600;margin-bottom:20px;">申请人信息</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="padding:10px 16px;background:#f8f9fb;border-radius:6px 0 0 6px;font-size:13px;color:#666;width:100px;border-left:3px solid #1B3A5C;">联系人</td>
                <td style="padding:10px 16px;font-size:14px;color:#1a1a1a;font-weight:500;">${escapeHTML(data.name)}</td>
              </tr>
              <tr><td style="height:6px;"></td></tr>
              <tr>
                <td style="padding:10px 16px;background:#f8f9fb;border-radius:6px 0 0 6px;font-size:13px;color:#666;border-left:3px solid #1B3A5C;">企业/团队</td>
                <td style="padding:10px 16px;font-size:14px;color:#1a1a1a;font-weight:500;">${escapeHTML(data.company) || '—'}</td>
              </tr>
              <tr><td style="height:6px;"></td></tr>
              <tr>
                <td style="padding:10px 16px;background:#f8f9fb;border-radius:6px 0 0 6px;font-size:13px;color:#666;border-left:3px solid #1B3A5C;">联系电话</td>
                <td style="padding:10px 16px;font-size:14px;color:#1a1a1a;font-weight:500;">${escapeHTML(data.phone)}</td>
              </tr>
              <tr><td style="height:6px;"></td></tr>
              <tr>
                <td style="padding:10px 16px;background:#f8f9fb;border-radius:6px 0 0 6px;font-size:13px;color:#666;border-left:3px solid #1B3A5C;">电子邮箱</td>
                <td style="padding:10px 16px;font-size:14px;color:#1a1a1a;font-weight:500;">${escapeHTML(data.email) || '—'}</td>
              </tr>
              <tr><td style="height:6px;"></td></tr>
              <tr>
                <td style="padding:10px 16px;background:#f8f9fb;border-radius:6px 0 0 6px;font-size:13px;color:#666;border-left:3px solid #1B3A5C;">关注方向</td>
                <td style="padding:10px 16px;font-size:14px;color:#1a1a1a;font-weight:500;">${escapeHTML(dir)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- 项目简介 -->
        <tr>
          <td style="padding:24px 40px 32px;">
            <div style="font-size:16px;color:#1a1a1a;font-weight:600;margin-bottom:12px;">项目简介</div>
            <div style="background:#f8f9fb;border-radius:8px;padding:16px 20px;font-size:14px;line-height:1.8;color:#333;border-left:3px solid #C4973B;">
              ${escapeHTML(data.message) || '申请人未填写项目简介'}
            </div>
          </td>
        </tr>

        <!-- 提交信息 -->
        <tr>
          <td style="padding:0 40px 32px;">
            <div style="border-top:1px solid #eee;padding-top:16px;font-size:12px;color:#999;">
              <div>提交时间：${time} (UTC+8)</div>
              <div style="margin-top:4px;">来源页面：官网入驻申请表单</div>
              <div style="margin-top:4px;">提交IP：由邮件服务自动记录</div>
            </div>
          </td>
        </tr>

        <!-- 邮件底部 -->
        <tr>
          <td style="background:#1B3A5C;padding:20px 40px;text-align:center;">
            <div style="font-size:13px;color:rgba(255,255,255,0.6);">
              此邮件由同济人工智能（苏州）研究院官网自动发送，请勿直接回复
            </div>
            <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-top:6px;">
              © 2024 Tongji Research Institute of Artificial Intelligence (Suzhou)
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
    }

    /**
     * 生成纯文本邮件内容（备用）
     */
    function buildEmailText(data) {
        const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        return [
            '同济人工智能（苏州）研究院 — 新入驻申请通知',
            '============================================',
            '',
            `联系人：${data.name}`,
            `企业/团队：${data.company || '—'}`,
            `联系电话：${data.phone}`,
            `电子邮箱：${data.email || '—'}`,
            `关注方向：${data.direction || '未选择'}`,
            '',
            '项目简介：',
            data.message || '申请人未填写项目简介',
            '',
            '--------------------------------------------',
            `提交时间：${time} (UTC+8)`,
            '来源页面：官网入驻申请表单',
        ].join('\n');
    }

    /**
     * HTML 转义，防止 XSS
     */
    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    /* ========================================================
     *  第二部分：多服务商适配层
     * ======================================================== */

    /**
     * Web3Forms 发送
     * 文档: https://docs.web3forms.com
     */
    async function sendViaWeb3Forms(data) {
        const cfg = EMAIL_CONFIG.web3forms;
        if (!cfg.accessKey || cfg.accessKey === 'YOUR_WEB3FORMS_ACCESS_KEY') {
            throw { type: 'CONFIG_ERROR', message: 'Web3Forms Access Key 未配置' };
        }

        const payload = {
            access_key: cfg.accessKey,
            subject: fillTemplate(EMAIL_CONFIG.template.subject, data),
            from_name: EMAIL_CONFIG.fromName,
            to: EMAIL_CONFIG.recipient,
            cc: EMAIL_CONFIG.cc || undefined,
            // 结构化字段
            name: data.name,
            company: data.company,
            phone: data.phone,
            email: data.email,
            direction: data.direction,
            message: data.message,
            // HTML 邮件体
            html: buildEmailHTML(data),
        };

        const resp = await fetchWithTimeout('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const result = await resp.json();

        if (!result.success) {
            throw { type: 'API_ERROR', message: result.message || 'Web3Forms 返回失败', status: resp.status };
        }

        return { success: true, provider: 'web3forms', messageId: result.message_id };
    }

    /**
     * Formspree 发送
     * 文档: https://help.formspree.io
     */
    async function sendViaFormspree(data) {
        const cfg = EMAIL_CONFIG.formspree;
        if (!cfg.formId || cfg.formId === 'YOUR_FORMSPREE_FORM_ID') {
            throw { type: 'CONFIG_ERROR', message: 'Formspree Form ID 未配置' };
        }

        const formData = new FormData();
        formData.append('_subject', fillTemplate(EMAIL_CONFIG.template.subject, data));
        formData.append('name', data.name);
        formData.append('company', data.company || '');
        formData.append('phone', data.phone);
        formData.append('email', data.email || '');
        formData.append('direction', data.direction || '');
        formData.append('message', data.message || '');
        formData.append('html_body', buildEmailHTML(data));

        const resp = await fetchWithTimeout(`https://formspree.io/f/${cfg.formId}`, {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: formData,
        });

        const result = await resp.json();

        if (!resp.ok) {
            throw { type: 'API_ERROR', message: result.error || 'Formspree 返回失败', status: resp.status };
        }

        return { success: true, provider: 'formspree' };
    }

    /**
     * EmailJS 发送
     * 文档: https://www.emailjs.com/docs
     */
    async function sendViaEmailJS(data) {
        const cfg = EMAIL_CONFIG.emailjs;
        if (!cfg.serviceId || cfg.serviceId === 'YOUR_SERVICE_ID') {
            throw { type: 'CONFIG_ERROR', message: 'EmailJS Service ID 未配置' };
        }

        // 动态加载 EmailJS SDK
        if (typeof emailjs === 'undefined') {
            await loadScript('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js');
            emailjs.init({ publicKey: cfg.publicKey });
        }

        const templateParams = {
            to_email: EMAIL_CONFIG.recipient,
            subject: fillTemplate(EMAIL_CONFIG.template.subject, data),
            from_name: EMAIL_CONFIG.fromName,
            applicant_name: data.name,
            applicant_company: data.company || '—',
            applicant_phone: data.phone,
            applicant_email: data.email || '—',
            applicant_direction: data.direction || '未选择',
            applicant_message: data.message || '未填写',
            html_content: buildEmailHTML(data),
        };

        const result = await emailjs.send(cfg.serviceId, cfg.templateId, templateParams);
        return { success: true, provider: 'emailjs', messageId: result.text };
    }

    /**
     * 根据配置选择服务商发送
     */
    async function sendByProvider(data) {
        switch (EMAIL_CONFIG.provider) {
            case 'web3forms':  return sendViaWeb3Forms(data);
            case 'formspree':  return sendViaFormspree(data);
            case 'emailjs':    return sendViaEmailJS(data);
            default:
                throw { type: 'CONFIG_ERROR', message: `未知的服务商: ${EMAIL_CONFIG.provider}` };
        }
    }


    /* ========================================================
     *  第三部分：指数退避重试机制
     * ======================================================== */

    /**
     * 计算第 n 次重试的延迟时间
     */
    function calculateDelay(attempt) {
        const cfg = EMAIL_CONFIG.retry;
        let delay = cfg.baseDelay * Math.pow(cfg.backoffFactor, attempt);

        // 添加随机抖动（避免多个客户端同时重试）
        if (cfg.jitter) {
            delay = delay * (0.5 + Math.random() * 0.5);
        }

        return Math.min(delay, cfg.maxDelay);
    }

    /**
     * 判断错误是否可重试
     */
    function isRetryable(error) {
        // 配置错误不重试
        if (error.type === 'CONFIG_ERROR') return false;

        // 网络错误/超时可重试
        if (error.type === 'NETWORK_ERROR' || error.type === 'TIMEOUT') return true;

        // HTTP 状态码判断
        const status = error.status || 0;
        if (status === 0) return true;         // 网络不通
        if (status === 408) return true;        // 请求超时
        if (status === 429) return true;        // 限流
        if (status >= 500) return true;         // 服务端错误
        if (status >= 400) return false;        // 客户端错误（参数问题等）

        return true; // 未知错误默认重试
    }

    /**
     * 带重试的发送
     */
    async function sendWithRetry(data, onProgress) {
        const maxRetries = EMAIL_CONFIG.retry.maxRetries;
        let lastError = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (onProgress) {
                    onProgress({
                        phase: attempt === 0 ? 'sending' : 'retrying',
                        attempt: attempt + 1,
                        maxAttempts: maxRetries + 1,
                    });
                }

                const result = await sendByProvider(data);
                return result;

            } catch (error) {
                lastError = error;

                // 不可重试的错误直接抛出
                if (!isRetryable(error)) {
                    throw error;
                }

                // 已达最大重试次数
                if (attempt >= maxRetries) {
                    throw {
                        ...error,
                        type: error.type || 'RETRY_EXHAUSTED',
                        message: `重试 ${maxRetries} 次后仍失败: ${error.message || '未知错误'}`,
                        attempts: attempt + 1,
                    };
                }

                // 等待退避时间
                const delay = calculateDelay(attempt);
                if (onProgress) {
                    onProgress({
                        phase: 'waiting_retry',
                        attempt: attempt + 1,
                        maxAttempts: maxRetries + 1,
                        nextRetryIn: Math.round(delay / 1000),
                    });
                }

                await sleep(delay);
            }
        }

        throw lastError;
    }


    /* ========================================================
     *  第四部分：降级策略 — 本地存储
     * ======================================================== */

    /**
     * 将失败的申请保存到 localStorage
     */
    function saveToLocalStorage(data) {
        if (!EMAIL_CONFIG.fallback.enableLocalStorage) return;
        if (typeof localStorage === 'undefined') return;

        try {
            const key = EMAIL_CONFIG.fallback.storageKey;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push({
                data: data,
                timestamp: Date.now(),
                status: 'pending',
            });
            localStorage.setItem(key, JSON.stringify(existing));
        } catch (e) {
            console.error('[EmailService] localStorage 保存失败:', e);
        }
    }

    /**
     * 获取本地存储中待重发的申请
     */
    function getPendingApplications() {
        if (typeof localStorage === 'undefined') return [];
        try {
            const key = EMAIL_CONFIG.fallback.storageKey;
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch (e) {
            return [];
        }
    }

    /**
     * 重发本地存储中的待处理申请
     */
    async function retryPendingApplications(onProgress) {
        const pending = getPendingApplications();
        if (pending.length === 0) return { retried: 0, succeeded: 0, failed: 0 };

        let succeeded = 0, failed = 0;
        const key = EMAIL_CONFIG.fallback.storageKey;
        const remaining = [];

        for (const item of pending) {
            try {
                await sendByProvider(item.data);
                succeeded++;
            } catch (e) {
                failed++;
                remaining.push(item);
            }
        }

        localStorage.setItem(key, JSON.stringify(remaining));
        return { retried: pending.length, succeeded, failed };
    }


    /* ========================================================
     *  第五部分：防刷限流
     * ======================================================== */

    function checkRateLimit() {
        if (typeof localStorage === 'undefined') return { allowed: true };
        const minInterval = EMAIL_CONFIG.rateLimit.minInterval;
        const key = 'tjai_last_submit_time';
        const lastTime = parseInt(localStorage.getItem(key) || '0');
        const now = Date.now();
        const elapsed = now - lastTime;

        if (elapsed < minInterval) {
            return {
                allowed: false,
                remainingSeconds: Math.ceil((minInterval - elapsed) / 1000),
            };
        }

        return { allowed: true };
    }

    function recordSubmitTime() {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem('tjai_last_submit_time', String(Date.now()));
    }


    /* ========================================================
     *  第六部分：工具函数
     * ======================================================== */

    /**
     * 带超时的 fetch
     */
    function fetchWithTimeout(url, options) {
        const timeout = EMAIL_CONFIG.timeout;
        return new Promise((resolve, reject) => {
            const controller = new AbortController();
            const timer = setTimeout(() => {
                controller.abort();
                reject({ type: 'TIMEOUT', message: `请求超时 (${timeout / 1000}s)` });
            }, timeout);

            fetch(url, { ...options, signal: controller.signal })
                .then(resolve)
                .catch(err => {
                    if (err.name === 'AbortError') return; // 已被 timeout 处理
                    reject({
                        type: 'NETWORK_ERROR',
                        message: navigator.onLine ? '网络请求失败，请检查网络连接' : '当前处于离线状态',
                        original: err,
                    });
                })
                .finally(() => clearTimeout(timer));
        });
    }

    /**
     * 填充邮件模板变量
     */
    function fillTemplate(template, data) {
        return template
            .replace(/{name}/g, data.name || '')
            .replace(/{direction}/g, data.direction || '')
            .replace(/{phone}/g, data.phone || '')
            .replace(/{company}/g, data.company || '');
    }

    /**
     * 延时函数
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 动态加载外部脚本
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject({ type: 'NETWORK_ERROR', message: '无法加载邮件服务SDK' });
            document.head.appendChild(script);
        });
    }


    /* ========================================================
     *  第七部分：对外接口
     * ======================================================== */

    /**
     * 发送入驻申请邮件（主入口）
     * @param {Object} data - { name, company, phone, email, direction, message }
     * @param {Function} onProgress - 进度回调
     *   回调参数: { phase, attempt, maxAttempts, nextRetryIn? }
     *   phase 取值: 'sending' | 'retrying' | 'waiting_retry'
     * @returns {Promise<{success: boolean, provider: string, fallback: boolean}>}
     */
    async function sendApplication(data, onProgress) {
        // 1. 防刷检查
        const rateCheck = checkRateLimit();
        if (!rateCheck.allowed) {
            throw {
                type: 'RATE_LIMITED',
                message: `提交过于频繁，请 ${rateCheck.remainingSeconds} 秒后再试`,
            };
        }

        // 2. 基础验证
        if (!data.name || !data.phone) {
            throw { type: 'VALIDATION_ERROR', message: '缺少必填字段（姓名、电话）' };
        }

        // 3. 带重试发送
        try {
            const result = await sendWithRetry(data, onProgress);
            recordSubmitTime();
            return { ...result, fallback: false };

        } catch (error) {
            // 4. 降级：保存到本地
            saveToLocalStorage(data);

            throw {
                type: error.type || 'SEND_FAILED',
                message: error.message || '邮件发送失败',
                attempts: error.attempts || 1,
                savedLocally: true,
            };
        }
    }

    /**
     * 检查邮件服务是否已配置
     */
    function isConfigured() {
        switch (EMAIL_CONFIG.provider) {
            case 'web3forms':
                return EMAIL_CONFIG.web3forms.accessKey !== 'YOUR_WEB3FORMS_ACCESS_KEY'
                    && !!EMAIL_CONFIG.web3forms.accessKey;
            case 'formspree':
                return EMAIL_CONFIG.formspree.formId !== 'YOUR_FORMSPREE_FORM_ID'
                    && !!EMAIL_CONFIG.formspree.formId;
            case 'emailjs':
                return EMAIL_CONFIG.emailjs.serviceId !== 'YOUR_SERVICE_ID'
                    && !!EMAIL_CONFIG.emailjs.serviceId;
            default:
                return false;
        }
    }

    /**
     * 获取待处理申请数量
     */
    function getPendingCount() {
        return getPendingApplications().length;
    }

    /* ---- 导出公共接口 ---- */
    return {
        sendApplication,
        isConfigured,
        getPendingCount,
        retryPendingApplications,
        buildEmailHTML,  // 导出模板函数（用于预览/测试）
    };

})();
