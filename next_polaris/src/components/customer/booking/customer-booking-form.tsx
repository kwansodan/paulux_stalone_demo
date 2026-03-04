"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import StepIndicator from "./step-indicator"
import { SerializedService } from "@/features/service/types"
import { Step } from "@/components/customer/booking/step-indicator"
import CustomerDetailsForm from "./customer-details-form"
import SelectServiceStep from "./select-service-step"
import BookingDateTimeStep from "./booking-datetime-step"
import BookingConfirmationStep from "./booking-confirmation-step"
import { BOOKING_STEPS } from "@/constants"

export type BookingFormData = {
  // Step 1: Details
  fullName: string
  email: string
  phone: string

  minDepositPercent?: number

  // Step 2: Service
  serviceId: string | null
  service: SerializedService | null

  // Step 3: Date & Time
  date: string | null
  time: string | null

}

const initialFormData: BookingFormData = {
  serviceId: null,
  service: null,
  date: null,
  time: null,
  fullName: "",
  email: "",
  phone: "",
}



export default function CustomerBookingForm({
  services,
  preSelectedServiceId
}: {
  services: SerializedService[];
  preSelectedServiceId: string | null;
}) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)

  const [formData, setFormData] = useState<BookingFormData>(() => {
    if (preSelectedServiceId) {
      const preSelectedService = services.find(
        (service) => service.id === preSelectedServiceId
      )
      return {
        ...initialFormData,
        serviceId: preSelectedServiceId,
        service: preSelectedService || null,
      }
    }
    return initialFormData
  })


  const updateFormData = (data: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep === 1) {
      // Go back to previous page in browser history
      router.back()
    } else if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  // Validation for each step
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.fullName.trim() !== "" &&
          formData.email.trim() !== "" &&
          formData.phone.trim() !== ""
        )
      case 2:
        return !!formData.serviceId
      case 3:
        return !!formData.date && !!formData.time
      default:
        return false
    }
  }

  return (
    <div className="bg-white">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Step Indicator */}
        <StepIndicator steps={BOOKING_STEPS} currentStep={currentStep} />

        {/* Step Content */}
        <div className="mt-12">
          {currentStep === 1 && (
            <CustomerDetailsForm
              fullName={formData.fullName}
              email={formData.email}
              phone={formData.phone}
              onUpdate={updateFormData}
              onNext={nextStep}
              onBack={prevStep}
              canProceed={canProceed()}
            />
          )}

          {currentStep === 2 && (
            <SelectServiceStep
              services={services}
              selectedServiceId={formData.serviceId}
              onSelectService={(service) => {
                updateFormData({
                  serviceId: service.id,
                  service: service,
                })
              }}
              onNext={nextStep}
              canProceed={canProceed()}
            />
          )}

          {currentStep === 3 && (
            <BookingDateTimeStep
              selectedDate={formData.date}
              selectedTime={formData.time}
              selectedServiceId={formData.serviceId}
              onSelectDate={(date) => updateFormData({ date })}
              onSelectTime={(time) => updateFormData({ time })}
              onNext={nextStep}
              onBack={prevStep}
              canProceed={canProceed()}
            />
          )}

          {currentStep === 4 && (
            <BookingConfirmationStep
              formData={formData}
              onBack={prevStep}
            />
          )}
        </div>
      </div>
    </div>
  )
}