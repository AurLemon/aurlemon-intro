# Emoji 字体构建

配置入口为项目根目录的 `emoji.config.ts`。`build/emoji-font/nuxt.ts` 将同一套
TypeScript 生成器接入 Nuxt Build 与 Vite Dev，普通启动命令不变：

```sh
pnpm build
pnpm dev
```

- 默认扫描 Vue、JS / TS（包括模块扩展名）、Markdown / MDC，以及全部 JSON。
  排除依赖、隐藏目录、构建产物和类型声明。
- `include` / `exclude` 调整扫描范围；`extraEmoji` 可补充不能从源码中扫描出的
  固定运行时内容。不会扫描数据库、接口响应或访问页面来收集字符。
- 识别完整 Unicode Emoji 序列，并处理 Unicode 转义和数字 HTML 实体。
  子集化保留 GSUB 布局规则与彩色位图。
- 首次生成下载固定版本字体并验证 SHA-256。原字体和子集缓存均在
  `.cache/emoji/`，不进入 Git 或部署产物。
- Nuxt 生成目录下的 `emoji/emoji.woff2`、`emoji.css`、`manifest.json`
  分别是字体、字体声明和扫描诊断信息。Vite 将字体打包到客户端资源目录。
- 缓存键包含源字体校验值、字体名称、生成器版本和 Emoji 集合。
  只改普通文字不会再次子集化。开发时增加或删除 Emoji 会重新生成并刷新页面。
- `nuxt prepare` 不下载字体、不生成子集。正式 Build 的下载或生成失败会中止
  构建；Dev 更新失败会显示错误并保留上一次成功产物。

字体生成器使用 `@web-alchemy/fonttools` 的 Node API。该包自带 Pyodide / WASM、
fontTools 与 Brotli，不需要系统安装 Python；这些依赖仅用于构建。
采用该方案是因为 `subset-font` 自带的 HarfBuzz WASM 会丢弃此字体的彩色位图表。

## 来源与网络

默认固定 `samuelngs/apple-emoji-ttf` 的 `v18.4` 发布字体。它同时包含
CBDT / CBLC 彩色表和 GSUB，适用于当前子集流程。较新的 Linux 发布字体
可能使用 AAT / morx，不能作为可直接互换的输入。

若网络需要代理，可在 `.env` 中设置：

```dotenv
EMOJI_FONT_PROXY=http://127.0.0.1:7890
```

代理仅用于原字体下载，不改变系统网络配置。未设置时尊重 `HTTPS_PROXY` 等
环境变量。下载器使用 Node 内置代理能力，开发与 CI 使用 Node 24.5 或更新版本。
CI 可缓存 `.cache/emoji/`，避免每次重新下载。

离线环境可设置 `source.file` 指向本地 TTF，仍须填写对应 `source.sha256`。
更换输入时需要确认彩色表、GSUB、Emoji 覆盖范围及浏览器显示效果。

## 字体优先级与边界

`AurLemon Emoji` 位于各字体 token 的最前面，`unicode-range` 将它限制在已收集且
源字体支持的非 ASCII 码位，不抢占普通文字、数字或标点。随后使用原有文字字体，
并保留 Apple Color Emoji、Segoe UI Emoji 和 Noto Color Emoji 作为系统兜底。

源字体未覆盖的码位会记录在 manifest 的 `missingCodepoints` 中。未来 Emoji、
留言与外部 API 新增内容使用系统字体；不能保证它们都有本站的 Apple 样式。
包含 ASCII 的键帽序列保留在字体中，但不把普通数字切换到位图字体；浏览器可
使用系统字体显示这类序列。浏览器对组合序列的字体回退行为需要实机确认。

上游 MIT 许可仅覆盖转换代码，不覆盖 Apple Emoji 图像和字体素材。
本地功能验证不代表已取得公开分发授权。

参考：

- [字体来源与授权](https://github.com/samuelngs/apple-emoji-ttf)
- [Node fontTools 适配器](https://github.com/web-alchemy/fonttools)
- [fontTools 子集化](https://fonttools.readthedocs.io/en/stable/subset/)
- [Unicode Emoji 序列识别](https://github.com/mathiasbynens/emoji-regex)
