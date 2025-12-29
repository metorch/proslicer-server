/**
 * 激活码验证逻辑
 * 与客户端 license.cjs 保持一致
 */

const crypto = require('crypto');

// 密钥 - 与客户端和注册机保持一致
const SECRET_KEY = 'ProSlicer2024SecretKey@Hang';

// 类型代码映射 (月数)
const TYPE_DURATION = {
    '1': 1,    // 1个月
    '6': 6,    // 6个月
    'C': 12,   // 12个月 (C = 12 in hex)
    'P': 0     // 永久 (0 = 不过期)
};

const TYPE_NAMES = {
    '1': '月度版',
    '6': '半年版',
    'C': '年度版',
    'P': '永久版'
};

// HMAC 签名验证
function hmacVerify(message, expectedSig) {
    const hmac = crypto.createHmac('sha256', SECRET_KEY).update(message).digest('hex');
    const sig8 = hmac.substring(0, 8).toUpperCase();
    return sig8 === expectedSig.toUpperCase();
}

// 解析激活码
// 格式: [T]S + Random(8) + Sig(8) + Pad(2) = 20字符
function parseLicenseKey(licenseKey) {
    if (!licenseKey) return null;

    const clean = licenseKey.replace(/-/g, '').toUpperCase();
    if (clean.length !== 20) return null;

    const typeCode = clean[0];
    const marker = clean[1];

    // 检查标识符
    if (marker !== 'S') return null;

    // 检查类型码有效性
    if (!TYPE_DURATION.hasOwnProperty(typeCode)) return null;

    // 提取各部分
    const random = clean.substring(2, 10);  // 8位随机数据
    const signature = clean.substring(10, 18); // 8位签名

    // 重新计算签名并验证
    const payload = typeCode + 'S' + random;
    const isValid = hmacVerify(payload, signature);

    if (!isValid) return null;

    return {
        typeCode,
        typeName: TYPE_NAMES[typeCode],
        durationMonths: TYPE_DURATION[typeCode]
    };
}

// 验证激活码格式
function validateLicenseKey(licenseKey) {
    return parseLicenseKey(licenseKey) !== null;
}

// 计算过期时间
function calculateExpireDate(activatedAt, durationMonths) {
    if (durationMonths === 0) return null; // 永久不过期

    const activationDate = new Date(activatedAt);
    const expireDate = new Date(activationDate);
    expireDate.setMonth(expireDate.getMonth() + durationMonths);
    return expireDate.toISOString();
}

// 检查是否已过期
function isExpired(expireAt) {
    if (!expireAt) return false; // 永久版不过期

    const now = new Date();
    const expireDate = new Date(expireAt);
    return now > expireDate;
}

module.exports = {
    parseLicenseKey,
    validateLicenseKey,
    calculateExpireDate,
    isExpired,
    TYPE_NAMES
};
