import { siteConfig } from "@/lib/site-config"

/**
 * Curated FAQ content. Answers are grounded in the salon's real policies
 * (deposits, non-refundable bookings, postponement, Paystack, location) and
 * fed to both the visible page and the FAQPage JSON-LD.
 *
 * Keep answers factual and self-contained — AI answer engines quote these
 * directly, so each answer should make sense out of context.
 */
export const faqs: Array<{ question: string; answer: string }> = [
  {
    question: `Where is ${siteConfig.name} located?`,
    answer: `${siteConfig.name} is located at ${siteConfig.address.street}, ${siteConfig.address.locality}, Ghana. You can reach us on ${siteConfig.contact.phones[0]} or message us on WhatsApp.`,
  },
  {
    question: "How do I book an appointment?",
    answer:
      "You can book online in a few steps: choose your service, pick an available date and time, and pay the deposit to confirm. You'll receive a confirmation email once payment is processed.",
  },
  {
    question: "Do I need to pay a deposit to book?",
    answer:
      "Yes. A deposit is required to secure your appointment. The deposit amount is shown on each service before you confirm, and it goes towards the total cost of your treatment.",
  },
  {
    question: "What payment methods do you accept?",
    answer: `Payments are processed securely online through Paystack. All prices are shown in Ghana Cedis (${siteConfig.currency}). We do not store your card details.`,
  },
  {
    question: "Can I cancel or reschedule my appointment?",
    answer:
      "Bookings are non-refundable, but you can request to postpone your appointment to a later date. Please contact us in advance to arrange a new time.",
  },
  {
    question: "What happens if I miss my appointment?",
    answer:
      "Failure to attend without prior notice may result in forfeiture of your payment. If you can't make it, reach out to us beforehand and we'll help you reschedule.",
  },
  {
    question: "What are your opening hours?",
    answer: siteConfig.openingHours
      .map(
        (spec) =>
          `${spec.days.join(", ")}: ${spec.opens}–${spec.closes}`,
      )
      .join(". "),
  },
  {
    question: "Do you sell gift cards?",
    answer: `Yes — ${siteConfig.name} gift cards can be purchased online and redeemed against any of our treatments.`,
  },
]
