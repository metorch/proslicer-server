/**
 * 时间接口
 * GET /api/time
 * 
 * 响应: { datetime, timestamp }
 */

module.exports = async function handler(req, res) {
    // 处理 CORS 预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const now = new Date();

    return res.status(200).json({
        datetime: now.toISOString(),
        timestamp: now.getTime()
    });
};
