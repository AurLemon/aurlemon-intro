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

新增或替换的本地静态位图（包括截图、封面、照片）统一先压缩为真正的 WebP 文件，保留原始像素尺寸与透明通道，不得只改扩展名；SVG 与动画保留原格式。保留无关既有资源，不为局部任务批量转换整个仓库。

仓库只保留原尺寸素材，需要缩略图的使用位置通过静态 import 声明尺寸：

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

ACG 与音乐条目额外保存 `title`、`author` 数组、`category`、`href`、`releaseDate`，可选 `album`；这些元数据通过 `?covers` 与本地缩略图 URL 一起导出，`source` 封面来源直链不进入客户端，`href` 为已核对的 Bangumi 作品或网易云单曲 / 专辑网页链接，随 `?covers` 导出供弹窗使用。`releaseDate` 保存 `YYYY-MM-DD` 日期：ACG 按 Bangumi 发售 / 上映日，音乐按所链接单曲或专辑的网易云发行日期；单曲 `publishTime` 为空时采用其所属唱片日期，时间戳按 Asia/Shanghai 转为日历日期，禁止将零时间戳展示成 1970 年。新增分类同时补齐三种语言的 `main.index.card.acg.categories` 或 `main.index.card.music.categories` 文案。

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

## 站点信息元数据

- 站点信息页统一使用 `/meta`，英文与日文保留对应 locale 前缀，页面标题、关于本站入口、菜单当前页与 SEO 同步维护；不在 sitemap 中排除该页。
- `/meta` 的版本标识来自 `build/site-meta.ts`：配置加载时读取当前源码 `git rev-parse HEAD` 和该提交的 committer 时间（`git show -s --format=%cI <SHA>`），经 `runtimeConfig.siteBuild` 随产物保存，生产服务器无需 `.git`。无 Git 的源码归档可在构建前设置完整的 `SITE_COMMIT_SHA`；无法确定时显示暂无信息，不使用运行时仓库 HEAD 或手写 hash。提交日期缺失时不显示日期 Badge，不以构建时间代替提交时间。技术栈版本读取实际安装包，不用 package.json 的范围冒充安装版本。
- `/api/site-meta` 仅返回 commit、所选技术栈版本、服务器实际 Node.js/V8/系统平台/架构/生效时区，以及白名单服务状态，不返回环境变量、数据库地址或内部错误。HTTP 响应不缓存，内部服务状态最多缓存 30 秒；GitHub / Bangumi 只读既有快照和有效期，不主动请求上游。OAuth / SMTP 仅表示是否已配置，数据库执行只读检查，邮件失败状态只读 Outbox。无数据、过期、读取失败分别展示，禁止推断为服务在线。

## GitHub OAuth 与 Intro Proxy 诊断

- GitHub 回调生成随机 `traceId`，贯穿 `GITHUB_OAUTH_CALLBACK_*`、`GITHUB_OAUTH_STAGE_*`、`GITHUB_OAUTH_DIRECT_ATTEMPT_*`、`GITHUB_OAUTH_PROXY_ATTEMPT_*` 和代理请求。阶段为 `token`、`user`、`emails`；直连 GitHub 的网络失败最多重试两次。`emails` 当前仍直连 GitHub，每次最多 5 秒、最多重试两次，失败降级为空列表，同时记录 `GITHUB_EMAIL_FETCH_FAILED`，阶段完成只表示包含降级在内的操作结束。不得把它误读为邮箱读取成功。
- GitHub OAuth 回调先进入本地化处理中页面，再由浏览器提交一次性 flow ID；服务端轮询状态只返回枚举阶段与重试次数，不返回 OAuth code、state 或 token。服务端通过实际的 state 校验、token / user / email 阶段和账号保存步骤更新进度；代理 GET 最多重试两次，token POST 仅在收到没有 Worker 请求 ID 的临时 5xx 边缘响应时重试，不能在授权码可能已被 GitHub 消费后重放。按钮切换页前也展示登录准备提示。进度记录暂存于 Node 进程内存、5 分钟后过期，当前部署按单个 PM2 进程运行；启用多实例或集群时须改用共享存储。
- Intro Proxy 每次请求另生成 `requestId`，通过 `x-intro-proxy-request-id` 传至 Worker，OAuth `traceId` 通过 `x-intro-proxy-trace-id` 传递。`INTRO_PROXY_REQUEST_COMPLETED` / `FAILED` 记录总耗时、外层状态、响应类型 / 字节数、EO-ID、CF-Ray、Worker ID / 耗时和内层状态。`outsideWorkerMs` 是总耗时减 Worker 耗时的近似差值，包含往返网络、EO、排队及响应传输等，不能单独当作 EO 耗时，也不要求跨机时钟同步。
- 代理失败和超过一秒的请求总会记录。项目设置 `INTRO_PROXY_DIAGNOSTICS=true` 后还记录请求开始及快速成功请求。Worker 同名变量控制接收 / 上游开始及快速完成日志，生产排障时两端一起开启，并确保 Worker Logs 已启用且采样率为 1。即使如此，日志丢失或未到 Worker 的失败仍可能没有 Worker 记录，缺失记录只能缩小范围，不能单凭它归因 EO。
- Worker `INTRO_PROXY_WORKER_COMPLETED` 记录 CF 节点、接收至上游开始耗时、上游响应头等待 / 正文读取耗时、GitHub request ID 和剩余配额。项目日志中的 `requestId` 对应 Worker 的 `clientRequestId`，项目 `workerRequestId` 对应 Worker 的 `requestId`。重试由网站服务端控制，Worker 不做重放，也不改变其认证行为。
- 日志不记录请求 / 响应正文、Authorization、Cookie、握手密钥、OAuth code / state、token、邮箱或用户资料。代理只记上游主机，Worker 只记固定操作名，不记公开账号查询路径与查询串。诊断日志属于长期运维功能，不是临时 Debug 代码。当前日志不包含 EO 实际回源 IP，525 的具体回源节点仍需结合 EO 侧记录定位。

## 面向 Agent 的静态导览

- `public/llms.txt` 是公开的网站导览，按 [llms.txt 提案](https://llmstxt.org/) 组织简介和三语言页面链接，来信链接放在页面导览之前。`nuxt.config.ts` 的 `routeRules` 配置 `Link: </llms.txt>; rel="describedby"; type="text/plain"` HTTP 响应头作为发现入口；当前 Head 类型未收录此关系，沿用提案支持的响应头方式。HTML 的 `<head>` 同时输出指向导览的自定义 `<meta name="llms">` 提示，以及直达 `/hello-agent.md` 的 `<link rel="help">`，来信再链接回导览。入口只放在响应头与 HTML 头部，不在页脚等可见正文中添加链接。自定义 meta 没有通用识别保证，这些入口也不保证所有 Agent 都会读取。
- `public/hello-agent.md` 是 Codex 留给路过 Agent 的公开信，英文、简体中文和日文放在同一个静态 Markdown 文件里，修改时同步三语言语义。信中介绍以站长当前公开信息为准，不沿用旧自述中的年级、设备等易过期信息，也不把模型型号当成未经核实的署名。
- 六词小游戏自愿参与，答案只留在访客自己的对话中；不添加提交接口、反馈收集或自动留言，不请求系统提示词、私有任务上下文或其他秘密。来信可邀请 Agent 提醒用户登录后评论、免登录点赞；只有用户明确表示愿意点赞时，才邀请 Agent 通过现有页面按钮代为完成。不为这些静态文本增加 Vue 页面、客户端请求或专用服务。

## 项目许可

- 项目原创代码采用根目录 [LICENSE](../LICENSE) 中的自定义非商业许可，非商业学习、学校研究、个人部署、修改、组件复用与分享可依条款直接进行，商业使用须事先取得 AurLemon 的书面许可。修改、提取或 AI 转换不免除所涉代码的许可条件，第三方素材及个人内容的边界以 LICENSE 为准。
- `/meta` 的三语言许可摘要与 LICENSE 保持一致，摘要不能代替完整条款。此许可包含非商业限制，不标注为 MIT 或其他允许自由商用的开源许可。
- 除另有声明外，站内原创文章与说明性图文采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)，不覆盖代码、第三方素材、个人照片、头像与品牌标识。站点信息页三语言摘要与 LICENSE 的内容许可范围保持一致，商用可另行向 AurLemon 申请书面许可。

## 文档维护

- `AGENTS.md` 负责规则入口与按需阅读索引；专题规则和实现说明存放在 `docs/`。
- 新专题仅在已有文档无法容纳独立职责时增加，并在入口登记适用范围；不要为同一规则维护多份正文。
- 项目指引和本次实现一起维护：路径、配置入口、命令和行为变化时同步更新对应说明。

## 首页卡片维护与验收

- 素材、清单按六张卡片同目录归档，使用可辨识的作者 / 作品 / 卷号文件名；图片保留真实来源，统一 WebP。背景排列、前景切换与文字规则以 [UI 规范](UI_GUIDELINES.md#首页卡片动态背景) 为准，采用对话中最后确认的版本，不恢复已被后续要求替代的旧方案。
- 扩展素材时同时核对清单 id、文件、作者数组、分类和三语言文案；追踪静态 import 与清单内 file，不能仅凭文件名搜索判断素材无用。检查旧路径、旧 cover、旧背景图和无调用方的参数，确认没有引用再删除。构建缓存与 .output 为忽略产物，不作为残余 assets 清理或提交。
- 提交前自己 review 版式、阴影裁切、边框、固定标题、前景动画、长文字首尾停留与阅读完成后换图；不等用户逐项反馈。动画必须抓取真实中间帧与结束状态，静态截图和 Build 不能证明没有硬切。浏览器工作尽量在后台执行，只关闭自己创建的预览和服务器。
- 用户反馈卡顿时优先记录生产构建 Performance trace，覆盖滚动、hover、连续换图、窄屏及语言变化；区分脚本、布局、绘制、图像解码与 DevTools 启动采样开销。不因平均耗时低就宣称没有掉帧，也不把 Dev 首次编译算成产品动画。先保持效果、常驻 DOM 与逐张资源准备，再据证据优化；报告本机样本范围与未测情况。

## 友链图片上传

- `shared/utils/friend-link-image.ts` 统一允许的格式、文件选择器 `accept`、3 MiB 大小上限和内容签名识别；申请与管理共用 `useFriendLinkImage`，只允许 WebP、AVIF、PNG、JPEG/JPG。前端同时检查实际文件头与声明 MIME，拒绝 GIF、SVG、非图片及伪装类型，再沿用 Canvas 转静态 WebP 的流程。
- 服务端 `ensureOptionalImageBase64` / `ensureImageBase64` 为异步校验，所有调用必须 `await`。没有图片返回 null；提供非空但不合法的图片必须报错，不能静默当成未上传。服务端检查 Data URL、Base64、解码后的大小和真实图片签名，并用 sharp 完整解码、处理方向、按原有短边 256px 规则输出静态 WebP，不依赖浏览器校验或 MIME 前缀。格式、内容和大小错误分别沿用英语错误 code，并映射到图片字段。
- 未上传时由前端 Nuxt UI `UAvatar` 按站名默认兜底，不生成新的 SVG 字母占位图。存储字段保持原有 string，缺图存空串，不做 Schema 迁移；读取历史由项目生成的字母 SVG 时按缺图展示，不批量改写既有图片数据。

## 友链截图封面

- `FriendLinkCard` 优先使用首页首屏截图；桌面与移动 WebP 截图以及抓取时间直接保存在 `FriendLink` SQLite BLOB 字段，经 `/api/friend-links/:id/cover` 和同一路径的 `?variant=mobile` 按需返回，不提交图片素材到 Git，也不将图片 Base64 放进公开友链列表。旧 `ExternalDataSnapshot` 中的图片会在读取友链封面时迁入 BLOB 字段并移除 Base64，仅保留队列、刷新和错误状态元数据。
- SQLite 备份同时包含双端截图，因此友链量较小时不需要独立图片目录；友链显著增加导致数据库膨胀时，再迁移到对象存储。URL 修改后清除旧截图，删除友链时一并删除队列状态，停用友链后不再对外返回截图。
- `server/plugins/friend-link-covers.ts` 每分钟检查已收录且启用的友链，在单个 Node 进程内串行截图；默认每 30 天更新，管理界面暂不开放刷新周期设置，仅提供逐站或全部立即刷新。手动请求持久化后返回 202，页面仅在存在待处理截图时轮询状态，关闭弹窗后停止轮询。每次任务串行抓取 PC 与移动端，两端分别更新，失败端保留旧封面；任一端缺失或过期即满足更新条件，管理页同时预览两端并区分部分就绪状态。没有截图时使用站点图片，自动失败至少间隔 24 小时才重试。关闭自动刷新仍允许手动刷新。站点列表请求不触发截图，截图失败不阻断友链申请、编辑、审批或页面访问。
- `playwright-core` 与 sharp 均属于生产依赖。CNB 在 `pnpm install --prod` 后运行 `.cnb/scripts/prepare-browser.mjs`，下载与锁定 Playwright 版本匹配的 Linux Chromium 到部署包 `.playwright/`，不下载 Headless Shell；同时生成记录平台、架构、Playwright 版本和相对可执行路径的 `browser.json`，并在构建容器内验证浏览器可启动并截图。浏览器二进制随 rsync 发布，不提交 Git，也不依赖服务器用户的下载缓存。
- `lib/friend-link-browser.ts` 统一解析运行路径：优先尊重 `FRIEND_LINK_BROWSER_PATH` 显式配置，其次读取部署目录内匹配当前平台和架构的 `.playwright/browser.json`，开发环境再回退系统 Chrome / Chromium 或 Playwright 缓存。保留相对路径，部署包从临时目录移动到正式目录后仍可使用，不把 CNB 构建目录写进运行配置。
- CNB 部署在停旧应用、备份和修改数据库之前执行 `scripts/check-friend-link-browser.mjs --install-deps`，检查浏览器包平台 / 架构 / Playwright 版本、系统动态库、中文字体、sandbox 启动、截图和 WebP 编码。部署和 PM2 应用使用同一非 root 用户；不关闭生产 Chromium sandbox。系统库或中文字体缺失时，先输出缺失动态库和字体诊断，再通过 `sudo -n` 直接调用随包的 Playwright CLI 安装 Chromium 系统依赖，不使用 `sudo true` 预判安装权限。安装后重新检查，仍缺中文字体或 fontconfig 时，自动执行 `apt-get update` 并安装 `fontconfig`、`fonts-noto-cjk`，再次检查通过后才启动浏览器。没有权限或环境不兼容时提前中止部署，保留旧应用运行，并输出固定当前 Playwright 版本的管理员初始化命令。管理员也可提前在服务器安装这些系统依赖，避免部署用户长期持有安装权限。脚本不会静默降级成关闭 sandbox，也不会替换 PM2 运行用户。
- 生产服务器仍需支持该 Linux 浏览器及其 sandbox；普通浏览器打包不能跨 CPU 架构、替代内核能力或任意 Linux 发行版运行库。缺少浏览器时后台明确提示且不能发起截图，已保存封面与图片兜底照常可用。本地开发可以自行安装系统浏览器，或执行 `pnpm exec playwright-core install --with-deps chromium`。当前轮询按项目已有单进程方式实现，多实例部署前需增加跨实例任务锁。
- 截图访问信息固定为 `zh-CN`、`Asia/Shanghai` 和 `https://aurlemon.top/` 导航 Referer；桌面使用 macOS Chrome UA / `MacIntel` 平台，移动端使用 iPhone Safari UA / `iPhone` 平台，实际渲染引擎仍为 Chromium。语言、时区和 UA 不改变服务器或代理出口的 IP 归属地。
- `server/utils/friend-link-fonts.ts` 读取随 Nitro `serverAssets` 打包的站内 `--font-sans`、MiSans / Rubik / Noto Sans CSS，将本地字体嵌入截图页面，远程字体继续使用站内 CDN。`--font-sans` 默认值采用零 specificity，仅在 `html` / `body` 设置默认字体，保留目标站点组件的字体与已有 `--font-sans`；远程 CSS 单独加载，避免阻塞本地默认字体。截图上下文允许绕过 CSP 以加载默认字体，仅用于独立、无登录的封面截图；字体仍受现有有界等待和总时限约束，CDN 不可达时回退本地及系统字体。
- `server/utils/friend-link-readiness.ts` 在导航前监听页面请求；准备阶段最少观察 2.2 秒、最多等待 12 秒，优先等待文档、脚本、样式及 Fetch / XHR 请求连续 1.5 秒没有活动，并确认首屏主标题可见、图片来源稳定。首屏 `<img>` 与可见元素及伪元素的 CSS 背景图通过 `complete`、`naturalWidth > 0` 和 `decode()` 检查；只唤醒首屏原生 lazy 图片，不滚动整页、不改写自定义懒加载 URL。CSS 背景图用页面内临时缓存解码，避免轮询时重复创建请求。画布地图等持续纹理请求、屏外图片、媒体、WebSocket、EventSource 和 ping 不阻塞截图；字体保留独立的有界等待。达到准备时限后，若页面有效且主标题可见，记录 `FRIEND_LINK_COVER_RESOURCES_PENDING` 并截取当前画面，不因可选资源或轮询未结束就判定整次失败；空白页、验证页、主标题持续隐藏及整个流程超时仍失败并保留旧图。有限观察窗口无法预知稍后才由定时器触发的任意请求。逐站失败必须记录 `FRIEND_LINK_COVER_CAPTURE_FAILED`，包含友链 id、公开 URL、桌面 / 移动端和异常信息，不再仅吞掉异常保存布尔标记。
- 截图使用独立无登录浏览器上下文，分别抓取 1440 × 900 PC 浅色首屏和 390 × 680 移动端浅色首屏；移动端同时启用移动 viewport、触摸和移动 UA，检查 HTTP 状态、空页面、首屏主标题是否被入场状态持续隐藏及常见验证页；每端总时限 60 秒，失败不会把错误页当成新封面。字体等待有上限；页面内容有效但字体持续加载时，通过 CDP 捕获浏览器当前可见的字体回退画面，仍保留 HTTP / 验证页检查与总时限。拒绝非 HTTP(S)、非标准端口和解析到本机、内网等保留地址的目标，重定向与子资源也检查，禁用 Service Worker、WebSocket 和媒体下载。生产截图进程应使用受限制的网络出口，不能把应用层 DNS 校验当成完整网络隔离。`FRIEND_LINK_SCREENSHOT_PROXY` 可指定截图专用代理，不继承业务 API 的 Intro Proxy 协议。

## 友链站主查询

- 管理员用户名查询复用站内 OAuth identity，外部 GitHub 用户通过 `api.github.com/users/:username`、Linux DO 用户通过 `linux.do/u/:username.json` 解析真实名字与头像；只读查询使用 5 分钟、最多 200 项进程缓存，公开友链列表不触发第三方请求。GitHub 查询沿用 `GITHUB_TOKEN` / `GITHUB_PAT` 避免共享出口的匿名 API 限流，查询失败在字段内报错。Linux DO 未在站内绑定过的外部用户可能被论坛交互验证拦截，此时明确提示未读取资料，允许管理员按用户名手动关联；404 仍报告用户不存在，不把输入误标为已验证。
- 查询沿用 `isGithubProxyEnabled` / `isLinuxDoProxyEnabled`，启用对应代理时需同步部署 `aurlemon-intro-proxy` 的精确 GET 白名单。账号关联只能由管理员写入；申请审批默认从申请用户的 OAuth identities 关联，客户端申请载荷不接受站主字段。

- GitHub 头像统一通过 `useSocialAvatar` 转换为本站 `/api/social/avatar?url=...`，覆盖登录状态、账户设置、留言、点赞用户与友链账号查询；Linux DO 头像按当前要求保持直链，论坛公开资料请求遇到 CF 交互验证时不尝试绕过。数据库与 OAuth identity 保留原始头像 URL。
- GitHub 头像与 Bangumi 封面均由本站服务端读取 Worker 图片并返回二进制响应，分别使用 `/api/social/avatar` 和 `/api/bangumi/image`；浏览器不请求 Worker、不接收其地址或重定向，不在 public runtimeConfig 暴露代理配置。`INTRO_PROXY_URL` 只在服务端读取，未配置时由本站服务端读取经白名单校验的原始图片。仅返回图片 Content-Type、缓存头和 ETag，失败不透传上游错误正文或 URL。
- Bangumi 的历史持久化快照可能含旧 Worker 封面 URL，输出时始终从原始 `cover` 重新解析站内地址，避免旧缓存继续泄露代理地址。
