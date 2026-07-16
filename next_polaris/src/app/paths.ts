export const signInPath = () => "/login"
export const signUpPath = () => "/sign-up"
export const homePath = () => "/"
export const customerServicesPath = () => "/customer/services"
export const serviceDetailPath = (slug: string) => `/services/${slug}`
export const faqPath = () => "/faq"
export const customerBookingPath = (serviceId?: string, packageId?: string) => {
  if (packageId) {
    return `/customer/booking?packageId=${packageId}`
  }
  if (serviceId) {
    return `/customer/booking?serviceId=${serviceId}`
  }
  return "/customer/booking"
}
export const customerBookingSummaryPath = (id:string) => `/customer/booking/summary/${id}`
export const dashboardPath = () => "/dashboard"
export const bookingsPath = () => "/bookings"
export const paymentsPath = () => "/payments"
export const servicesPath = () => "/services"
export const productsPath = () => "/products"
export const materialsPath = () => "/materials"
export const materialUsageReportPath = () => "/materials/usage"
export const reportsPath = () => "/reports"
export const reportPath = (slug: string) => `/reports/${slug}`
export const appSettingsPath = () => "/app-settings"
export const promoCodesPath = () => "/promo-codes"
export const giftCardsPath = () => "/gift-cards"
export const giftCardSuccessPath = (reference?: string) =>
  reference ? `/gift-cards/success?reference=${reference}` : "/gift-cards/success"
export const giftCardOrdersPath = () => "/gift-card-orders"
export const unauthorizedPath = () => "/unauthorized"
export const forgotPasswordPath = () => "/forgot-password"
export const resetPasswordPath = () => "/reset-password"