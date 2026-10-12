# 开发规范

适用于本项目的代码、配置与文档改动。

## 改动范围

- 开始前检查 Git 工作区和相关现有实现，保留已有改动，沿用当前架构、依赖版本与风格；不顺手迁移、重构或升级无关部分。
- 使用 `pnpm`。新写 TypeScript 数据结构优先使用 `interface`；已有模块按现有边界迭代，不为了事件驱动偏好改造普通查询与工具调用。
- 不使用 Mock 数据或额外编写测试用例，除非用户明确要求；验证应针对实际改动和真实行为。
- 任务结束前清理临时 Debug 代码。无需额外启动 Dev 服务器；为用户要求的验证临时启动后，完成时关闭。

## 工具链与依赖安装

- 项目、GitHub Actions 和 CNB 部署统一使用 pnpm 12.10.1；Node 保持 24.x，`@types/node` 保持 24，TypeScript 保持 5.9，避免提前切换尚未兼容的类型工具链。
- pnpm 配置统一放在 `pnpm-workspace.yaml`；原生依赖的安装脚本通过 `allowBuilds` 显式授权。新锁文件包含独立的 pnpm 自身依赖文档，保留完整文件，不按单文档 YAML 改写。
- 保留 pnpm 默认的 24 小时发布时间检查；`minimumReleaseAgeExclude` 仅列出本次升级已选定的具体版本，使旧锁文件与 Nuxt 修复版本能够安装，不对整个包名或作用域放开。后续升级时按需核查并清理旧例外。

## 本地图片缩略图

仓库只保留原图，需要缩略图的使用位置通过静态 import 声明尺寸：

```ts
import cover from '~/assets/resources/photo.png?w=640&h=480&q=85&thumbnail'
```

- `thumbnail` 放在查询字符串末尾，以匹配 `types/thumbnails.d.ts` 的 URL 类型声明；也可直接使用 `?thumbnail`，默认宽高上限均为 320px，质量 90。
- `w` / `h` 是尺寸上限，保持纵横比完整容纳，不裁切、不放大；省略 `h` 时与 `w` 相同。尺寸允许 1–4096，`q` 允许 1–100。例如 80px 校徽可选 320px，以保留 4 倍像素密度。
- 支持仓库内静态 PNG、JPEG、WebP、AVIF，统一输出 WebP，保留透明通道并校正 EXIF 方向。动画、SVG、远程 URL 不走此入口；未加参数的引用继续加载原图。不能只在浏览器运行时给 URL 拼参数，转换发生在 Vite 解析静态 import 时。
- 同一原图、同一参数复用缓存 URL；不同尺寸独立生成。Dev 原图变更会重新生成并自动刷新页面（图片 URL 稳定，因此使用整页刷新保证更新），Build 将生成文件作为普通资源打包到 `.output/`。删除 `.nuxt/` 后会自动重建，不必提交产物或单独执行生成命令。
- 组件继续使用普通 URL（如 `<SkeletonImage :src="cover" />`），压缩逻辑属于构建层，不放进客户端组件；批量资源也应明确导入需要的尺寸，避免为整仓图片生成没有引用的变体。

## 卡片图片图集

首页背景图片集合使用 `*.card-atlas.json?atlas` 静态导入，清单格式为 `{"images":[{"id":"cover","file":"cover.webp"}]}`。路径相对清单，素材必须位于 `assets/` 内。单图直接复用上面的 320px/q90 缩略图；多图由 `build/card-atlas/module.ts` 通过现有 sharp 依赖合成为一个 WebP，客户端只获得一个 URL 与裁切区域，避免图片数量决定背景请求数量。

音乐条目额外保存 `title`、`author` 数组、`category`，可选 `album`；这些元数据通过 `?covers` 与本地缩略图 URL 一起导出，`source` 来源直链不进入客户端。新增分类同时补齐三种语言的 `main.index.card.music.categories` 文案。

默认每格 160px、最多 32 张、图集不超过 200 KiB；生成文件和内容指纹缓存位于已忽略的 Nuxt 构建目录 `card-atlases/`，不提交产物、不删除原图。新增素材只修改清单，不在浏览器或 API 请求中逐张下载、实时拼接。Dev 会在清单和引用素材修改后刷新，Build 使用带内容哈希的资源 URL。详细视觉与参数入口见 [首页卡片动态背景](UI_GUIDELINES.md#首页卡片动态背景)。

## 卡片背景自动可见度

`build/card-appearance/nuxt.ts` 使用现有 sharp 在构建时测量素材的明暗主题色差和边缘保留率。校徽通过 `*.webp?appearance` 导出 `CardAppearanceProfile`；技术、足迹与语言通过 `*.card-motifs.json?appearance` 同时导出受信任的本地 SVG 和 profile，确保分析与显示使用同一份图形。图片图集则在区域元数据中携带每张素材的 profile，不增加客户端图片 URL。

公共目标、透明度上限、参考模糊与计算函数位于 `components/cards/cardPattern.ts`。默认浅色目标略弱于深色，根据素材自动计算实际 opacity 和随单元格尺寸变化的模糊。分析按显示尺度并读取项目色票；浏览器只执行数值计算和既有 SVG 渲染，不下载原图进行测量。SVG 文字受构建主机字体影响，指标用于近似统一装饰背景强度，不替代真实浏览器验收。详见 [UI 规范](UI_GUIDELINES.md#首页卡片动态背景)。

## 验证与提交

- 本地缩略图由 `build/thumbnails/nuxt.ts` 的 Nuxt/Vite 模块按需处理，Dev、Build、Generate 都自动执行，不需要预生成脚本。按原图内容、尺寸、质量与 sharp 版本校验缓存，重复启动复用结果；产物仅写入已忽略的 `.nuxt/thumbnails/`，不进入 `assets/` 或 Git。具体引用方式见下节。

- 完成前运行 `pnpm format` 和 `pnpm build`，并按范围执行必要的 lint、类型或内容解析检查；用户明确免除时按当前要求执行。
- Build 通过只证明可构建，不能代替浏览器交互、部署或跨平台验证；未验证的行为应明确说明。
- 仅在用户授权时提交或推送。提交信息使用 Conventional Commits：英文 `type(scope)`，冒号后的说明使用简体中文，例如 `fix(ui): 修复导航焦点处理`。
- 提交前检查改动范围与 `git diff --check`，注意行尾换行和 Linux / Windows 跨平台使用，不包含无关文件。

## 文档维护

- `AGENTS.md` 负责规则入口与按需阅读索引；专题规则和实现说明存放在 `docs/`。
- 新专题仅在已有文档无法容纳独立职责时增加，并在入口登记适用范围；不要为同一规则维护多份正文。
- 项目指引和本次实现一起维护：路径、配置入口、命令和行为变化时同步更新对应说明。
