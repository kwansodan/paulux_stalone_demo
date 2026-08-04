import React from "react"
import { Html, Head, Body, Tailwind, Container, Section, Text, Heading, Hr } from "@react-email/components"

interface LowStockAlertEmailProps {
  productName: string
  currentStock: number
  threshold: number
  isOutOfStock: boolean
}

export default function LowStockAlertEmail({
  productName,
  currentStock,
  threshold,
  isOutOfStock,
}: LowStockAlertEmailProps) {
  const subject = isOutOfStock
    ? `⚠️ Out of Stock: ${productName}`
    : `⚠️ Low Stock Alert: ${productName}`

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="max-w-lg mx-auto py-8 px-4">
            <Section className="bg-white rounded-2xl border border-gray-200 p-8">
              <Heading className="text-xl font-bold text-gray-900 mb-2">
                {isOutOfStock ? "Out of Stock Alert" : "Low Stock Alert"}
              </Heading>
              <Text className="text-sm text-gray-500 mb-6">Paulux Booking — Inventory Notice</Text>

              <Hr className="border-gray-100 mb-6" />

              <Section className={`rounded-xl p-4 mb-6 ${isOutOfStock ? "bg-red-50" : "bg-amber-50"}`}>
                <Text className={`text-base font-semibold mb-1 ${isOutOfStock ? "text-red-700" : "text-amber-700"}`}>
                  {productName}
                </Text>
                <Text className={`text-sm ${isOutOfStock ? "text-red-600" : "text-amber-600"}`}>
                  {isOutOfStock
                    ? "This product is now out of stock (0 units remaining)."
                    : `Stock is low: ${currentStock} unit${currentStock === 1 ? "" : "s"} remaining (threshold: ${threshold}).`}
                </Text>
              </Section>

              <Text className="text-sm text-gray-600 mb-2">
                Please restock this product as soon as possible to avoid disruptions to service.
              </Text>

              <Hr className="border-gray-100 mt-6 mb-4" />
              <Text className="text-xs text-gray-400 text-center">
                Paulux Booking · pauluxbooking.com
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export { subject as lowStockEmailSubject }

function subject(productName: string, isOutOfStock: boolean) {
  return isOutOfStock ? `⚠️ Out of Stock: ${productName}` : `⚠️ Low Stock Alert: ${productName}`
}
