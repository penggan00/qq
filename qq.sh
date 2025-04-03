#!/bin/bash

# 检查 qq.py 是否在运行
if pgrep -f "qq.py" > /dev/null
then
    echo "qq.py 正在运行，退出脚本"
else
    echo "qq.py 未运行，启动程序"
    # 进入 qq.py 所在的目录
    cd ~/qq
    # 使用 nohup 启动 qq.py 并将输出重定向到日志文件
    node ~/qq/qq.py &
    echo "qq.py 已启动"
fi
