# AurLemon Intro Memory

## UI Change Discipline

- 不要在未明确要求时额外添加 hover 浮动、缩放、过强动效或重排版交互。
- 对现有样式做修改时，优先基于用户已改过的版本继续迭代，不要擅自回退视觉方向。

## UI Implementation Preference

- HTML 结构中，非必要不要直接写 `style` 内联样式，优先使用 Tailwind CSS 与 Nuxt UI 提供的能力完成样式表达。
- `<style scoped>` 不是禁用，但应只用于 Tailwind CSS / Nuxt UI 难以表达的复杂状态、动画、第三方组件覆盖或结构性样式；普通布局与视觉优先留在模板 class。
- `:style` / 内联 `style` 只用于运行时计算值、第三方库注入 HTML、canvas / map 等 Tailwind CSS 无法静态表达的场景；静态样式不要回退成 inline style。

## UI System Discipline

- 优先复用 `app.config.ts` 中的 Nuxt UI 主题配置，以及 `assets/styles/base/tailwind.css` 中的 design token，不要在页面里重新发明一套颜色、表面层级、尺寸语义。
- 颜色、语义色、表面层级、字号与字体倾向，优先通过 token 与 class 表达，不要在局部组件里散落硬编码色值。
- 对 Nuxt UI 组件的定制，优先走 theme / config / class 扩展，不要为了一个局部视觉点把整个组件手写替换掉。

## Error And i18n Discipline

- 错误 code 保持英语、大写、下划线风格；HTTP status 与错误 code 分离，前端展示依赖 i18n 映射，不直接展示裸文案。
- 新增错误 code 时，默认同步补各 locale 的 `errors` 文案；至少不能只补一个语言后就结束。
- 面向用户的失败提示统一走 i18n；日志与内部诊断信息可以保留英文技术描述。
- `console.error` / `console.warn` 的标签前缀优先使用稳定的英文大写错误标识，方便检索，例如 `PROFILE_ATTACHMENT_CLEANUP_FAILED`。
- 当前项目可将 i18n 视为“全局可用”，模板层优先复用全局能力，不要在能直接使用全局能力的地方重复包一层相同语义的实现。
- 但要区分边界：模板可直接使用全局注入能力；`script setup` / 组合式逻辑内若需要响应式 locale 与类型安全，仍应优先使用 `useI18n()` 或现有封装，而不是误以为模板侧全局能力可无差别替代脚本侧调用。
- 任何对 `locales/` 下文案的修改，都必须同步检查并补齐对应语言文件，不能只改单一语言后结束；新增 key、改 key、删 key 时都按“所有已支持 locale 一起收口”处理。
- 任何新增面向用户的文案、错误提示、状态文案或内容标题时，默认同时补齐对应 i18n 文本，不允许留下仅单语言可见的中间态。

## Content And Frontmatter Discipline

- 修改 `content/` 下任意多语言内容时，必须把同一份内容视为一个整体：若一个语言版本已修改，需同步检查其它语言版本是否需要跟进，不能长期放任跨语言内容漂移。
- 若某份 Markdown 在文件头（frontmatter）中包含 `updatedAt` 等描述性时间字段，则每次修改该份内容时，都要把该时间更新为当前修改时间（精确到分秒时）。
- 同一份 content 的多语言版本应共用同一个 `updatedAt` 时间语义；如果只改了其中一个语言版本，也要把该 content 其它语言文件头中的对应时间一并同步到同一个当前时间。
- 对 content 的结构性信息（如 frontmatter 中的标题、描述、时间、额外元数据）做调整时，默认同步检查同名多语言文件，确保元信息结构保持一致。
- MD 内调用的组件如果内有 Caption 等描述信息，也要一同翻译；MD 内调用的组件如果就写在一行内，直接搬过去，不要私自换行，这样会被当成 Markdown 文本解析而非组件调用。
- MD / MDC 的 `::component{...}` 单行调用里，如果某个参数本身用单引号包裹整段 JSON 或长字符串，例如 `images='[...]'`，内部不要再出现原始 ASCII 单引号 `'`；英文里的所有格、缩写优先改写，或改成 Unicode 弯引号 `’`，因为这类问题会在 `JSON.parse` 之前先把 MDC 参数层打坏。
- 遇到 `::image-grid` / `::image-carousel` 这类单行 MDC 组件时，修改后要单独搜索一遍 `::` 调用并人工复查渲染敏感字符；英文图片 caption 是高风险区，不能只看正文 diff。
- Markdown / Content 里的 LaTeX 默认直接使用 `$$ ... $$` 块级写法；不要在这类内容文件里留下容易被 Markdown / MDC 解析歧义吞掉的临时数学写法。
