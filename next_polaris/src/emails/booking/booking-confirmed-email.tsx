import React from "react"
import {
  Html, Head, Body, Tailwind, Container, Section,
  Text, Button, Heading, Img, Row, Column, Hr,
} from "@react-email/components"
import { getBaseUrl } from "@/utils/url"

interface BookingConfirmedEmailProps {
  clientName: string
  bookingReference: string
  serviceNames: string
  bookingDate: string
  bookingTime: string
  bookingSummaryUrl: string
}

const BookingConfirmedEmail = ({
  clientName,
  bookingReference,
  serviceNames,
  bookingDate,
  bookingTime,
  bookingSummaryUrl,
}: BookingConfirmedEmailProps) => {
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
                📋 Booking Request Received
              </Heading>
              <Text className="text-gray-600 text-base mb-0">
                Hi {clientName}, thank you for your booking request for {serviceNames} on {bookingDate} at {bookingTime} (Ref: {bookingReference}).
              </Text>
              <Text className="text-gray-600 text-base mb-0 mt-3">
                To confirm your appointment, please complete your deposit payment using the link below.
              </Text>
            </Section>

            {/* Booking details */}
            <Section className="bg-gray-50 rounded-lg p-6 mb-6">
              <Row className="mb-4">
                <Column className="w-1/2">
                  <Text className="text-gray-500 text-xs font-medium m-0">Booking Reference</Text>
                  <Text className="text-gray-900 text-base font-semibold m-0">{bookingReference}</Text>
                </Column>
                <Column className="w-1/2">
                  <Text className="text-gray-500 text-xs font-medium m-0">Service(s)</Text>
                  <Text className="text-gray-900 text-base font-semibold m-0">{serviceNames}</Text>
                </Column>
              </Row>
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

            <Hr className="border-gray-200 mb-6" />

            {/* CTA */}
            <Section className="mb-6">
              <Button
                href={bookingSummaryUrl}
                className="bg-fuchsia-600 text-white font-medium px-8 py-3 rounded-md"
              >
                Pay Deposit Now
              </Button>
            </Section>

            <Section className="mb-8">
              <Text className="text-gray-600 text-sm font-medium m-0">
                Your booking will be confirmed once the deposit has been received.
              </Text>
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

export default BookingConfirmedEmail
