/**
 * 激活接口
 * POST /api/activate
 * 
 * 请求体: { licenseKey, machineId }
 * 响应: { success, expiresAt, typeName, error? }
 */

const { kv } = require('@vercel/kv');
const { parseLicenseKey, calculateExpireDate, isExpired } = require('../lib/license');

module.exports = async function handler(req, res) {
    // 处理 CORS 预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: '方法不允许' });
    }

    try {
        const { licenseKey, machineId } = req.body;

        // 验证参数
        if (!licenseKey || !machineId) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数'
            });
        }

        // 验证激活码格式
        const parsed = parseLicenseKey(licenseKey);
        if (!parsed) {
            return res.status(400).json({
                success: false,
                error: '激活码无效'
            });
        }

        // 规范化激活码
        const normalizedKey = licenseKey.replace(/-/g, '').toUpperCase();
        const kvKey = `license:${normalizedKey}`;

        // 查询现有绑定
        const existing = await kv.get(kvKey);

        if (existing) {
            // 检查是否是同一设备
            if (existing.machineId === machineId) {
                // 同一设备，检查是否过期
                if (isExpired(existing.expiresAt)) {
                    return res.status(400).json({
                        success: false,
                        error: '激活码已过期'
                    });
                }

                return res.status(200).json({
                    success: true,
                    expiresAt: existing.expiresAt,
                    typeName: parsed.typeName,
                    message: '设备已激活'
                });
            } else {
                // 不同设备，拒绝
                return res.status(400).json({
                    success: false,
                    error: '此激活码已被其他设备使用'
                });
            }
        }

        // 新激活：保存绑定记录
        const activatedAt = new Date().toISOString();
        const expiresAt = calculateExpireDate(activatedAt, parsed.durationMonths);

        await kv.set(kvKey, {
            machineId,
            activatedAt,
            expiresAt,
            typeCode: parsed.typeCode,
            typeName: parsed.typeName
        });

        return res.status(200).json({
            success: true,
            expiresAt,
            typeName: parsed.typeName,
            message: '激活成功'
        });

    } catch (error) {
        console.error('激活错误:', error);
        return res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
};
