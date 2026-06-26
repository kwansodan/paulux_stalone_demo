import React from "react"
import {
  Html, Head, Body, Tailwind, Container, Section,
  Text, Button, Heading, Img,
} from "@react-email/components"
import { getBaseUrl } from "@/utils/url"

interface FeedbackRequestEmailProps {
  clientName: string
  serviceNames: string
  reviewLink: string | null
}

const FeedbackRequestEmail = ({ clientName, serviceNames, reviewLink }: FeedbackRequestEmailProps) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="font-sans bg-gray-50 p-8">
          <Container className="bg-white rounded-lg shadow-sm max-w-2xl mx-auto p-8">

            <Section className="mb-6">
              <Img
                src={getBaseUrl() + "/images/polarisicon.png"}
                alt="Polaris Beauty Lounge"
                width={100}
                height={50}
              />
            </Section>

            <Section className="mb-6">
              <Heading className="text-2xl font-bold text-gray-900 mb-2">
                💛 How was your visit?
              </Heading>
              <Text className="text-gray-600 text-base mb-0">
                Hi {clientName}, thank you for choosing Polaris Beauty Lounge for your {serviceNames}!
                We hope you loved it.
              </Text>
              <Text className="text-gray-600 text-base mb-0 mt-3">
                {reviewLink
                  ? "It would mean a lot to us if you could take a minute to share your experience:"
                  : "We'd love to hear about your experience — feel free to reply to this email and let us know!"}
              </Text>
            </Section>

            {reviewLink && (
              <Section className="mb-8">
                <Button
                  href={reviewLink}
                  className="bg-fuchsia-600 text-white font-medium px-8 py-3 rounded-md"
                >
                  Leave a Review
                </Button>
              </Section>
            )}

            <Section className="border-t border-gray-100 pt-6">
              <Text className="text-gray-500 text-sm m-0">
                Polaris Beauty Lounge — thank you for your support!
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default FeedbackRequestEmail
