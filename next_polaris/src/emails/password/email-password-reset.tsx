import React from 'react';
import { Html, Head, Body, Tailwind, Container, Section, Text, Button, Img } from "@react-email/components"
import { getBaseUrl } from '@/utils/url';

interface EmailPasswordResetProps {
    url: string;
}

const EmailPasswordReset = ({ url }: EmailPasswordResetProps) => {
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
                            <Text className="text-3xl font-bold text-gray-900 mb-6">Urgent!</Text>
                            <Text className="text-gray-700 text-base leading-relaxed mb-6">
                                A recent request was made to reset your password, ignore this email if this was not initiated by you, otherwise hit the button below to proceed to reset your password
                            </Text>
                        </Section>

                        <Section className="mb-6">
                            <Button
                                href={url}
                                className="bg-purple-600 text-white font-medium px-8 py-3 rounded-md"
                            >
                                Reset password
                            </Button>
                        </Section>

                        <Section>
                            <Text className="text-gray-600 text-sm">
                                This link will expire in 2 hours for security reasons.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}

export default EmailPasswordReset;