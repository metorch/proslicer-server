/**
 * 验证接口
 * POST /api/verify
 * 
 * 请求体: { licenseKey, machineId }
 * 响应: { valid, expiresAt, typeName, error? }
 */

const { kv } = require('@vercel/kv');
const { parseLicenseKey, isExpired } = require('../lib/license');

module.exports = async function handler(req, res) {
    // 处理 CORS 预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ valid: false, error: '方法不允许' });
    }

    try {
        const { licenseKey, machineId } = req.body;

        // 验证参数
        if (!licenseKey || !machineId) {
            return res.status(400).json({
                valid: false,
                error: '缺少必要参数'
            });
        }

        // 验证激活码格式
        const parsed = parseLicenseKey(licenseKey);
        if (!parsed) {
            return res.status(400).json({
                valid: false,
                error: '激活码格式无效'
            });
        }

        // 规范化激活码
        const normalizedKey = licenseKey.replace(/-/g, '').toUpperCase();
        const kvKey = `license:${normalizedKey}`;

        // 查询绑定记录
        const existing = await kv.get(kvKey);

        if (!existing) {
            return res.status(200).json({
                valid: false,
                error: '激活码未激活'
            });
        }

        // 检查设备匹配
        if (existing.machineId !== machineId) {
            return res.status(200).json({
                valid: false,
                error: '设备不匹配'
            });
        }

        // 检查过期
        if (isExpired(existing.expiresAt)) {
            return res.status(200).json({
                valid: false,
                error: '激活码已过期',
                expiresAt: existing.expiresAt
            });
        }

        // 验证通过
        return res.status(200).json({
            valid: true,
            expiresAt: existing.expiresAt,
            typeName: existing.typeName
        });

    } catch (error) {
        console.error('验证错误:', error);
        return res.status(500).json({
            valid: false,
            error: '服务器内部错误'
        });
    }
};
