# ProSlicer 激活服务器

基于 Vercel 的在线激活服务器，用于 ProSlicer 2.0 的激活码验证和设备绑定。

## 部署步骤

### 1. 安装 Vercel CLI
```bash
npm i -g vercel
```

### 2. 登录 Vercel
```bash
vercel login
```

### 3. 创建 Vercel KV 数据库
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 新建项目后，进入 Storage 标签
3. 创建 KV Database（免费版）
4. 复制环境变量到项目

### 4. 部署
```bash
cd proslicer-server
vercel --prod
```

## API 接口

| 接口 | 方法 | 参数 | 说明 |
|------|------|------|------|
| `/api/activate` | POST | `{licenseKey, machineId}` | 激活并绑定设备 |
| `/api/verify` | POST | `{licenseKey, machineId}` | 验证激活状态 |
| `/api/time` | GET | - | 获取服务器时间 |

## 环境变量

部署后需要配置以下环境变量（Vercel KV 会自动添加）：
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
