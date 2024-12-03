git clone https://github.com/penggan00/qq.git  
bash ~/qq/setup.sh



crontab -e  
npm install  
node index.js  
npm install dotenv telegraf tencentcloud-sdk-nodejs p-limit
# 结束 
pkill -f qq.js

# 在文件中添加以下内容，确保你正确设置了路径和用户信息 重新加载 systemd 配置： 
sudo nano /etc/systemd/system/qq.service 
------------------------------------------------------------
[Unit]
Description=qq
After=network.target

[Service]
ExecStart=/usr/bin/node /home/linda20240908/qq/qq.js
WorkingDirectory=/home/linda20240908/qq
Restart=always
User=linda20240908
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
-------------------------------------------------------------------------------------------------------------
# 运行以下命令，重新加载 systemd 配置文件：# 启动并启用服务： 启动你的服务并设置为开机启动：
sudo systemctl daemon-reload
sudo systemctl start qq
sudo systemctl enable qq


# root用户······························
如果你希望用系统服务的方式运行脚本，创建一个 systemd 服务文件。
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