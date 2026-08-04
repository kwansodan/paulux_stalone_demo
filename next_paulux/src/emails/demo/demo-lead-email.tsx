import React from "react"
import { Html, Head, Body, Tailwind, Container, Section, Text, Heading, Hr } from "@react-email/components"

interface DemoLeadEmailProps {
  name: string
  email: string
  business?: string | null
  phone?: string | null
  message?: string | null
  requestedAt: string
}

export default function DemoLeadEmail({
  name,
  email,
  business,
  phone,
  message,
  requestedAt,
}: DemoLeadEmailProps) {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="max-w-lg mx-auto py-8 px-4">
            <Section className="bg-white rounded-2xl border border-gray-200 p-8">
              <Heading className="text-xl font-bold text-gray-900 mb-2">
                New demo request
              </Heading>
              <Text className="text-sm text-gray-500 mb-6">
                Paulux Booking — Demo Lead
              </Text>

              <Hr className="border-gray-100 mb-6" />

              <Section className="rounded-xl bg-gray-50 p-4 mb-6">
                <Text className="text-base font-semibold text-gray-900 mb-1">{name}</Text>
                <Text className="text-sm text-gray-600 m-0">{email}</Text>
                {business ? (
                  <Text className="text-sm text-gray-600 m-0">{business}</Text>
                ) : null}
                {phone ? (
                  <Text className="text-sm text-gray-600 m-0">{phone}</Text>
                ) : null}
              </Section>

              {message ? (
                <Section className="mb-6">
                  <Text className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                    What they said
                  </Text>
                  <Text className="text-sm text-gray-700 whitespace-pre-line">{message}</Text>
                </Section>
              ) : null}

              <Text className="text-sm text-gray-600 mb-2">
                They have been shown the demo credentials and are most likely
                looking around right now.
              </Text>

              <Hr className="border-gray-100 mt-6 mb-4" />
              <Text className="text-xs text-gray-400 text-center">
                Requested {requestedAt}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
