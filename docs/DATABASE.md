# 数据库与 Prisma

项目使用 SQLite、Prisma 7.10.0 与 `@prisma/adapter-better-sqlite3`。Prisma CLI、客户端和 adapter 保持同版本，不使用 CLI 的 `latest` 标签，它可能指向 Prisma 8 预发布版本。TypeScript 保持 5.9，pnpm 使用 12.10.1。

## 配置与客户端

- `prisma7.config.ts` 配置 Schema、迁移目录和 CLI 数据库地址，并显式加载 `.env`。
- `lib/database-url.ts` 统一解析 CLI、服务器和用户迁移脚本的数据库路径。相对 `file:` 路径仍以 `prisma/` 为基准；生产部署会将地址转为绝对路径。
- `lib/prisma.ts` 管理服务器客户端；SQLite adapter 使用 `timestampFormat: 'unixepoch-ms'`，兼容 Prisma 6 的毫秒整数日期，避免只升级驱动就改写数据格式。
- `prisma/schema.prisma` 使用 `prisma-client` 生成器，输出 `generated/prisma/`。生成文件不提交、不格式化、不 lint；安装和 Build 会自动生成。全新安装先执行 `nuxt prepare`，再执行 `prisma generate`，保证生成器读取的 TypeScript 配置已经存在。
- 服务端从 `~/generated/prisma/client` 导入 Prisma 类型与枚举。生成客户端仅供服务端使用，不导入浏览器组件。

## 命令与部署

- `pnpm db:generate` / `pnpm db:validate`：生成客户端 / 验证 Schema。
- `pnpm db:migrate:deploy`：应用现有迁移；升级 Prisma 本身不要求新增业务表迁移或重置数据库。
- `pnpm db:users:build`：编译一次性用户迁移脚本和它所依赖的生成客户端；入口为 `.scripts-dist/scripts/migrate-social-users.js`。
- 生产产物保留 Prisma CLI、配置文件、路径工具、Schema 和 migrations；不打包本地数据库。旧用户迁移功能开启时，一并打包完整 `.scripts-dist/`。
- 运行环境使用 Node 24.15+ 的 24.x。`better-sqlite3` 是原生依赖，部署构建环境与运行环境应匹配操作系统、CPU 架构和 Node ABI；Windows 或不同架构上重新执行 pnpm 安装与生成，不复用 macOS 的 node_modules。
- 部署使用 SQLite 在线备份 API 创建一致性快照，并保留数据库的 journal / WAL / SHM 文件；失败回滚时先停止应用，再恢复快照并清除旧事务边车文件。

## 升级验证

先对真实数据库创建 SQLite 快照，在副本上检查旧日期读取、毫秒整数写入、事务回滚、关联查询、外键以及 Schema diff。再验证脚本编译、类型检查、Lint、Build 和隔离的生产依赖安装；不要将本地通过视为已上线或已完成 Windows 验收。
