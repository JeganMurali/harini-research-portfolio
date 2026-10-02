# Harini Madheswaran — Research Portfolio

A React portfolio for PhD applications, designed as an interactive journey through a living cell and Harini's research questions.

## Run locally

```bash
pnpm install
pnpm dev
```

## Create a production build

```bash
pnpm build
```

The finished static site is written to `dist/`.

## How the page is built

The page reads as one continuous biological world, told in chapters:

- **Opening** (`src/Intro.jsx`): a cell divides; it plays on load, can be skipped, and is not shown for deep links or reduced motion.
- **Hero** (`src/Hero.jsx`, `src/hero/`): a WebGL tissue scene redraws the intro's last frame, so the hand-off has no cut. The name assembles from grains, and the cell follows the cursor and divides on click.
- **Profile** (`src/Profile.jsx`, `src/profile/`): built from actin — a spine branches to the IISER Tirupati affiliation, braids into Biology and Chemistry, then grows to four specimen cells, one per capability.
- **Journey** (`src/Journey.jsx`): one pinned trail through five stops; phones get a vertical rail.
- **Reviewer brief** (`src/ReviewerBrief.jsx`): a 90-second summary for PhD reviewers with a two-page Save as PDF layout, opened from the hero and the contact section.
- **Motion** (`src/motion.js`): one shared identity — signature easing, a duration palette and stagger budgets.

Shared content lives in `src/content.js`. All motion has a `prefers-reduced-motion` fallback, and the WebGL scenes fall back to static art when WebGL is unavailable.

## Content notes

- Biology major and Chemistry minor at IISER Tirupati.
- NeuroNexus is identified as a team presentation and speculative concept, not experimental research.
- Source figures are reproduced from Harini's project reports and are labelled as report evidence.
- The hero, profile and journey visuals are illustrative, not scientific data.
- The IISER Tirupati emblem is traced from the institute's logo and recoloured to the site palette.
- The WDR62 thesis uses a lazy-loaded interactive 3D cell model.
- Projects open in full-screen research dossiers with Story, Method, Evidence and Next-question chapters.
- Source reports are available from inside their relevant evidence chapters.
