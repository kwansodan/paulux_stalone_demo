import React from "react"
import {
  Html, Head, Body, Tailwind, Container, Section,
  Text, Img, Hr,
} from "@react-email/components"
import { getBaseUrl } from "@/utils/url"

interface CustomerReceiptEmailProps {
  clientName: string
  bookingReference: string
  serviceNames: string[]
  paymentDate: string
  amountPaid: number
  paymentMethod: string
  /** Remaining balance — shows only when > 0 */
  remainingBalance?: number
}

const CustomerReceiptEmail = ({
  clientName,
  bookingReference,
  serviceNames,
  paymentDate,
  amountPaid,
  paymentMethod,
  remainingBalance = 0,
}: CustomerReceiptEmailProps) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="font-sans bg-gray-50 p-8">
          <Container className="bg-white rounded-lg shadow-sm max-w-2xl mx-auto p-8">

            {/* Logo */}
            <Section className="mb-6">
              <Img
                src={getBaseUrl() + "/images/polarisicon.png"}
                alt="Polaris Beauty Lounge"
                width={100}
                height={50}
              />
            </Section>

            {/* Greeting */}
            <Section className="mb-4">
              <Text className="text-gray-900 text-base font-semibold mb-1">
                Hello {clientName},
              </Text>
              <Text className="text-gray-700 text-base mb-0">
                Thank you for choosing Polaris Beauty Lounge.
              </Text>
            </Section>

            <Hr className="border-gray-200 my-5" />

            {/* Payment confirmation */}
            <Section className="mb-4">
              <Text className="text-gray-700 text-base mb-4">
                We confirm receipt of your payment of{" "}
                <strong className="text-fuchsia-700">GHS {amountPaid.toFixed(2)}</strong>{" "}
                for the following service(s):
              </Text>

              {/* Service list */}
              {serviceNames.map((name, i) => (
                <Text key={i} className="text-gray-800 text-base mb-1 pl-2">
                  • {name}
                </Text>
              ))}
            </Section>

            {/* Payment details */}
            <Section className="bg-gray-50 rounded-lg p-5 mb-4">
              <Text className="text-gray-700 text-sm mb-1">
                <strong>Payment Method:</strong> {paymentMethod}
              </Text>
              <Text className="text-gray-700 text-sm mb-0">
                <strong>Date:</strong> {paymentDate}
              </Text>
              {remainingBalance > 0 && (
                <Text className="text-amber-700 text-sm mt-2 mb-0">
                  <strong>Outstanding balance:</strong> GHS {remainingBalance.toFixed(2)}
                </Text>
              )}
              <Text className="text-gray-400 text-xs mt-2 mb-0">
                Ref: {bookingReference}
              </Text>
            </Section>

            <Hr className="border-gray-200 my-5" />

            {/* Closing */}
            <Section className="mb-4">
              <Text className="text-gray-700 text-base mb-3">
                We appreciate your business and look forward to serving you again.
              </Text>
              <Text className="text-gray-700 text-base mb-0">
                For suggestions and complaints, please send us a message on our
                Instagram account at{" "}
                <a
                  href="https://instagram.com/polarisbeautylounge"
                  className="text-fuchsia-600"
                >
                  instagram.com/polarisbeautylounge
                </a>
              </Text>
            </Section>

            {/* Footer */}
            <Section className="border-t border-gray-100 pt-5">
              <Text className="text-gray-400 text-xs m-0">
                Polaris Beauty Lounge
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default CustomerReceiptEmail
