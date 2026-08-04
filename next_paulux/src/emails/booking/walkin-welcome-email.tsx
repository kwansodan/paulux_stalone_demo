import React from "react"
import {
  Html, Head, Body, Tailwind, Container, Section,
  Text, Button, Img, Hr,
} from "@react-email/components"
import { getBaseUrl } from "@/utils/url"

interface WalkinWelcomeEmailProps {
  clientName: string
  bookingReference: string
  serviceNames: string[]
  productNames?: string[]
  bookingSummaryUrl: string
}

const WalkinWelcomeEmail = ({
  clientName,
  bookingReference,
  serviceNames,
  productNames,
  bookingSummaryUrl,
}: WalkinWelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="font-sans bg-gray-50 p-8">
          <Container className="bg-white rounded-lg shadow-sm max-w-2xl mx-auto p-8">

            {/* Logo */}
            <Section className="mb-8">
              <Img
                src={getBaseUrl() + "/images/pauluxicon.png"}
                alt="Paulux Booking"
                width={100}
                height={50}
              />
            </Section>

            {/* Welcome heading */}
            <Section className="mb-6">
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to Paulux! 🌟
              </Text>
              <Text className="text-gray-700 text-base leading-relaxed mb-0">
                Hi {clientName}, we&apos;re so happy to have you with us today.
                You&apos;re about to experience something special — sit back and let us
                take care of everything.
              </Text>
            </Section>

            <Hr className="border-gray-200 my-6" />

            {/* Services */}
            <Section className="mb-6">
              <Text className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">
                Your service(s) today include
              </Text>
              {serviceNames.map((name, i) => (
                <Text key={i} className="text-fuchsia-700 text-lg font-semibold mb-1">
                  ✨ {name}
                </Text>
              ))}
            </Section>

            {productNames && productNames.length > 0 && (
              <>
                <Hr className="border-gray-200 my-6" />
                <Section className="mb-6">
                  <Text className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">
                    Products
                  </Text>
                  {productNames.map((name, i) => (
                    <Text key={i} className="text-gray-800 text-base font-medium mb-1">
                      🛍 {name}
                    </Text>
                  ))}
                </Section>
              </>
            )}

            <Hr className="border-gray-200 my-6" />

            {/* Relaxation message */}
            <Section className="bg-fuchsia-50 rounded-xl p-6 mb-6">
              <Text className="text-fuchsia-900 text-base leading-relaxed m-0">
                You&apos;re in great hands. Our team is ready to give you the best
                experience possible. Relax, enjoy the moment, and leave feeling
                absolutely amazing. 💆‍♀️
              </Text>
            </Section>

            {/* Instagram */}
            <Section className="mb-6">
              <Text className="text-gray-600 text-sm leading-relaxed">
                Have any questions or concerns? We&apos;re always here for you.
                Reach out to us on Instagram and we&apos;ll get back to you right away.
              </Text>
              <Text className="text-fuchsia-600 font-semibold text-base mb-0">
                📸 instagram.com/pauluxbooking
              </Text>
            </Section>

            {/* CTA */}
            <Section className="mb-8">
              <Button
                href={bookingSummaryUrl}
                className="bg-fuchsia-600 text-white font-medium px-8 py-3 rounded-md"
              >
                View Your Booking
              </Button>
            </Section>

            <Hr className="border-gray-200 my-6" />

            {/* Refund Policy */}
            <Section className="mb-6">
              <Text className="text-gray-700 text-sm font-semibold mb-3">
                📋 Refund Policy
              </Text>
              <Text className="text-gray-600 text-sm leading-relaxed mb-2">
                <strong>Eligible refunds:</strong> If we cancel your appointment, your booking is rejected after payment, or a technical error results in a duplicate charge.
              </Text>
              <Text className="text-gray-600 text-sm leading-relaxed mb-2">
                <strong>Non-refundable:</strong> Failure to attend your appointment without prior cancellation (no-show) will result in forfeiture of payment.
              </Text>
              <Text className="text-gray-600 text-sm leading-relaxed mb-0">
                <strong>Refund process:</strong> Refunds are processed manually and may take 5–10 business days. To request a refund, contact us at <strong>hello@pauluxbooking.com</strong> with your booking reference <strong>{bookingReference}</strong>.
              </Text>
            </Section>

            {/* Footer */}
            <Section className="border-t border-gray-100 pt-6">
              <Text className="text-gray-400 text-xs m-0">
                Ref: {bookingReference} · Paulux Booking
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default WalkinWelcomeEmail
