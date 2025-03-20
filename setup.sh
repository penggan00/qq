#!/bin/bash

# 设置脚本在遇到错误时停止执行
set -e

# 进入 qq 目录
cd ~/qq
chmod +x ~/qq/qq.sh
chmod +x ~/qq/setup.sh


# 检查 package.json 是否存在
if [[ -f "package.json" ]]; then
    echo "检测到 package.json，正在安装所有依赖包..."
    npm install   # 根据 package.json 安装所有依赖包
    echo "依赖包安装完成！"
else
    echo "错误：未找到 package.json 文件。"
fi
echo "项目安装完成！"
# 打开 .env 文件以便输入
nano ~/qq/.env
