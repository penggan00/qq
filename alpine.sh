apk add git
git clone https://github.com/penggan00/rss.git
#github上编译qq虚拟环境
tar -xzf /root/rss/rss_venv.tar.gz -C /root/rss/
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
output_log="/root/rss/qq.log"
error_log="/root/rss/qq.log"

depend() {
    need net
    after firewall
}

start_pre() {
    sleep 10
}
EOF
chmod +x /etc/init.d/qq-bot
rc-update add qq-bot default
rc-service qq-bot start
# 查看状态
rc-service qq-bot status
# 看日志
tail -f /root/rss/qq.log


# 重启
rc-service qq-bot restart
# 停止
rc-service qq-bot stop
# 2. 从默认运行级别移除服务（禁止开机自启）
rc-update del qq-bot default