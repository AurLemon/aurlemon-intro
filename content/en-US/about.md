Recently, around April 2026, I spent some time rewriting the site. I tried a lot of UI directions, and in the end I still went with this version. I originally planned to add a sidebar, but the overall look was just average, so I scrapped it. lol.

## Rambling

I have to admit that taste is subjective. But this is my own site, and I still do not want it to look like everyone else's.

So... I did something pretty bold (actually, really bold): I moved the Menu to the bottom of the page; kept the Header to the reading progress bar and a few action buttons; made the Footer a simple site logo plus non-core page links, external links, and the registration record; and added a Blur Mask to the Header and Menu so the text transitions smoothly while the page scrolls.

Another thing is that I used a serif typeface for the body this time, while the sans-serif face is used only for titles, buttons, the header, the footer, and other non-core text. I suspect I may be overusing the serif a bit, Source Han Serif, even though I personally think it looks beautiful. I hope people who dislike this pairing do not yell at me.

As for the source of inspiration, Claude was actually what sparked it for me, though Anthropic banned me the next morning, ha. Setting Anthropic's habit of banning accounts aside, let's be fair. Claude's design is still quite distinctive: rounded sans-serif, a serious serif, a cool yellow theme color, and the simple line-art graphics around it. It perfectly captures Claude's core traits: aloof, restrained, mature.

OpenAI's design is also very minimal, with a strongly volumetric mixed-color background paired with restrained sans-serif text, which is also a solid UI practice. But text selection in Gemini still feels awkward, and Material Design's messy colors, shadows, and corner radii are just not my thing.

So if someone asks me what this site's style is, the first word that comes to mind is probably **restraint**. Even the primary color is just an accent at this point; black, gray, and white still do most of the heavy lifting. In short, no unnecessary design, _Less is More_.

Still, I should explain a bit more. I am not a designer, so all I can rely on is the "design instinct" I have built up from years of browsing websites while building front-end stuff. I also found another problem. When I sketch prototypes, the moment I get specific about a card's details, shadow, font, layout, even how much text to put in it, I will spend ages agonizing over it, sometimes without coming up with anything at all. That is exactly why I know I am not suited to design. My engineering background is merely average, and my design ability is definitely even worse.

And only recently did I convince myself that not every card needs to be hand-written one-to-one in HTML. I used to hand-craft the background of my old personal intro card 1:1... extremely tedious, extremely disgusting. In practice, designing it properly in a UI/UX tool and then exporting the asset is the better way. Front end, after all, is not a dedicated design tool.

## Me

Having finished talking about good UI design, what is the main content of this site? That question gets right to the point - I have no idea either. Who told me to write whatever comes to mind?

Also, one reason I suddenly updated my site recently, around April 2026, is that I really could not stand the cringe-soaked text I wrote when I first entered university as a freshman. I did not realize I used to be this unhinged.

Not only was my self-awareness about my own ability severely off, I was also full of strange self-satisfaction, lecturing, and fantasy... and the flag planting was bizarrely funny! I once imagined that putting goals in public would somehow create social commitment, but the end result was only me quietly deleting them in embarrassment. No wonder first-year students are called freshmen, though sophomore is not much better.

Fortunately, by the time you are reading this, I have already deleted those painful articles.

One last disclaimer: this site only gets updated when I remember to update it, strictly speaking once every three or four months. In other words, when I do not remember, I barely touch it at all. If the font CDN blows up, which should not really happen to Google's CDN, I may not even know. Honestly, that is not a huge issue anyway.

## Tech

The repo is [here](https://github.com/AurLemon/aurlemon-intro), and the site is built with Nuxt. The fonts were picked by me on Google Fonts.

- Nuxt 3 + TypeScript
- Nuxt UI + TailwindCSS + Motion-V
- MiSans + Rubik / Source Han Serif + Literata
- GitHub Actions + Tencent Cloud EdgeOne
