git clone https://github.com/penggan00/qq.git  
bash ~/qq/setup.sh

crontab -e  

npm install dotenv telegraf tencentcloud-sdk-nodejs p-limit
# root用户······························
# 如果你希望用系统服务的方式运行脚本，创建一个 systemd 服务文件。
sudo nano /etc/systemd/system/qq.service
# 内容如下：·······································
[Unit]
Description=QQ Script
After=network.target

[Service]
ExecStart=/usr/bin/node /root/qq/qq.js
Restart=always
User=root
Environment=PATH=/usr/bin:/usr/local/bin
WorkingDirectory=/root/qq

[Install]
WantedBy=multi-user.target
# @ ·············································
# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable qq.service
sudo systemctl start qq.service
# 检查服务状态
sudo systemctl status qq.service

# 永久禁止
sudo systemctl stop qq.service
sudo systemctl disable qq.service
sudo systemctl is-enabled qq.service




