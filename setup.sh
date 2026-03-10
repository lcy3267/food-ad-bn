#!/bin/bash
set -e

echo "🍜 AI 饮食伴侣 - 环境初始化"
echo "================================"

# Backend
echo ""
echo "📦 安装后端依赖..."
cd backend
npm install

echo ""
echo "🗄️  初始化数据库..."
npx prisma generate
npx prisma db push

echo ""
echo "✅ 后端初始化完成"

# Frontend
cd ../frontend
echo ""
echo "📦 安装前端依赖..."
npm install

echo ""
echo "✅ 前端初始化完成"

cd ..
echo ""
echo "================================"
echo "🎉 安装完成！"
echo ""
echo "请按以下步骤启动："
echo ""
echo "1. 配置 DeepSeek API Key:"
echo "   export DEEPSEEK_API_KEY=your_key_here"
echo ""
echo "2. 启动后端 (终端1):"
echo "   cd backend && npm run dev"
echo ""
echo "3. 启动前端 (终端2):"
echo "   cd frontend && npm run dev"
echo ""
echo "4. 访问: http://localhost:5173"
