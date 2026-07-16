"use client"

import { REPORT_CONFIG } from "../reports-config"
import ReportView from "./report-view"

export default function ReportRouter({ slug }: { slug: string }) {
  const cfg = REPORT_CONFIG[slug]
  if (!cfg) return null
  return (
    <ReportView
      slug={slug}
      title={cfg.title}
      endpoint={cfg.endpoint ?? slug}
      columns={cfg.columns}
      summary={cfg.summary}
    />
  )
}
