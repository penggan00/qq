# syntax=docker/dockerfile:1.4

# 阶段1：构建依赖
FROM --platform=$BUILDPLATFORM python:3.11-alpine as builder

WORKDIR /build

# 安装构建依赖
RUN apk add --no-cache gcc musl-dev linux-headers

COPY requirements.txt .

# 使用虚拟环境而不是 --user
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt

# 阶段2：运行时环境
FROM python:3.11-alpine

WORKDIR /app

# 安装运行时依赖（如果需要）
# 常见依赖：libssl, libffi, libpq (PostgreSQL), libxml2, libxslt等
RUN apk add --no-cache libssl3 tzdata

# 复制虚拟环境
COPY --from=builder /opt/venv /opt/venv

# 复制应用代码
COPY qq.py .

# 正确设置环境变量
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TZ=Asia/Singapore

# 清理缓存
RUN rm -rf /var/cache/apk/* /tmp/* /root/.cache

VOLUME /app
CMD ["python", "qq.py"]