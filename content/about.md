## 源码
项目仓库见 [Github](https://github.com/AurLemon/aurlemon-intro)，基于 Nuxt 3 开发的一个小简介网站。UI 风格借鉴 [Innei](https://github.com/Innei) 大佬的 [Shiro](https://github.com/Innei/Shiro)（大佬这动效和 UI 是真 NB）。

UI 部分把顶栏和内容页面给 ***借鉴*** 来了。自己一开始设计的时候从没想到顶栏菜单能这么玩，感谢大佬的指点，第一次看的时候感觉非常灵动！自己以前的项目就没这感觉，后面琢磨了下大概发现是过渡动画的时间（我原来习惯 150ms 到 350ms 这个区间的）和更细致的动画控制（GSAP）促成的。

## 功能
主要是放放我的简介，偶尔出去介绍自己或者在网上的时候会用到，顺手做了一个，我的博客在[博客园](https://www.cnblogs.com/AurLemon)（UI 风格好久没改了，有空慢慢弄）。

这个站最主要的功能就是用 `@nuxt/content` 这个渲染库把 Markdown 文档渲染出来，除此之外没别的功能了，后台都没有，自己随便弄弄，有些地方写的很随意。

有数据库，Prisma + SQLite（感觉 SSR 容易碰到很多问题，Nuxt 配 Prisma 的时候折腾了很久，原来只用过 TypeORM）。

## 框架和包
* Nuxt 3 + TypeScript

* SCSS

* Pinia

* Nuxt Content

* Prisma

## 共享协议
* 代码：MIT
* 内容：CC BY-NC-SA 4.0