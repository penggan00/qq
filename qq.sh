#!/bin/bash

# 检查 qq.js 是否在运行
if pgrep -f "qq.js" > /dev/null
then
    echo "qq.js 正在运行，退出脚本"
else
    echo "qq.js 未运行，启动程序"
    # 进入 qq.js 所在的目录
    cd ~/qq
    # 使用 nohup 启动 qq.js 并将输出重定向到日志文件
    nohup node ~/qq/qq.js
    echo "qq.js 已启动"
fi
