# AI 饮食伴侣 🍜

基于 Vue 3 + Fastify + Prisma + SQLite + DeepSeek AI 的智能饮食管理应用。

## 项目结构

```
ai-diet-companion/
├── backend/          # Node.js + Fastify + Prisma
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   └── index.js
│   └── package.json
├── frontend/         # Vite + Vue 3 + Pinia
│   ├── src/
│   │   ├── api/         # API 请求模块
│   │   ├── components/  # 可复用组件 (RecCard)
│   │   ├── stores/      # Pinia 状态管理 (user)
│   │   ├── views/       # 页面 (OnboardView, ChatView)
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css
│   ├── index.html
│   └── vite.config.js
├── setup.sh          # 一键安装脚本
└── README.md
```

## 快速启动

### 1. 安装依赖 & 初始化数据库

```bash
bash setup.sh
```

### 2. 配置 DeepSeek API Key

```bash
# backend/.env
DEEPSEEK_API_KEY=your_key_here
```

### 3. 启动后端（新终端）

```bash
cd backend
npm run dev
```

### 4. 启动前端（新终端）

```bash
cd frontend
npm run dev
```

### 5. 打开浏览器

访问 http://localhost:5173

---

## 架构说明

### 前端模块

| 模块 | 职责 |
|------|------|
| `src/api/index.js` | 封装所有 HTTP 请求 |
| `src/stores/user.js` | 用户状态管理，持久化到 localStorage + 数据库 |
| `src/views/OnboardView.vue` | 引导页，收集用户信息 |
| `src/views/ChatView.vue` | 聊天页，AI 对话与卡片渲染 |
| `src/components/RecCard.vue` | 饮食/运动推荐卡片组件 |

### 后端 API

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/users` | POST | 创建新用户 |
| `/api/users/:id` | GET | 获取用户信息 |
| `/api/users/:id` | PATCH | 更新用户信息 |
| `/api/users/:id/messages` | GET | 获取对话历史 |
| `/api/users/:id/messages` | POST | 保存消息 |
| `/api/users/:id/selections` | GET | 获取选择记录 |
| `/api/users/:id/selections` | POST | 保存选择记录 |
| `/api/chat` | POST | AI 对话（DeepSeek） |
| `/api/extract` | POST | 结构化数据提取 |
| `/api/tips` | POST | 获取选择后建议 |

### 数据库模型（SQLite + Prisma）

- **User**: 用户基础信息（age, gender, height, weight, region, habits, goals）
- **Message**: 对话历史记录
- **Selection**: 已选饮食/运动记录
