# Demo videos

Scripted Playwright walkthroughs of the demo, recorded to video for sending to
prospects. Re-run after a deploy and the clips are current again — including the
dates, because `seed-demo.ts` generates data relative to when it runs.

This directory is **outside the app's Docker build context** (`./next_paulux`),
so Playwright is never installed into the image and never slows a deploy. Don't
move it inside, and don't add Playwright to the app's `package.json`.

## Setup

```bash
cd demo-video
npm install
npx playwright install chromium   # a few hundred MB, once
```

## Recording

```bash
export BASE_URL=http://51.255.200.48:3002
export DEMO_LOGIN_EMAIL=...      # the shared demo account
export DEMO_LOGIN_PASSWORD=...
npm run record
```

On Windows PowerShell use `$env:BASE_URL = "..."` instead of `export`.

Clip 01 needs no credentials — it's the public booking journey. The other three
sign in, and will fail with a clear message if the variables are missing.

Individual clips:

```bash
npm run record:customer   # 01 — your clients book themselves
npm run record:day        # 02 — front desk / daily operations
npm run record:money      # 03 — payments and reporting
npm run record:stock      # 04 — stock, materials, promos, gift cards
```

Output lands in `output/clips/*.webm`. Then:

```bash
npm run mp4               # needs ffmpeg on PATH
```

MP4 matters: WhatsApp and most native players handle WebM poorly, and that's
where these are going.

## Reseed around a recording

Clips 02 and 04 open modals and can leave the demo slightly changed, and a fresh
seed is what makes "today's bookings" actually say today. On the server:

```bash
RESEED=1 docker exec paulux_stalone_demo-app-1 npx tsx prisma/seed-demo.ts
```

Run it before recording, and again afterwards so prospects get a clean demo.

## How the clips stay watchable

Playwright's recorder gives you neither a cursor nor narration, which makes raw
output nearly useless as a sales asset. Two helpers fix that:

- `helpers/overlay.ts` draws a cursor that follows the mouse, flashes a ring on
  click, and renders a caption bar. `say(page, "...")` is what carries the story.
- `helpers/ui.ts` wraps clicks so the pointer visibly travels to the target
  first, types at human speed, and scrolls smoothly rather than jumping.

Pacing is deliberate — `slowMo` in the config plus explicit `beat()` calls. If a
clip feels rushed, raise the beats before touching anything else.

## Navigating by menu

Use `navigate(page, "Products")` from `helpers/ui.ts` for anything that moves
between admin sections. It scopes to the sidebar `<nav>` and matches the label
exactly.

Reaching for `page.getByRole("link", { name: "Products" })` directly looks
equivalent and isn't: the dashboard's low-stock banner contains a "View
Products" link, so the bare version matches two elements and Playwright fails
the run in strict mode. Page content collides with nav labels more often than
you'd expect.

Clips 02–04 were derived from source rather than from the running app, so if a
step gets skipped, **watch the recording** and tighten that selector — expected
on a first pass, not a sign anything is broken.

## Notes

- Recording signs in directly rather than through the OTP gate, so the browser
  never gets a `demo_lead` cookie and `/api/demo-activity` ignores it. Robot page
  views can't pollute your lead analytics.
- Videos are silent. Captions do the work. If you want voice, these make a good
  storyboard for a Loom re-record.
- `workers: 1` and `retries: 0` are intentional — parallel runs would record each
  other's changes to the shared demo account, and a retry leaves a video of the
  failed attempt next to the good one.
