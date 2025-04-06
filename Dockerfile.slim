# syntax=docker/dockerfile:1.4

# 阶段1：通用构建环境
FROM --platform=$BUILDPLATFORM python:3.11-slim as builder

WORKDIR /build
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --user --no-cache-dir -r requirements.txt

# 阶段2：目标架构运行环境
FROM python:3.11-slim

WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY qq.py .

ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    TZ=Asia/Shanghai

# 数据卷声明（项目目录将挂载到这里）
VOLUME /app

CMD ["python", "qq.py"]