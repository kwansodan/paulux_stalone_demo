import type { Page } from "@playwright/test"

/**
 * Two things Playwright's video recorder does not give you, both of which make
 * the difference between a usable clip and an unwatchable one:
 *
 *   1. No cursor. Playwright drives the real mouse but the pointer is not
 *      composited into the video, so clicks look like things spontaneously
 *      happening. We draw our own.
 *   2. No narration. A silent screen recording of software nobody has seen
 *      before is hard to follow, so we caption each beat.
 *
 * Both are injected with addInitScript so they survive navigation.
 */

const CURSOR_ID = "pw-demo-cursor"
const CAPTION_ID = "pw-demo-caption"

export async function installOverlay(page: Page): Promise<void> {
  await page.addInitScript(
    ({ cursorId, captionId }) => {
      const install = () => {
        if (document.getElementById(cursorId)) return

        const cursor = document.createElement("div")
        cursor.id = cursorId
        cursor.style.cssText = [
          "position:fixed", "top:-100px", "left:-100px",
          "width:20px", "height:20px", "border-radius:50%",
          "background:rgba(168,0,183,0.30)", "border:2px solid #A800B7",
          "box-shadow:0 0 0 3px rgba(168,0,183,0.12)",
          "pointer-events:none", "z-index:2147483647",
          "transform:translate(-50%,-50%)",
        ].join(";")
        document.body.appendChild(cursor)

        const caption = document.createElement("div")
        caption.id = captionId
        // Top, not bottom. Subtitles conventionally sit at the bottom, but
        // that is exactly where these pages put their primary buttons — the
        // booking form's Continue lands under a bottom caption and the page
        // is too short to scroll clear of it. The top strip is empty on both
        // the customer and admin layouts.
        caption.style.cssText = [
          "position:fixed", "left:50%", "top:20px",
          "transform:translateX(-50%)",
          "max-width:78%", "padding:12px 22px",
          "background:rgba(17,17,17,0.88)", "color:#fff",
          "font:500 19px/1.4 system-ui,-apple-system,Segoe UI,sans-serif",
          "border-radius:999px", "text-align:center",
          "pointer-events:none", "z-index:2147483647",
          "opacity:0", "transition:opacity .35s ease",
        ].join(";")
        document.body.appendChild(caption)

        document.addEventListener(
          "mousemove",
          (e) => {
            cursor.style.left = `${e.clientX}px`
            cursor.style.top = `${e.clientY}px`
          },
          true
        )

        // A click is otherwise invisible; a brief expanding ring reads as one.
        document.addEventListener(
          "mousedown",
          (e) => {
            const ring = document.createElement("div")
            ring.style.cssText = [
              "position:fixed", `left:${e.clientX}px`, `top:${e.clientY}px`,
              "width:20px", "height:20px", "border-radius:50%",
              "border:2px solid #A800B7", "pointer-events:none",
              "z-index:2147483646", "transform:translate(-50%,-50%) scale(1)",
              "transition:transform .45s ease, opacity .45s ease", "opacity:.9",
            ].join(";")
            document.body.appendChild(ring)
            requestAnimationFrame(() => {
              ring.style.transform = "translate(-50%,-50%) scale(2.6)"
              ring.style.opacity = "0"
            })
            setTimeout(() => ring.remove(), 500)
          },
          true
        )
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", install)
      } else {
        install()
      }
    },
    { cursorId: CURSOR_ID, captionId: CAPTION_ID }
  )
}

/** Show a caption and hold it long enough to be read. */
export async function say(page: Page, text: string, holdMs = 2400): Promise<void> {
  await page.evaluate(
    ({ id, value }) => {
      const el = document.getElementById(id)
      if (!el) return
      el.textContent = value
      el.style.opacity = "1"
    },
    { id: CAPTION_ID, value: text }
  )
  await page.waitForTimeout(holdMs)
}

/** Hide the caption — use before a screen you want seen unobstructed. */
export async function clearCaption(page: Page): Promise<void> {
  await page.evaluate((id) => {
    const el = document.getElementById(id)
    if (el) el.style.opacity = "0"
  }, CAPTION_ID)
}

/** A pause. Viewers need ~1.5-2.5s to take in a screen they've never seen. */
export async function beat(page: Page, ms = 1600): Promise<void> {
  await page.waitForTimeout(ms)
}
