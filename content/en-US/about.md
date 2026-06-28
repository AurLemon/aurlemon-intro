---
updatedAt: 2026-06-29T01:50:11+08:00
---

Around April 2026, I spent some time refactoring this site. The old content was too messy, and I did not feel there was any need to expose that much about myself. Anyway, I tried a lot of UI directions, and after several iterations this is where it landed. I even planned to add a sidebar at first, but the overall look was just mediocre, so I removed it. Better to stay restrained.

## Where The Content Comes From

Everything on this site, including the writing, code, and motion, was tuned by me bit by bit. Sure, I can say AI helped. These days the people who do not use Agents are probably the minority anyway. I made that statistic up, by the way. But please do not turn around and say the whole thing is AIGC. Do not insult my taste or my UI ability, limited as it may be. I still have the original Instant Design files.

Maybe some of my writing feels a little machine-like, or maybe it gives off some other kind of vibe, but I genuinely do not feel that way myself. So let me explain what I actually used AIGC for. Overall, I was the Instructor. The Blur + Mask effect in the header was something I tested directly in the browser and then hand-built with TailwindCSS. I picked every font on this site one by one from Google Fonts, not to mention every individual feature.

## Design Direction

First of all, I should admit that taste is deeply subjective. But this is my own site, so yes, it is entirely built around what I like. My core requirement was simply not to end up with a site that looks like everyone else's. So I made a pretty bold decision, honestly a very bold one, and moved the Menu to the very bottom of the page. The Header only keeps the reading progress bar and a few action buttons. The Footer is just a simple site logo, links to non-core pages, external links, and the filing number. I also added Blur Masks to the Header and Menu so text can transition more smoothly while the page scrolls.

Another point is that this time I used a serif face in the main body, while the sans-serif face is reserved for titles, buttons, the header, the footer, and other non-core text. I suspect I may be overusing the serif face a little, specifically Source Han Serif, even though I still think it looks beautiful. I just hope people who dislike this pairing do not start yelling at me. As for the inspiration behind using serif type, it actually came from Claude. Anthropic banned me the next morning, though. Funny.

Putting Anthropic's account bans aside for a second, let us be fair. Claude's design really is distinctive: rounded sans-serif, serious serif, a cold yellow theme color, plus the minimal line-based graphics around it. Together they express Claude's core character extremely well: aloof, restrained, mature. OpenAI's design is also minimal in a good way. The strongly volumetric blended backgrounds paired with restrained sans-serif typography are solid UI practice too. But Gemini still makes text selection awkward, and Material Design's messy colors, shadows, and rounded corners are just not my thing.

So if someone asks what this site's design style is, the first word that comes to mind is probably **restraint**. Even the primary color is just an accent. Most of the page is still black, gray, and white. In short: no unnecessary design, _Less is More_.

That said, I should still explain a bit more. I am not trained in design, so all I really have is the "design instinct" I picked up from years of looking at websites and writing front end. I also noticed a problem with myself. Whenever I work on a prototype and start getting specific about a card's shadows, fonts, layout, or even how much text should go into it, I can get stuck for a very long time, or come up with nothing at all. That is exactly why I know I am not suited for design. My engineering ability is average, but my design ability is definitely even lower.

Added again in June 2026: Anthropic banned me one more time. What can I say?

## Main Content

Now that I have finished praising this excellent UI design, some reader might ask: what is this site actually about? Great question. I have no idea either. I just write whatever comes to mind.

Still, let me explain why I suddenly updated my personal site around April 2026. The main reason was simple: I really could not stand the cringe-soaked writing I had produced when I had just entered university. I did not realize I used to be that unhinged. Not only was my understanding of my own ability seriously off, those old texts were also full of weird self-indulgence, preachiness, and fantasy. On top of that, all the flag planting was bizarrely funny. I really thought that writing goals in public would create some kind of social commitment, but the final result was just quietly deleting them in embarrassment. No wonder first-year students are called freshmen. Then again, sophomore is not exactly much better.

Fortunately, by the time you are reading this, I have already deleted those painful articles. And one last disclaimer: this site is only updated when I happen to remember it exists. Strictly speaking, that means once every three or four months. More strictly speaking, it means random updates. If I do not think of it, I barely touch it at all. If the font CDN somehow breaks, though Google's CDN probably will not, I might not even notice. To be fair, that would not be a huge problem anyway.

If you like my writing, or if you suddenly feel like you understand me, feel free to leave a comment or get to know me. I may not always have time to reply. Leave a trace, if you will.

## Tech Stack

The repository is [here](https://github.com/AurLemon/aurlemon-intro). This site is built with Nuxt, and the fonts were all chosen by me on Google Fonts.

- Nuxt 4 + TypeScript
- Nuxt UI + TailwindCSS + Motion-V
- MiSans + Rubik / Source Han Serif + Literata
- GitHub Actions + Tencent Cloud EdgeOne
