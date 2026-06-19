import type { Metadata } from "next"
import { JsonLd, buildFaqSchema, buildBreadcrumbSchema } from "@/components/seo/json-ld"
import { faqs } from "@/features/faq/content"
import { siteConfig } from "@/lib/site-config"
import { faqPath } from "@/app/paths"

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: `Answers about booking, deposits, payments, cancellations and visiting ${siteConfig.name} in ${siteConfig.address.locality}.`,
  alternates: { canonical: faqPath() },
}

export default function FaqPage() {
  return (
    <section className="px-4 py-10 max-w-2xl mx-auto w-full">
      <JsonLd schema={buildFaqSchema(faqs)} />
      <JsonLd
        schema={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "FAQ", path: faqPath() },
        ])}
      />

      <header className="text-center mb-10">
        <h1 className="font-family-seasons text-4xl mb-3">Frequently Asked Questions</h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Everything you need to know about booking and visiting {siteConfig.name}.
        </p>
      </header>

      <dl className="divide-y divide-gray-100">
        {faqs.map((faq) => (
          <div key={faq.question} className="py-5">
            <dt className="font-semibold text-gray-900 text-[15px] mb-1.5">{faq.question}</dt>
            <dd className="text-gray-600 text-sm leading-relaxed">{faq.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
