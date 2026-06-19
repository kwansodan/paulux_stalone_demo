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
    answer:
      "We are closed on Mondays. " +
      siteConfig.openingHours
        .map((spec) => `${spec.days.join(", ")}: ${spec.opens}–${spec.closes}`)
        .join(". ") +
      ".",
  },
  {
    question: "Do you sell gift cards?",
    answer: `Yes — ${siteConfig.name} gift cards can be purchased online and redeemed against any of our treatments.`,
  },
  {
    question: `What services does ${siteConfig.name} offer?`,
    answer: `${siteConfig.name} is a full-service unisex salon in ${siteConfig.address.locality} offering braids, hair styling, ladies', men's and kids' haircuts, hair care, nails and pedicures, lash extensions, facials, waxing and massage. You can browse the full menu and book any service online.`,
  },
  {
    question: `Is ${siteConfig.name} a unisex salon?`,
    answer: `Yes. ${siteConfig.name} is a unisex salon — we welcome women, men and children, with dedicated services for each, from braids and nails to men's grooming and kids' haircuts.`,
  },
  {
    question: "Do you offer men's haircuts and grooming?",
    answer:
      "Yes. Men's haircuts and grooming are part of our unisex service menu. You can book a men's haircut online and choose a time that suits you.",
  },
  {
    question: "Do you do children's haircuts?",
    answer:
      "Yes, we offer kids' haircuts. We're a family-friendly unisex salon, so you can book appointments for children alongside adults.",
  },
  {
    question: "Do you offer braids, twists and cornrows?",
    answer:
      "Yes — braiding is one of our specialities, including box braids, passion twists, cornrows and bonestraight braids. Each style is listed individually online with its price and estimated duration, so you can book exactly the look you want.",
  },
  {
    question: "Do you do nails and pedicures?",
    answer:
      "Yes. We offer manicures, pedicures and nail care. Browse our Nails & Pedicure services online to see the options and book a slot.",
  },
  {
    question: "Do you offer lash extensions, facials and waxing?",
    answer:
      "Yes. Alongside hair and nails, we offer lash extensions, facials, waxing and massage. Each is listed under its category on our services page and can be booked online.",
  },
  {
    question: "Do you accept walk-ins, or do I need to book?",
    answer:
      "We recommend booking online so your preferred time is guaranteed and your stylist is ready for you. Walk-ins are welcome too, but are subject to availability — booking ahead is the surest way to be seen.",
  },
  {
    question: "How long will my appointment take?",
    answer:
      "It depends on the service. Every treatment shows an estimated duration when you book — for example, manicures take around 30 minutes, while braided styles often take an hour or more. Check the service details for the time to allow.",
  },
  {
    question: "Can I pay with mobile money?",
    answer: `Yes. Online payments are processed securely through Paystack, which supports mobile money. All prices are shown in Ghana Cedis (${siteConfig.currency}).`,
  },
  {
    question: "How do I redeem a gift card?",
    answer:
      "Enter your gift card code at checkout when booking online, or present it at the salon. A gift card holds a cash value you can spend on any service — in full or in part — and any remaining balance stays on the card for your next visit.",
  },
  {
    question: "Can I book more than one service in a single visit?",
    answer:
      "Yes. You can book multiple services for the same visit, and we also offer packages that combine popular treatments at a better price — look out for these when browsing our services.",
  },
  {
    question: `How can I contact ${siteConfig.name}?`,
    answer: `You can call us on ${siteConfig.contact.phones[0]} or ${siteConfig.contact.phones[1]}, message us on WhatsApp, or email ${siteConfig.contact.email}. We're also on Instagram, Facebook and TikTok as @polarisbeautylounge.`,
  },
]
