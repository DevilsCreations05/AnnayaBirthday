# Happy Birthday, Adithya Reddy ✦

A full-screen, cinematic birthday slideshow — pure HTML/CSS/JS, no build step.

## Slides & themes
| # | Theme | Layout | Photos |
|---|-------|--------|--------|
| 1 | Retro | Framed hero collage | Retro polaroid collage |
| 2 | Heritage (stone) | Editorial mosaic | 3 temple portraits + temple backdrop |
| 3 | Sea Breeze (ocean) | Fanned polaroids + bubbles | 3 beach shots |
| 4 | Wild Coast (crimson) | Cinematic split + inset | Red hoodie by the sea |
| 5 | Golden Hour (gold) | Cinematic split + sun glow | Sunset beach |
| 6 | Rewind (sepia) | Rolling film reel | 6 frames cut from the throwback collage |
| 7 | Finale | Framed collage + confetti | Vintage scrapbook collage |

## Controls
- Each slide animates in (~1.6 s), then holds still for **2 s** — tweak `CONFIG.interval` / `CONFIG.settle` in `script.js`
- 🎵 Two songs play back-to-back on loop (starts on “Open the surprise”) · `M` mute
- `←` `→` navigate · `Space` pause · `F` full-screen · swipe on mobile · click the progress bars to jump
- Click anywhere for confetti 🎉

## Run
Open `index.html` in a browser, or publish with **GitHub Pages** (Settings → Pages → Deploy from branch `main`, root).

## Loading & TV mode
- A "system check" loader downloads **everything first** — fonts, all photos (decoded), both songs — and pre-renders every slide before the start button appears, so nothing loads mid-show.
- Smart TVs / slow devices are auto-detected (user-agent + a 1-second frame-rate test) and switch to **TV mode**: same slides and transitions, without the GPU-heavy blur, grain, light leaks and dust.
- Force it either way with `?lite=1` or `?full=1`, e.g. `…/AnnayaBirthday/?lite=1`.
- Optimised images live in `assets/photos` (display) and `assets/bg` (tiny pre-blurred backgrounds).
