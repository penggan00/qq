# 使用轻量级Python镜像
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码（不包含数据库）
COPY qq.py .

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    TZ=Asia/Shanghai

# 声明挂载点（实际挂载在运行时指定）
VOLUME /app

CMD ["python", "qq.py"]