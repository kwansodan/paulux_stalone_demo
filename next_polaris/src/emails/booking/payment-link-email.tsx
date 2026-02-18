import React from 'react';
import { Html, Head, Body, Tailwind, Container, Section, Text, Button, Heading } from "@react-email/components"

interface PaymentLinkEmailProps {
    customerName: string;
    serviceName: string;
    amount: number;
    paymentUrl: string;
    bookingDate: string;
    bookingTime: string;
}

const PaymentLinkEmail = ({
    customerName,
    serviceName,
    amount,
    paymentUrl,
    bookingDate,
    bookingTime
}: PaymentLinkEmailProps) => {
    return (
        <Html>
            <Head />
            <Tailwind>
                <Body className="font-sans bg-gray-50 p-8">
                    <Container className="bg-white rounded-lg shadow-sm max-w-2xl mx-auto p-8">
                        <Section className="mb-6">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-fuchsia-100 rounded-full flex items-center justify-center">
                                    <span className="text-fuchsia-600 text-xl font-bold">P</span>
                                </div>
                                <Text className="text-xl font-semibold m-0">Polaris</Text>
                            </div>
                        </Section>

                        <Section className="mb-6">
                            <Heading className="text-2xl font-bold text-gray-900 mb-4">Complete Your Booking</Heading>
                            <Text className="text-gray-700 text-base leading-relaxed mb-4">
                                Hello {customerName},
                            </Text>
                            <Text className="text-gray-700 text-base leading-relaxed mb-6">
                                Your booking for <strong>{serviceName}</strong> has been created. To confirm your appointment on <strong>{bookingDate}</strong> at <strong>{bookingTime}</strong>, please complete the payment of <strong>GHS {amount}</strong> using the link below.
                            </Text>
                        </Section>

                        <Section className="mb-8 text-center">
                            <Button
                                href={paymentUrl}
                                className="bg-fuchsia-600 text-white font-medium px-10 py-4 rounded-md inline-block text-center"
                            >
                                Pay Now
                            </Button>
                        </Section>

                        <Section className="border-t border-gray-100 pt-6">
                            <Text className="text-gray-600 text-sm">
                                If you have any questions, please contact us.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}

export default PaymentLinkEmail;
