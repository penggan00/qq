#!/bin/bash

# 检查是否有 qq.js 进程
if pgrep -f "qq.js" > /dev/null
then
    echo "qq.js 进程已在运行，脚本退出。"
    exit 0
else
    echo "未检测到 qq.js 进程，启动 qq.js..."
    # 替换为你实际的 qq.js 脚本路径
    node ~/qq/qq.js &
    echo "qq.js 已启动。"
    exit 0
fi