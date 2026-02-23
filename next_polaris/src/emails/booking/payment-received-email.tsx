import React from 'react';
import { Html, Head, Body, Tailwind, Container, Section, Text, Button, Heading, Img, Row, Column } from "@react-email/components";
import { getBaseUrl } from '@/utils/url';

interface PaymentReceivedEmailProps {
    adminName: string;
    clientName: string;
    bookingReference: string;
    serviceName: string;
    bookingDate: string;
    bookingTime: string;
    amountPaid: number;
    provider: string;
    bookingId: string;
}

const PaymentReceivedEmail = ({
    adminName,
    clientName,
    bookingReference,
    serviceName,
    bookingDate,
    bookingTime,
    amountPaid,
    provider,
    bookingId,
}: PaymentReceivedEmailProps) => {
    const bookingUrl = getBaseUrl() + `/bookings/${bookingId}`;

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
                            <Heading className="text-2xl font-bold text-gray-900 mb-2">
                                💰 Payment Received
                            </Heading>
                            <Text className="text-gray-600 text-base mb-6">
                                Hi {adminName}, a payment has just been confirmed for a booking.
                            </Text>
                        </Section>

                        <Section className="bg-gray-50 rounded-lg p-6 mb-6">
                            <Row className="mb-3">
                                <Column className="w-1/2">
                                    <Text className="text-gray-500 text-sm font-medium m-0">Client</Text>
                                    <Text className="text-gray-900 text-base font-semibold m-0">{clientName}</Text>
                                </Column>
                                <Column className="w-1/2">
                                    <Text className="text-gray-500 text-sm font-medium m-0">Reference</Text>
                                    <Text className="text-gray-900 text-base font-semibold m-0">{bookingReference}</Text>
                                </Column>
                            </Row>
                            <Row className="mb-3">
                                <Column className="w-1/2">
                                    <Text className="text-gray-500 text-sm font-medium m-0">Service</Text>
                                    <Text className="text-gray-900 text-base font-semibold m-0">{serviceName}</Text>
                                </Column>
                                <Column className="w-1/2">
                                    <Text className="text-gray-500 text-sm font-medium m-0">Provider</Text>
                                    <Text className="text-gray-900 text-base font-semibold m-0">{provider}</Text>
                                </Column>
                            </Row>
                            <Row className="mb-3">
                                <Column className="w-1/2">
                                    <Text className="text-gray-500 text-sm font-medium m-0">Date</Text>
                                    <Text className="text-gray-900 text-base font-semibold m-0">{bookingDate}</Text>
                                </Column>
                                <Column className="w-1/2">
                                    <Text className="text-gray-500 text-sm font-medium m-0">Time</Text>
                                    <Text className="text-gray-900 text-base font-semibold m-0">{bookingTime}</Text>
                                </Column>
                            </Row>
                            <Row>
                                <Column>
                                    <Text className="text-gray-500 text-sm font-medium m-0">Amount Paid</Text>
                                    <Text className="text-fuchsia-600 text-xl font-bold m-0">GHS {amountPaid.toFixed(2)}</Text>
                                </Column>
                            </Row>
                        </Section>

                        <Section className="mb-8">
                            <Button
                                href={bookingUrl}
                                className="bg-fuchsia-600 text-white font-medium px-8 py-3 rounded-md"
                            >
                                View Booking
                            </Button>
                        </Section>

                        <Section className="border-t border-gray-100 pt-6">
                            <Text className="text-gray-500 text-sm">
                                This is an automated notification from Polaris. You are receiving this because you are an admin.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default PaymentReceivedEmail;
