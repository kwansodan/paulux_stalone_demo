import { promises as fs } from "fs"
import path from "path"

/**
 * Playwright writes videos to output/raw/<generated-test-dir>/video.webm, which
 * is unusable as a deliverable. This runs after the whole suite — once every
 * context is closed and every file is finalised — and copies each one out under
 * the name of the spec that produced it.
 *
 * Done as a global teardown rather than an afterEach on purpose: the video file
 * is only flushed when the browser context closes, so copying earlier races
 * with the writer and can yield a truncated file.
 */
export default async function collectVideos(): Promise<void> {
  const root = path.join(__dirname, "..", "output")
  const raw = path.join(root, "raw")
  const clips = path.join(root, "clips")

  try {
    await fs.access(raw)
  } catch {
    console.log("[collect-videos] nothing recorded")
    return
  }

  await fs.mkdir(clips, { recursive: true })

  const dirs = await fs.readdir(raw, { withFileTypes: true })
  let copied = 0

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue

    const dirPath = path.join(raw, dir.name)
    const files = await fs.readdir(dirPath)
    const video = files.find((f) => f.endsWith(".webm"))
    if (!video) continue

    // Playwright's directory name is "<spec>-<test-title>-<project>"; strip the
    // repeated project suffix and tidy it into a filename you'd send someone.
    const name = dir.name
      .replace(/-chromium$/, "")
      .replace(/-+/g, "-")
      .toLowerCase()

    const target = path.join(clips, `${name}.webm`)
    await fs.copyFile(path.join(dirPath, video), target)
    copied += 1
    console.log(`[collect-videos] ${path.relative(root, target)}`)
  }

  if (copied === 0) {
    console.log("[collect-videos] no .webm files found — did the run fail early?")
  } else {
    console.log(`[collect-videos] ${copied} clip(s) in output/clips`)
    console.log("[collect-videos] run `npm run mp4` to convert for WhatsApp")
  }
}
