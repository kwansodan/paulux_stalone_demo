/**
 * One-shot script: replace old MinIO domain in all image URL columns.
 *
 * Old domain: https://polarisbeauty.biz/files
 * New domain: https://polarisbeautylounge.com/files
 *
 * Run against production DB:
 *   DATABASE_URL="<prod-url>" npx tsx scripts/fix-minio-urls.ts
 *
 * Or from inside the running app container:
 *   npx tsx scripts/fix-minio-urls.ts
 */

import { PrismaClient } from "@generated/prisma/client"

const OLD = "https://polarisbeauty.biz/files"
const NEW  = "https://polarisbeautylounge.com/files"

const prisma = new PrismaClient()

async function main() {
  console.log(`Replacing\n  ${OLD}\nwith\n  ${NEW}\n`)

  // StyleImage.url
  const styleImages = await prisma.$executeRaw`
    UPDATE "StyleImage"
    SET    "url" = REPLACE("url", ${OLD}, ${NEW})
    WHERE  "url" LIKE ${"%" + OLD + "%"}
  `
  console.log(`StyleImage rows updated:    ${styleImages}`)

  // Service.imageUrl
  const services = await prisma.$executeRaw`
    UPDATE "Service"
    SET    "imageUrl" = REPLACE("imageUrl", ${OLD}, ${NEW})
    WHERE  "imageUrl" LIKE ${"%" + OLD + "%"}
  `
  console.log(`Service rows updated:       ${services}`)

  // ServicePackage.imageUrl
  const packages = await prisma.$executeRaw`
    UPDATE "ServicePackage"
    SET    "imageUrl" = REPLACE("imageUrl", ${OLD}, ${NEW})
    WHERE  "imageUrl" LIKE ${"%" + OLD + "%"}
  `
  console.log(`ServicePackage rows updated: ${packages}`)

  // Product.imageUrl
  const products = await prisma.$executeRaw`
    UPDATE "Product"
    SET    "imageUrl" = REPLACE("imageUrl", ${OLD}, ${NEW})
    WHERE  "imageUrl" LIKE ${"%" + OLD + "%"}
  `
  console.log(`Product rows updated:       ${products}`)

  console.log("\nDone.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
