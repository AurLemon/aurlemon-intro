# 页面媒体资源

## 目录与引用

`assets/media/` 是页面媒体的唯一维护来源，整个目录使用 Git LFS。当前包含 `homepage/acg/`、`homepage/music/` 和 `content/`，共享品牌、图标、校徽等继续保存在 `assets/resources/`。ACG 与音乐的 `background.card-atlas.json` 元数据清单保留在原来的 `assets/resources/homepage/` 中，以相对路径引用媒体，清单使用普通 Git。

新增或替换的静态位图先转换为真正的 WebP，保留原尺寸与透明通道，SVG 和动画保留原格式。移动素材时同时检查静态 import、清单 `file` 和内容图片映射。Markdown 的文件名与 `content/...` 短路径通过 `components/content/utils/content-image.ts` 解析，保持现有内容引用有效。

媒体使用静态 import（可带 `?url`）或内容图片映射，CSS 背景使用已解析 URL。开发模式始终使用本地媒体。未设置公共地址的构建继续将媒体打包到网站，设置地址的生产构建使用 CDN 哈希 URL。不要直接拼接 `/assets/media/` 请求路径。

首页继续使用原有 320px/q90 缩略图及背景图集。`build/media/prepare.ts` 与现有构建模块共用图片生成逻辑，将真实清单引用的封面缩略图和图集一起发布到 `_derived/`。派生文件只写入 `.nuxt/`，不提交 Git。扩展媒体缩略图的尺寸或新增生成入口时，同步维护上传端的派生资源准备逻辑，并验证上传清单覆盖所有生产引用。

## 本地 Git LFS

macOS 首次安装可执行 `brew install git-lfs`，随后在仓库执行：

```sh
git lfs install --local
git lfs pull
```

Windows 与 Linux 同样需要先安装 Git LFS。之后仍使用普通 `git add`、`git commit` 和 `git push`。不要编辑指针或把指针文本上传为图片，构建与上传前必须恢复真实对象。检查命令：

```sh
git lfs ls-files
git lfs fsck --objects HEAD
```

本次使用 `git lfs migrate import` 将 `main` 可达历史中的三处旧目录 WebP 和当前 `assets/media/` 迁入 LFS，相关提交 SHA 会改变。元数据 JSON 继续使用普通 Git。GitHub 和 CNB 在发布迁移后需要接收改写后的 `main`。

已有克隆应先保存未提交和未推送工作，推荐重新克隆，避免合并迁移前的旧历史。旧分支、fork、PR 引用、本地 reflog 和历史备份仍可能保留原 Git 对象，LFS 历史版本也会占用平台配额。远端实际空间回收由托管平台处理，本地历史备份放在仓库外。

## 环境变量

沿用 portal 的变量命名，Intro 的地址与桶前缀分别为：

```dotenv
NUXT_PUBLIC_SITE_MEDIA_BASE_URL=https://img.aurlemon.top/intro
COS_MEDIA_PREFIX=intro
```

`NUXT_PUBLIC_SITE_MEDIA_BASE_URL` 在构建时生效。CNB 的部署与独立媒体流水线显式设置上述地址和 `intro` 前缀，确保项目发布到自己的命名空间，密钥示例与生产服务器 `.env` 保持相同值。修改服务器 `.env` 后仍需重新构建才能更新媒体地址。本地 `.env.example` 留空，方便离线开发与本地媒体构建。

COS 上传只在 CNB 执行，使用现有 `HydCraft/hydcraft-secrets` 的 `aurlemon-intro-deploy.yml`，凭据变量为 `COS_MEDIA_SECRET_ID`、`COS_MEDIA_SECRET_KEY`、`COS_MEDIA_REGION` 和 `COS_MEDIA_BUCKET`，前缀及公共地址由本项目流水线显式设置。示例见 `.cnb/examples/aurlemon-intro-deploy.example.yml`。公共地址的路径必须与上传前缀一致，脚本会校验。

LFS 使用 GitHub 与 CNB 各自的存储及 Git 认证，不需要 COS 密钥或自建 LFS 地址。GitHub Actions 沿用仓库变量 `CNB_REPOSITORY_SLUG` 与 Secrets `CNB_TOKEN`、`CNB_API_TOKEN`，COS 凭据只保存在 CNB secrets 中。

## 媒体增量发布

上传脚本与 Vite 插件共用 `build/media/files.ts`，对象地址为 `intro/<业务目录>/<文件名>.<SHA-256>.<扩展名>`。同一文件内容对应相同地址。上传先 HEAD，已存在则跳过，缺失时 PUT，并设置长期 immutable 缓存。只新增版本，保留旧对象支持缓存和回滚，不自动删除。

```sh
# 生成真实派生图片，扫描并预览，不需要 COS 凭据，不发起网络请求
pnpm media:upload

# 先上传一个真实源文件
pnpm media:upload --write --file homepage/acg/liz_and_blue_bird.webp

# 增量同步全部源文件及派生图片
pnpm media:upload --write
```

不支持的媒体格式、未还原的 LFS 指针、对象查询失败或上传失败会中止流程。`--file` 填写媒体相对路径，派生资源可用 dry-run 的清单路径定位。元数据清单放在 `assets/media/` 外，避免将 JSON 当作媒体上传。

CNB 和 GitHub Actions 均提供单独的“同步页面媒体”/ **Sync media** 入口，可填写单个文件或留空同步全部。CNB secrets 的 `allow_events` 需要包含 `web_trigger_media` 和 `api_trigger_media`，分支为 `main`。

正式部署先恢复并校验 LFS，安装依赖后同步媒体，再构建与部署网站，任一步失败即停止。现有数据库迁移、浏览器打包和 PM2 部署逻辑继续使用项目原实现。

## GitHub 到 CNB

GitHub 是源仓库。CI、Deploy、Sync CNB 与 Sync media 共用 `.github/scripts/sync-cnb.sh`，先获取当前 `main` 可达的 LFS 对象并上传 CNB 的独立 LFS 存储，再使用 `--force-with-lease` 更新 CNB `main`。完整历史 checkout 与 `lfs: true` 用于构建和同步，媒体触发入口按需下载，已经同步的相同提交直接触发 CNB 上传。

同步使用临时 askpass 从环境读取凭据，不将令牌写入 remote URL。远端版本变化时停止同步，退出清理临时文件与 remote。单独 **Sync CNB** 只同步代码和 LFS。Deploy 同步成功后触发 CNB 部署。

CNB 显式开启 `git.lfs`，安装客户端、执行 `git lfs pull` 和对象校验，从 CNB 自己的存储取得媒体。首次发布仍需验收远端 LFS 配额、Token 写入权限、COS 上传与 CDN 响应。dry-run 与本地 Build 通过仅覆盖本地链路。
