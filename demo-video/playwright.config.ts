import { defineConfig } from "@playwright/test"

/**
 * Recording config, not a test config. The goal is a watchable video, so
 * everything here trades speed for legibility.
 */
export default defineConfig({
  testDir: "./specs",
  outputDir: "./output/raw",
  globalTeardown: "./helpers/collect-videos.ts",

  // One at a time: parallel runs would interleave actions against the same
  // shared demo account and record each other's changes.
  workers: 1,
  fullyParallel: false,

  // A retry would leave a video of the failed attempt lying next to the good
  // one, and there is no way to tell them apart afterwards.
  retries: 0,

  // Generous: these walkthroughs are deliberately slow.
  timeout: 5 * 60 * 1000,

  reporter: [["list"]],

  use: {
    baseURL: process.env.BASE_URL || "http://51.255.200.48:3002",

    video: {
      mode: "on",
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },

    // Every action is padded so the eye can follow it. Combined with the
    // explicit beats in the specs, this is what stops the video looking like
    // a machine flicking through screens.
    launchOptions: {
      slowMo: 220,
    },

    // The demo is served over plain HTTP on a bare IP.
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
})
