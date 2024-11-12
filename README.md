git clone https://github.com/penggan00/qq.git  
bash ~/qq/setup.sh



crontab -e  
npm install  
node index.js  
npm install dotenv telegraf tencentcloud-sdk-nodejs p-limit


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