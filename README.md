# aurlemon-intro

> [中文](README_zh.md)

My personal website, built with Nuxt 4 and TypeScript. The site is organized into a few main sections:

- A personal profile page with an introduction, education background, major experience, and technical background.
- A projects page with a project timeline, milestones, and links to external repositories.
- A personal preferences page, mainly covering Bangumi, music, and a few other interests.
- Social features, including a message board, friendly links, and a GitHub login flow.
- Localized content support for `zh-CN`, `ja-JP`, and `en-US`.

## Structure

This repository uses a monolithic Nuxt application structure.

```
root
├── app/              # Application-level components and routes
├── content/          # Localized content pages
├── locals/           # i18n message files
├── plugins/          # Client-side plugins and integration layer
├── server/           # API routes and server utilities
└── prisma/           # Database schema and migrations
```

## Tech Stack

- Nuxt 3 + TypeScript
- Nuxt UI + TailwindCSS + Motion-V
- MiSans + Rubik / Source Han Serif + Literata
- GitHub Actions + Tencent Cloud EdgeOne
