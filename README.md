# Glowe Play

Coming-soon landing page for **Glowe Play** — a birthday tradition for families. From one birthday to the next, you complete meaningful family adventures, capture everyday moments, and receive a beautiful hardcover book celebrating the year your child was six, seven, eight…

**Tagline:** Capture one unforgettable year between birthdays.

**Live URL:** _coming soon_

---

## The Promise

Create one unforgettable year of adventures between birthdays and receive a keepsake hardcover book celebrating exactly who your child was that year. Sell the emotional outcome, not the software.

The page is a **coming-soon pre-signup** — the primary conversion is joining the waitlist.

### Page sections

1. **Hero** — headline + email capture + book mockup
2. **How it works** — 6-step timeline
3. **The magic isn't the book** — emotional photo moments
4. **Adventure collection** — collectible badge stickers
5. **Inside your book** — real page previews (interview, funny quotes, favorites, letter to future you…)
6. **More than a photo album** — comparison table
7. **Every birthday starts a new chapter** — book-spine timeline
8. **Pricing** — annual membership
9. **FAQ**
10. **Final CTA** + footer

---

## Local Development

Single static HTML file — no build step, no dependencies.

### Option 1: Just open it

Double-click `index.html` and it opens in your browser.

### Option 2: Live reload (recommended)

In Cursor or VS Code, install the **Live Server** extension by Ritwick Dey, then right-click `index.html` → "Open with Live Server." It auto-refreshes on save.

---

## Waitlist form

Both waitlist forms currently show a client-side success state only. To actually collect emails, wire the `fetch()` call in the inline `<script>` at the bottom of `index.html` to an email provider (Mailchimp, ConvertKit, Formspree, etc.). Look for the `// TODO` comment.

## Tech

- Plain HTML + CSS (no framework)
- Google Fonts: Fredoka, Nunito, Caveat
- Vanilla JS for the reveal-on-scroll and waitlist success state

## Deploy

Options for a single static site:

- **Netlify** — drag and drop the folder onto netlify.com/drop
- **Vercel** — `vercel` from the project root
- **GitHub Pages** — push to `main`, enable Pages in repo settings
- **Cloudflare Pages** — connect repo, framework preset = "None"

---

## Brand Notes

- **Audience:** Parents of young kids (toddler through tween)
- **Tone:** Warm, playful, kid-friendly, keepsake-worthy
- **Colors:** Navy (#1B2440), Orange (#FF6B35), Sky Blue (#2BB3D9), Yellow (#FFD23F), Purple (#7B5FE0), Mint (#6FE0B5)
- **Assets to add:** real book cover image, interior spread photos, illustrated adventure badges (currently CSS approximations)

## Goals

- **Primary CTA:** Join the waitlist / get early access
- **Emotional goal:** "I want a bookshelf full of these."
