# nhentai

English documentation is the primary README. For a Chinese translation, see README.zh-CN.md (中文入口) below.

A minimal README for the nhentai project — quick overview, how to run locally, and where to find the Chinese translation.

## About

This repository contains a web application built with Vue, TypeScript, and Python. It provides a frontend UI and backend services for browsing and interacting with content.

Languages used (approx.): Vue, Python, TypeScript, HTML, CSS.

## Quick start

Prerequisites

- Node.js 16+ and pnpm (or npm/yarn)
- Python 3.8+ for backend services

Install frontend dependencies

```bash
pnpm install
```

Run frontend dev server

```bash
pnpm dev
```

Run backend (example)

```bash
# create and activate virtualenv
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Adjust the commands above to match this repository's actual backend entrypoint and scripts.

## Project structure (high level)

- src/  — Vue frontend source (TypeScript)
- backend/ — Python backend (Flask/FastAPI/etc.)
- public/ — static assets

(Use the repo file tree as the source of truth.)

## Chinese translation / 中文入口

If you prefer Chinese documentation, open README.zh-CN.md in this repository.

## Contributing

Contributions welcome. Please open issues or pull requests. Provide tests and update documentation where appropriate.

## License

Specify the project's license here if available (e.g. MIT). If no license file exists, add one or consult the project owner.


---

中文说明请见：README.zh-CN.md （链接在仓库根目录）。
