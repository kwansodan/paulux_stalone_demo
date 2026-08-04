import React from "react"
import {
  Html, Head, Body, Tailwind, Container, Section,
  Text, Button, Heading, Img, Row, Column, Hr,
} from "@react-email/components"
import { getBaseUrl } from "@/utils/url"

interface GiftCardRecipientEmailProps {
  recipientName: string
  senderName: string
  message?: string | null
  code: string
  amount: string
  itemSummary?: string
  redeemUrl: string
}

const GiftCardRecipientEmail = ({
  recipientName,
  senderName,
  message,
  code,
  amount,
  itemSummary,
  redeemUrl,
}: GiftCardRecipientEmailProps) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="font-sans bg-gray-50 p-8">
          <Container className="bg-white rounded-lg shadow-sm max-w-2xl mx-auto p-8">

            {/* Logo */}
            <Section className="mb-6">
              <Img
                src={getBaseUrl() + "/images/pauluxicon.png"}
                alt="Paulux Booking"
                width={100}
                height={50}
              />
            </Section>

            {/* Heading */}
            <Section className="mb-6">
              <Heading className="text-2xl font-bold text-gray-900 mb-2">
                🎁 You&apos;ve received a gift!
              </Heading>
              <Text className="text-gray-600 text-base mb-0">
                Hi {recipientName}, {senderName} has sent you a gift from Paulux Booking worth GHS {amount}.
              </Text>
              {message ? (
                <Text className="text-gray-600 text-base italic mt-2">
                  &ldquo;{message}&rdquo;
                </Text>
              ) : null}
            </Section>

            {/* Gift details */}
            <Section className="bg-gray-50 rounded-lg p-6 mb-6">
              <Row className="mb-4">
                <Column className="w-1/2">
                  <Text className="text-gray-500 text-xs font-medium m-0">Gift Code</Text>
                  <Text className="text-gray-900 text-lg font-bold tracking-wide m-0">{code}</Text>
                </Column>
                <Column className="w-1/2">
                  <Text className="text-gray-500 text-xs font-medium m-0">Value</Text>
                  <Text className="text-gray-900 text-base font-semibold m-0">GHS {amount}</Text>
                </Column>
              </Row>
              {itemSummary ? (
                <Row>
                  <Column>
                    <Text className="text-gray-500 text-xs font-medium m-0">Includes</Text>
                    <Text className="text-gray-900 text-base font-semibold m-0">{itemSummary}</Text>
                  </Column>
                </Row>
              ) : null}
            </Section>

            <Hr className="border-gray-200 mb-6" />

            {/* CTA */}
            <Section className="mb-8">
              <Text className="text-gray-600 text-sm mb-4">
                Use your gift code at checkout when booking any service with us, or
                show it at the salon. You can use the full value at once or spend it
                across multiple visits.
              </Text>
              <Button
                href={redeemUrl}
                className="bg-fuchsia-600 text-white font-medium px-8 py-3 rounded-md"
              >
                Book now and redeem
              </Button>
            </Section>

            {/* Footer */}
            <Section className="border-t border-gray-100 pt-6">
              <Text className="text-gray-500 text-sm m-0">
                Paulux Booking — we can&apos;t wait to see you!
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default GiftCardRecipientEmail
