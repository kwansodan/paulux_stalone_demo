# Paulux Booking — Off-Site SEO & GEO Playbook (Phase 3)

This is the non-code half of the SEO/GEO plan. For a local salon, this is where
most ranking is actually won: Google Business Profile, reviews, and consistent
citations across the web. The website work in Phases 1–2 makes you *eligible*;
this playbook makes you *chosen* — by both Google's local results and AI answer
engines (Google AI Overviews, ChatGPT, Perplexity, Gemini), which cross-reference
these same off-site signals.

Owner: marketing / client. No deployment required.

---

## 0. Canonical business identity (NAP) — use these EXACT strings everywhere

Inconsistent name/address/phone is the #1 silent killer of local ranking and the
main reason AI engines hedge or omit a business. Copy-paste these verbatim into
every profile and directory. They must match the website's structured data.

| Field | Canonical value |
|---|---|
| Name | **Paulux Booking** (never "Paulux", "PauluxBooking", or variants) |
| Address | **12 Brenya Ave, Accra, Ghana** |
| Phone (primary) | **+233 24 070 2107** |
| Phone (secondary) | **+233 50 485 1482** |
| WhatsApp | **+233 50 485 1482** |
| Email | **hello@pauluxbooking.com** |
| Website | **https://pauluxbooking.com** |
| Category | Beauty salon / Health & beauty |
| Hours | ⚠️ CONFIRM — site currently uses placeholder hours. Lock real hours first. |

> Action: agree the final hours, then update `next_paulux/src/lib/site-config.ts`
> so the website schema and every off-site listing tell the same story.

---

## 1. Google Business Profile (GBP) — highest-leverage single action

For "beauty salon near me", "nail salon Accra", and Google Maps, GBP outranks the
website itself. AI engines also lean on GBP data heavily.

### Claim & verify
- Go to https://business.google.com and claim **Paulux Booking**. If a
  listing already exists (the footer links to a Maps place), claim that one —
  do not create a duplicate.
- Complete video/postcard verification. Nothing ranks until verified.

### Optimize (complete 100% of the profile)
- **Primary category:** Beauty salon. **Additional categories** that apply, e.g.
  Hair salon, Nail salon, Skin care clinic, Waxing hair removal service, Eyelash
  service. Categories are a top-3 local ranking factor — add every true one.
- **Services:** list every treatment with name, price (GHS), and a 1–2 sentence
  description. Mirror the website's service list.
- **Products / price list:** add if applicable (e.g. gift cards).
- **Attributes:** appointment required, wheelchair accessible, women-owned (if
  true), payment types, etc.
- **Photos:** 20+ real, high-quality photos — exterior (for Maps recognition),
  interior, team, and before/after work. Add new photos weekly; GBPs with fresh
  photos get more views. Geotag where possible.
- **Booking link:** set the GBP "Book" action to
  `https://pauluxbooking.com/customer/booking`.
- **Business description:** 750 chars, naturally include "beauty and wellness
  salon in Accra", key services, and what makes you distinct.
- **Opening hours + special hours** for holidays.
- **Messaging / WhatsApp:** enable and respond fast.

### Maintain (ongoing, ~15 min/week)
- **Google Posts:** 1+/week — offers, new services, gift-card promos. Posts feed
  freshness signals and sometimes surface in AI answers.
- **Q&A:** seed 5–10 common questions yourself (mirror the website `/faq`) and
  answer them. Monitor for new ones.

---

## 2. Reviews — the dominant local ranking & trust signal

Volume, recency, rating, and *your responses* all matter. This is also the single
biggest driver of whether AI engines describe you positively.

### Targets
- Aim for a steady drip, not a one-time burst (bursts look manipulated).
  ~4–8 new Google reviews/month is a strong, natural pace for a salon.
- Respond to **every** review within 48h — thank positives, address negatives
  calmly and professionally. Responses are public trust signals and are read by
  AI engines.

### How to ask (manual, until the automated emails track is approved)
- Create a short Google review link via GBP ("Get more reviews") and turn it into
  a QR code at the front desk and on receipts.
- Train staff to ask happy clients at checkout, then send the link via WhatsApp.
- Never incentivize reviews with discounts (violates Google policy; also note the
  site's own policy that private/discount clients are handled separately).

> Cross-link: once real reviews exist, we can add a Review model + on-page review
> display with `Review`/`AggregateRating` structured data (deferred Phase 2 item).
> That is what unlocks star ratings in search results — it must reflect real,
> on-page reviews, never fabricated numbers.

---

## 3. Citations & directories — consistency is the whole game

A "citation" is any place your NAP appears online. Engines (and AI) gain
confidence in your existence/legitimacy when the same NAP appears consistently
across many independent sources.

### Tier 1 — do these first
- **Google Business Profile** (section 1).
- **Apple Business Connect** (https://businessconnect.apple.com) — powers Apple
  Maps + Siri; increasingly referenced by AI assistants.
- **Bing Places** (https://www.bingplaces.com) — powers Bing + Copilot, which is
  a major AI-answer surface. Often neglected = easy win.
- **Facebook Page** — already exists; ensure NAP, hours, category, services, and
  "Book Now" → booking URL all match exactly.
- **Instagram** — already exists; put the website link in bio, fill the
  professional/category fields, use the location tag on posts.
- **TikTok** — already exists; add website + contact.

### Tier 2 — Ghana / local
- Local Ghana business directories and beauty listings (e.g. GhanaYello /
  BusinessGhana-type directories, Tonaton/Jiji business listings where
  appropriate). Prioritize reputable ones; avoid spammy link farms.
- Any Accra lifestyle / beauty blogs or "best salons in Accra" roundups — getting
  named in these is gold for both classic SEO (a real backlink) and GEO (AI
  engines quote "best of" listicles directly).

### Rules
- **Identical NAP** every time (section 0).
- One listing per platform — hunt down and fix/merge duplicates.
- Use the same primary category and the same business description voice.

---

## 4. GEO-specific notes (ranking in AI answers)

AI answer engines don't have a "ranking" you can buy; they synthesize from
sources they trust. To be the business they name for "best beauty lounge in
Accra":
- **Consistency** across GBP + citations + website schema (sections 0–3) is the
  foundation — contradictions make AI hedge or omit you.
- **Be in the sources AI quotes:** "best salons in Accra" listicles, Reddit/forum
  threads, reputable local press, and your own clear `/faq` and per-service pages
  (Phase 2). AI engines lift clean, factual, self-contained statements — keep all
  copy unambiguous and answer-shaped.
- **Reviews as narrative:** AI summarizes review sentiment. Volume + responses +
  genuine positive detail shape how you're described.
- **Structured data already shipped** (LocalBusiness, Service, FAQPage,
  Breadcrumb) gives engines machine-readable facts to cite with confidence.

---

## 5. Measurement (Phase 4 preview)
- **Google Search Console** — verify the domain, submit
  `https://pauluxbooking.com/sitemap.xml`, watch impressions/queries.
- **Bing Webmaster Tools** — same, feeds Copilot.
- **GBP Insights** — calls, direction requests, booking clicks, search terms.
- Periodically ask ChatGPT/Perplexity/Gemini/AI Overviews a few target queries
  ("best beauty salon in Accra", "where to get lash extensions in Accra") and
  note whether/how Paulux is mentioned. Track changes over time.

---

## Open inputs still needed from the client
1. **Confirmed opening hours** (replace placeholders in `site-config.ts`).
2. **Real 100–200 word descriptions per service** — the Phase 2 detail pages and
   GBP service list both depend on these for ranking/citation value.
3. **GBP access** (claim/verify) and confirmation there's no duplicate listing.
4. Decision on the two deferred code tracks: the **Review model + on-page reviews**
   and **automated post-visit review-request emails** (Resend + Inngest).
