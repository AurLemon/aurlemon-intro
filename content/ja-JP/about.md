## ソースコード

プロジェクトのリポジトリは [GitHub](https://github.com/AurLemon/aurlemon-intro)。Nuxt 3 で作った小さな紹介サイト。UI は [Innei](https://github.com/Innei) の [Shiro](https://github.com/Innei/Shiro) を参考にした（動きと UI が本当にすごい）。

UI のトップバーとコンテンツページを **_借り_** ています。最初に設計したときは、メニューをこんな風にできるとは思わなかった。初めて見た時はとても軽やかで驚いた。以前のプロジェクトには無かった雰囲気。調べてみると、主な理由はトランジションの時間（自分は 150ms〜350ms を使いがち）と、より細かいアニメーション制御（GSAP）だと思う。

## 機能

主に自己紹介を置く場所。外で自己紹介したりネットで使ったりするので、ついでに作った。ブログは [博客园](https://www.cnblogs.com/AurLemon)（UI はしばらく変えてないので、時間があれば直す）。

このサイトの主要機能は `@nuxt/content` で Markdown をレンダリングすること。それ以外は特にない。バックエンドも無く、適当に作って、所々わりと雑。

DB は Prisma + SQLite（SSR は色々問題が出やすい。Nuxt + Prisma は苦労した。前は TypeORM しか使ってなかった）。

## フレームワーク/パッケージ

- Nuxt 3 + TypeScript

- SCSS

- Pinia

- Nuxt Content

- Prisma

## ライセンス

- コード: MIT
- コンテンツ: CC BY-NC-SA 4.0
