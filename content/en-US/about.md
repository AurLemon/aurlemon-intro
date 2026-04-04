## Source

The repo is on [GitHub](https://github.com/AurLemon/aurlemon-intro), a small intro site built with Nuxt 3. The UI style was inspired by [Innei](https://github.com/Innei) and their [Shiro](https://github.com/Innei/Shiro) (the motion and UI are really awesome).

I **_borrowed_** the top bar and content page layout. When I started designing, I never imagined the top menu could be done like this. Thanks for the inspiration - it felt super lively the first time I saw it. My previous projects never had that vibe. After looking into it, I think the main reasons are the transition timing (I used to keep it around 150ms to 350ms) and finer animation control (GSAP).

## Features

Mostly a place to put my intro. I use it when I need to introduce myself or share online, so I made one. My blog is on [Cnblogs](https://www.cnblogs.com/AurLemon) (the UI style hasn't been updated in a while; I'll tweak it when I have time).

The main function of this site is rendering Markdown with `@nuxt/content`. Other than that, there isn't much. No backend, just something I hacked together, and some parts are written very casually.

There is a database: Prisma + SQLite (SSR brings a lot of issues; I struggled with Nuxt + Prisma for a long time because I only used TypeORM before).

## Frameworks and packages

- Nuxt 3 + TypeScript

- SCSS

- Pinia

- Nuxt Content

- Prisma

## License

- Code: MIT
- Content: CC BY-NC-SA 4.0
