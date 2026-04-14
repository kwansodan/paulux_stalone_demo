export const signInPath = () => "/login"
export const signUpPath = () => "/sign-up"
export const homePath = () => "/home"
export const customerServicesPath = () => "/customer/services"
export const customerBookingPath = (serviceId?: string) => {
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
export const serviceCategoriesPath = () => "/service-categories"
export const availabilityPath = () => "/availability"
export const reportsPath = () => "/reports"
export const unauthorizedPath = () => "/unauthorized"
export const forgotPasswordPath = () => "/forgot-password"
export const resetPasswordPath = () => "/reset-password"