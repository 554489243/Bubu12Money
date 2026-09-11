# 项目文档索引

## 文档清单

| 文件 | 用途 | 何时阅读 |
|------|------|----------|
| [01-requirements.md](01-requirements.md) | 基本需求 | 了解产品功能、交互细节、初版范围 |
| [02-architecture.md](02-architecture.md) | 开发架构 | 了解技术栈、数据流、项目结构、部署方案 |
| [03-database-design.md](03-database-design.md) | 数据库设计 | 了解表结构、索引、初始数据、版本管理 |
| [04-prototypes.html](04-prototypes.html) | 原型图 | 查看 5 个页面的高保真模拟（浏览器打开） |
| [05-development-log.md](05-development-log.md) | 开发日志 | 查看开发进度、已完成/待完善/待优化 |
| README.md | 本文档 | 快速定位所需文档 |

## 文档维护规范

| 触发动作 | 需更新的文档 |
|----------|-------------|
| 需求变更 | 01-requirements.md + 05-development-log.md |
| 技术栈/架构调整 | 02-architecture.md + 05-development-log.md |
| 表结构变更 | 03-database-design.md + 05-development-log.md |
| 页面/交互变更 | 04-prototypes.html + 05-development-log.md |
| 任何代码提交 | 05-development-log.md |

## 快速开始

1. 阅读 [01-requirements.md](01-requirements.md) 了解需求
2. 阅读 [02-architecture.md](02-architecture.md) 了解技术方案
3. 浏览器打开 [04-prototypes.html](04-prototypes.html) 查看原型
4. 按 [02-architecture.md](02-architecture.md) 中的项目结构搭建代码
5. 开发过程中持续更新 [05-development-log.md](05-development-log.md)
