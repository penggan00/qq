apk add git
git clone https://github.com/penggan00/rss.git
#github上编译qq虚拟环境
tar -xzf /root/rss/rss_venv.tar.gz -C /root/rss/
rm -rf /root/rss/rss_venv.tar.gz
python3 -m venv rss_venv

cat > /etc/init.d/qq-bot << 'EOF'
#!/sbin/openrc-run

name="QQ Telegram Bot"
description="QQ Translation Bot Service"

command="/root/rss/rss_venv/bin/python"
command_args="/root/rss/qq.py"
command_user="root"
command_background=true
pidfile="/run/qq-bot.pid"

# 日志配置（取消注释启用）
#output_log="/root/rss/qq.log"
#error_log="/root/rss/qq.log"

depend() {
    need net
    after firewall
}

start_pre() {
    # 确保目录和日志文件存在
    mkdir -p /root/rss
    touch /root/rss/qq.log 2>/dev/null || true
    sleep 2
}

stop_post() {
    rm -f /run/qq-bot.pid
}
EOF

chmod +x /etc/init.d/qq-bot
rc-update add qq-bot default
rc-service qq-bot start
# 查看状态
rc-service qq-bot status


# 重启
rc-service qq-bot restart
# 停止
rc-service qq-bot stop
# 2. 从默认运行级别移除服务（禁止开机自启）
rc-update del qq-bot default