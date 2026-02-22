import React from 'react';
import { Html, Head, Body, Tailwind, Container, Section, Text, Button, Img } from "@react-email/components"
import { getBaseUrl } from '@/utils/url';

interface EmailBookingCancelledProps {
  url: string;
}

const EmailBookingCancelled = ({ url }: EmailBookingCancelledProps) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="font-sans bg-gray-50 p-8">
          <Container className="bg-white rounded-lg shadow-sm max-w-2xl mx-auto p-8">
            <Section className="mb-6">
              <div className="flex items-center gap-3 mb-8">
                <Img
                  src={getBaseUrl() + "/images/polarisicon.png"}
                  alt="Polaris Logo"
                  width={100}
                  height={50}
                />
              </div>
            </Section>

            <Section className="mb-6">
              <Text className="text-3xl font-bold text-gray-900 mb-6">Booking Cancelled</Text>
              <Text className="text-gray-700 text-base leading-relaxed mb-6">
                Your booking has been successfully cancelled. We&apos;re sorry to see you go! If this cancellation was made in error, please contact our support team immediately.
              </Text>
              <Text className="text-gray-700 text-base leading-relaxed mb-6">
                You can view your booking summary and cancellation details by clicking the button below.
              </Text>
            </Section>

            <Section className="mb-6">
              <Button
                href={url}
                className="bg-purple-600 text-white font-medium px-8 py-3 rounded-md"
              >
                View Booking Summary
              </Button>
            </Section>

            <Section>
              <Text className="text-gray-600 text-sm mb-2">
                If you have any questions or concerns about this cancellation, please don&apos;t hesitate to reach out to our support team.
              </Text>
              <Text className="text-gray-600 text-sm">
                We hope to serve you again in the future!
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default EmailBookingCancelled;