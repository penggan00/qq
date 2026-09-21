# 在 VPS 上（先装好 python3）
apk add python3
# 把 rss_venv.tar.gz 传到 VPS，然后：
tar -xzf rss_venv.tar.gz
source rss_venv/bin/activate
# 验证
python -c "import psutil; import telegram; import aiosqlite; print('完美运行')"


##### 构建docker 
docker build -t qq-translator .
##### 
git clone https://github.com/penggan00/qq.git
cd qq
docker pull penggan0/qq-translator:latest
```
sudo docker-compose down
sudo docker-compose pull
sudo docker-compose up -d
```
```
## 1. 创建服务文件（带错误检查）
sudo bash -c 'cat > /etc/systemd/system/qq.service <<EOF
[Unit]
Description=QQ Service
After=network.target

[Service]
User=root
WorkingDirectory=/root/rss
EnvironmentFile=/root/rss/.env
ExecStart=/root/rss/rss_venv/bin/python3 /root/rss/qq.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF'
# 2. 重载systemd并启动服务（带状态检查）
sudo systemctl daemon-reload
sudo systemctl start qq.service
sudo systemctl enable qq.service
sudo systemctl restart qq.service
sudo systemctl status qq.service  # 查看服务状态
 
```
```
sudo systemctl status qq.service  # 查看服务状态
sudo systemctl stop qq.service     # 停止服务
sudo systemctl disable qq.service  # 禁用开机自启
sudo systemctl daemon-reload         # 重新加载 systemd 配置
# (可选) sudo rm /etc/systemd/system/qq.service # 删除服务文件 (慎用！)

sudo systemctl restart qq.service ##### 重启
```