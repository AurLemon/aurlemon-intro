# AurLemon Intro 项目约束

开始任务前阅读 [开发规范](docs/DEVELOPMENT.md)，再按本次改动范围读取对应专题；当前任务的明确要求优先。

- 页面、组件、样式与交互：[UI 规范](docs/UI_GUIDELINES.md)
- 用户可见文案、错误、i18n 与 `locales/`：[文案、i18n 与错误](docs/I18N_ERRORS.md)
- `content/` 下的多语言 Markdown、MDC 与 frontmatter：[内容与 Frontmatter](docs/CONTENT.md)
- 数据库、Prisma、迁移与数据库部署：[数据库规范](docs/DATABASE.md)
- Emoji 字体、扫描范围、缓存与字体构建：[Emoji 字体构建](docs/EMOJI_FONTS.md)

只读取任务相关的专题；跨领域时同时读取对应文档，不默认加载整个 `docs/`。本轮已读且未变化的文档无需重复读取。

维护规则时修改对应专题，`AGENTS.md` 保持为简短入口；不要把专题全文重新堆回入口。
