import React from "react"
import {
  Html, Head, Body, Tailwind, Container, Section,
  Text, Button, Heading, Img, Row, Column, Hr,
} from "@react-email/components"
import { getBaseUrl } from "@/utils/url"

interface BookingUpdatedEmailProps {
  clientName: string
  bookingReference: string
  changeSummary: string[]
  bookingDate: string
  bookingTime: string
  bookingSummaryUrl: string
}

const BookingUpdatedEmail = ({
  clientName,
  bookingReference,
  changeSummary,
  bookingDate,
  bookingTime,
  bookingSummaryUrl,
}: BookingUpdatedEmailProps) => {
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
                ✏️ Your booking has been updated
              </Heading>
              <Text className="text-gray-600 text-base mb-0">
                Hi {clientName}, here&apos;s what changed on your booking ({bookingReference}):
              </Text>
            </Section>

            {/* Change summary */}
            <Section className="bg-gray-50 rounded-lg p-6 mb-6">
              {changeSummary.map((line, i) => (
                <Text key={i} className="text-gray-900 text-base m-0 mb-2">
                  • {line}
                </Text>
              ))}
            </Section>

            <Hr className="border-gray-200 mb-6" />

            {/* Current date/time */}
            <Section className="mb-6">
              <Row>
                <Column className="w-1/2">
                  <Text className="text-gray-500 text-xs font-medium m-0">Date</Text>
                  <Text className="text-gray-900 text-base font-semibold m-0">{bookingDate}</Text>
                </Column>
                <Column className="w-1/2">
                  <Text className="text-gray-500 text-xs font-medium m-0">Time</Text>
                  <Text className="text-gray-900 text-base font-semibold m-0">{bookingTime}</Text>
                </Column>
              </Row>
            </Section>

            {/* CTA */}
            <Section className="mb-8">
              <Button
                href={bookingSummaryUrl}
                className="bg-fuchsia-600 text-white font-medium px-8 py-3 rounded-md"
              >
                View Booking Details
              </Button>
            </Section>

            {/* Footer */}
            <Section className="border-t border-gray-100 pt-6">
              <Text className="text-gray-500 text-sm m-0">
                Polaris Beauty Lounge — we can&apos;t wait to see you!
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default BookingUpdatedEmail
