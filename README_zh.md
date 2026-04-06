# aurlemon-intro

> [EN](README.md).

我的个人网站，基于 Nuxt 4 + TypeScript。站点主要由几块内容组成：

- 个人信息页，包含自我介绍、教育经历、主要经历和技术背景。
- 项目页，包含项目时间线、里程碑和外部仓库链接。
- 个人偏好页，主要是 Bangumi、音乐和少量其他兴趣。
- 社交功能，包括留言板、友好链接和 GitHub 登录流程。
- 本地化内容，支持 `zh-CN`、`ja-JP`、`en-US`。

## 结构

这个仓库采用单体 Nuxt 应用结构。

```
root
├── app/              # 应用级组件与路由
├── content/          # 本地化内容页
├── locals/           # i18n 文案文件
├── plugins/          # 客户端插件与接入层
├── server/           # API 路由与服务端工具
└── prisma/           # 数据库 schema 与迁移
```

## 技术栈

- Nuxt 3 + TypeScript
- Nuxt UI + TailwindCSS + Motion-V
- MiSans + Rubik / 思源宋体 + Literata
- GitHub Actions + 腾讯云 EdgeOne
