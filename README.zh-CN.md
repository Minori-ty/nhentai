# nhentai

本仓库的主 README 为英文版（README.md）。此文件为项目的中文翻译，内容与英文 README 对应。

## 关于

该仓库包含一个使用 Vue + TypeScript 构建的前端与使用 Python 提供后端服务的网络应用。它提供用于浏览和交互内容的前端界面和后端服务。

主要语言（大致）：Vue、Python、TypeScript、HTML、CSS。

## 快速开始

前置条件

- Node.js 16+，以及 pnpm（或 npm/yarn）
- Python 3.8+ 用于后端服务

安装前端依赖

```bash
pnpm install
```

运行前端开发服务

```bash
pnpm dev
```

运行后端（示例）

```bash
# 创建并激活虚拟环境
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

请根据仓库中实际的后端入口和脚本调整上述命令。

## 项目结构（高层）

- src/  — Vue 前端源码（TypeScript）
- backend/ — Python 后端（Flask/FastAPI 等）
- public/ — 静态资源

（以仓库���际文件树为准）

## 中文 / English

- 英文主文档（主入口）：README.md
- 本文件为中文翻译：README.zh-CN.md

## 贡献

欢迎贡献。请打开 issue 或 PR，提供测试并更新文档。

## 许可

如果项目有许可证（例如 MIT），请在此处注明并在仓库中添加 LICENSE 文件；如果没有许可证，请联系仓库所有者确定许可策略。
