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
##### 1. 创建服务文件（带错误检查）
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
sudo systemctl daemon-reload && \
sudo systemctl start qq.service && \
sudo systemctl enable qq.service && \
sudo systemctl restart qq.service && \
echo "qq.service 配置成功！当前状态：" && \
sudo systemctl status qq.service --no-pager -l
 
```
```
sudo systemctl status qq.service  # 查看服务状态
sudo systemctl stop qq.service     # 停止服务
sudo systemctl disable qq.service  # 禁用开机自启
sudo systemctl daemon-reload         # 重新加载 systemd 配置
# (可选) sudo rm /etc/systemd/system/qq.service # 删除服务文件 (慎用！)

sudo systemctl restart qq.service ##### 重启
```

```

sudo nano /etc/systemd/system/qq.service
##### `````````````````````````````````
[Unit]
Description=qq
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
##### ````````````````````````
sudo systemctl daemon-reload  ##### 重新加载 systemd 配置
sudo systemctl restart qq.service  ##### 重启更新代码

sudo systemctl start qq.service   ##### 启动服务
sudo systemctl enable qq.service  ##### 设置开机自启动
##### 检查服务状态:
sudo systemctl status qq.service
#这个命令会显示服务的状态、日志等信息。 如果服务启动失败，请查看日志文件 /var/log/qq.log 以获取更多信息。
#停止和禁用服务:

##### 禁用开机自启动：
##### sudo systemctl disable qq.service
sudo systemctl stop qq.service   ##### 如果需要停止服务：
```

```
sudo bash -c 'cat > /etc/systemd/system/qq.service <<EOF
[Unit]
Description=qq
After=network.target

[Service]
User=linda2151553
WorkingDirectory=/linda2151553/rss
EnvironmentFile=/linda2151553/rss/.env
ExecStart=/linda2151553/rss/rss_venv/bin/python3 /linda2151553/rss/qq.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```
```
systemctl daemon-reload   ##### 重新加载 systemd 配置
systemctl start qq.service   ##### 启动服务
systemctl enable qq.service  ##### 设置开机自启动
systemctl status qq.service'  ##### 检查服务状态
##### sudo systemctl disable qq.service  ##### 禁用开机自启动：
##### sudo systemctl stop qq.service   ##### 如果需要停止服务：

sudo systemctl restart qq.service  ##### 重启更新代码
```