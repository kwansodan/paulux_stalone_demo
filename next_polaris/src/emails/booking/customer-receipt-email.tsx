import React from "react"
import {
  Html, Head, Body, Tailwind, Container, Section,
  Text, Button, Heading, Img, Row, Column, Hr,
} from "@react-email/components"
import { getBaseUrl } from "@/utils/url"

interface CustomerReceiptEmailProps {
  clientName: string
  bookingReference: string
  serviceNames: string
  bookingDate: string
  bookingTime: string
  /** Amount paid in this transaction */
  amountPaid: number
  /** Grand total for the booking */
  totalAmount: number
  /** Total paid across all transactions so far (including this one) */
  totalPaid: number
  bookingId: string
}

const CustomerReceiptEmail = ({
  clientName,
  bookingReference,
  serviceNames,
  bookingDate,
  bookingTime,
  amountPaid,
  totalAmount,
  totalPaid,
  bookingId,
}: CustomerReceiptEmailProps) => {
  const summaryUrl = getBaseUrl() + `/customer/booking/summary/${bookingId}`
  const remainingBalance = Math.max(0, totalAmount - totalPaid)
  const isFullyPaid = remainingBalance === 0

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

            {/* Heading */}
            <Section className="mb-6">
              <Heading className="text-2xl font-bold text-gray-900 mb-2">
                {isFullyPaid ? "✅ Payment Confirmed" : "💳 Payment Receipt"}
              </Heading>
              <Text className="text-gray-600 text-base mb-0">
                Hi {clientName}, thank you for your payment. Here is your receipt.
              </Text>
            </Section>

            {/* Booking details */}
            <Section className="bg-gray-50 rounded-lg p-6 mb-6">
              <Row className="mb-4">
                <Column className="w-1/2">
                  <Text className="text-gray-500 text-sm font-medium m-0">Booking Reference</Text>
                  <Text className="text-gray-900 text-base font-semibold m-0">{bookingReference}</Text>
                </Column>
                <Column className="w-1/2">
                  <Text className="text-gray-500 text-sm font-medium m-0">Service(s)</Text>
                  <Text className="text-gray-900 text-base font-semibold m-0">{serviceNames}</Text>
                </Column>
              </Row>
              <Row className="mb-4">
                <Column className="w-1/2">
                  <Text className="text-gray-500 text-sm font-medium m-0">Date</Text>
                  <Text className="text-gray-900 text-base font-semibold m-0">{bookingDate}</Text>
                </Column>
                <Column className="w-1/2">
                  <Text className="text-gray-500 text-sm font-medium m-0">Time</Text>
                  <Text className="text-gray-900 text-base font-semibold m-0">{bookingTime}</Text>
                </Column>
              </Row>
            </Section>

            {/* Payment breakdown */}
            <Section className="mb-6">
              <Row className="mb-2">
                <Column>
                  <Text className="text-gray-600 text-sm m-0">Amount paid now</Text>
                </Column>
                <Column className="text-right">
                  <Text className="text-fuchsia-600 text-base font-bold m-0">
                    GHS {amountPaid.toFixed(2)}
                  </Text>
                </Column>
              </Row>
              <Hr className="border-gray-200 my-2" />
              <Row className="mb-2">
                <Column>
                  <Text className="text-gray-600 text-sm m-0">Total paid to date</Text>
                </Column>
                <Column className="text-right">
                  <Text className="text-gray-900 text-sm font-semibold m-0">
                    GHS {totalPaid.toFixed(2)}
                  </Text>
                </Column>
              </Row>
              <Row className="mb-2">
                <Column>
                  <Text className="text-gray-600 text-sm m-0">Booking total</Text>
                </Column>
                <Column className="text-right">
                  <Text className="text-gray-900 text-sm font-semibold m-0">
                    GHS {totalAmount.toFixed(2)}
                  </Text>
                </Column>
              </Row>
              {!isFullyPaid && (
                <Row>
                  <Column>
                    <Text className="text-amber-700 text-sm font-medium m-0">Remaining balance</Text>
                  </Column>
                  <Column className="text-right">
                    <Text className="text-amber-700 text-sm font-bold m-0">
                      GHS {remainingBalance.toFixed(2)}
                    </Text>
                  </Column>
                </Row>
              )}
              {isFullyPaid && (
                <Row>
                  <Column>
                    <Text className="text-green-700 text-sm font-semibold m-0">✓ Fully paid</Text>
                  </Column>
                </Row>
              )}
            </Section>

            {/* CTA */}
            <Section className="mb-8">
              <Button
                href={summaryUrl}
                className="bg-fuchsia-600 text-white font-medium px-8 py-3 rounded-md"
              >
                View Booking Details
              </Button>
            </Section>

            {/* Footer */}
            <Section className="border-t border-gray-100 pt-6">
              <Text className="text-gray-500 text-sm m-0">
                Polaris Beauty Lounge &mdash; thank you for choosing us. See you soon!
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default CustomerReceiptEmail
