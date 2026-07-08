/**
 * ============================================================
 *  邮件服务配置 — 同济人工智能（苏州）研究院
 * ============================================================
 *
 *  本文件集中管理所有邮件相关配置，修改收件邮箱、切换服务商
 *  只需编辑此文件，无需改动其他代码。
 *
 *  支持的服务商：
 *    1. Web3Forms  — 免费、无需后端，仅需 Access Key
 *    2. Formspree  — 免费50条/月，需注册获取 form ID
 *    3. EmailJS    — 免费200条/月，需 Service ID + Template ID
 *
 *  获取 Web3Forms Access Key：
 *    访问 https://web3forms.com → 输入收件邮箱 → 获取 Access Key
 * ============================================================
 */

const EMAIL_CONFIG = {

    /* ---- 收件邮箱配置 ---- */
    // 入驻申请通知发送到此邮箱
    recipient: 'dengruoyu@126.com',

    // 抄送邮箱（可选，多个用逗号分隔）
    cc: '',

    // 邮件发件人显示名称
    fromName: '同济AI研究院官网',

    /* ---- 服务商选择 ---- */
    // 可选值: 'web3forms' | 'formspree' | 'emailjs'
    provider: 'web3forms',

    /* ---- Web3Forms 配置 ---- */
    // 获取地址: https://web3forms.com (输入邮箱即可获取)
    web3forms: {
        accessKey: 'YOUR_WEB3FORMS_ACCESS_KEY',  // 替换为你的 Access Key
    },

    /* ---- Formspree 配置 ---- */
    // 获取地址: https://formspree.io
    formspree: {
        formId: 'YOUR_FORMSPREE_FORM_ID',  // 替换为你的 Form ID
    },

    /* ---- EmailJS 配置 ---- */
    // 获取地址: https://www.emailjs.com
    emailjs: {
        serviceId: 'YOUR_SERVICE_ID',
        templateId: 'YOUR_TEMPLATE_ID',
        publicKey: 'YOUR_PUBLIC_KEY',
    },

    /* ---- 邮件模板配置 ---- */
    template: {
        // 邮件主题
        subject: '【入驻申请】{name} - {direction}',

        // 邮件标题（显示在邮件正文顶部）
        title: '新入驻申请通知',
    },

    /* ---- 重试策略配置 ---- */
    retry: {
        maxRetries: 3,           // 最大重试次数
        baseDelay: 1000,         // 初始延迟（毫秒）
        maxDelay: 10000,         // 最大延迟（毫秒）
        backoffFactor: 2,        // 退避倍数
        jitter: true,            // 是否添加随机抖动
    },

    /* ---- 请求超时（毫秒） ---- */
    timeout: 15000,

    /* ---- 降级策略：本地存储 ---- */
    // 所有重试失败后，将申请数据保存到 localStorage，供后续手动重发
    fallback: {
        enableLocalStorage: true,
        storageKey: 'tjai_pending_applications',
    },

    /* ---- 防刷限制 ---- */
    rateLimit: {
        // 同一浏览器最小提交间隔（毫秒），防止重复提交
        minInterval: 30000,  // 30秒
    },
};
