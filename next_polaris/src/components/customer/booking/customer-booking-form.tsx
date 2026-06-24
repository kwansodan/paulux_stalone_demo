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
import { SerializedPackage } from "@/features/package/types"

export type BookingFormData = {
  // Step 1: Details
  fullName: string
  email: string
  phone: string

  minDepositFixed?: number

  // Step 2: Service (individual) or Package
  serviceIds: string[]
  selectedServices: SerializedService[]
  selectedPackage: SerializedPackage | null

  // Step 3: Date & Time
  date: string | null
  time: string | null
}

const initialFormData: BookingFormData = {
  serviceIds: [],
  selectedServices: [],
  selectedPackage: null,
  date: null,
  time: null,
  fullName: "",
  email: "",
  phone: "",
}

export default function CustomerBookingForm({
  services,
  packages,
  preSelectedServiceId,
  preSelectedPackageId,
  globalMinDeposit,
}: {
  services: SerializedService[]
  packages: SerializedPackage[]
  preSelectedServiceId: string | null
  preSelectedPackageId: string | null
  globalMinDeposit: number | null
}) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)

  const [formData, setFormData] = useState<BookingFormData>(() => {
    if (preSelectedPackageId) {
      const pkg = packages.find((p) => p.id === preSelectedPackageId)
      if (pkg) {
        return {
          ...initialFormData,
          selectedPackage: pkg,
          serviceIds: pkg.services.map((ps) => ps.serviceId),
          selectedServices: pkg.services.map((ps) => ps.service),
        }
      }
    }
    if (preSelectedServiceId) {
      const preSelectedService = services.find((s) => s.id === preSelectedServiceId)
      if (preSelectedService) {
        return {
          ...initialFormData,
          serviceIds: [preSelectedServiceId],
          selectedServices: [preSelectedService],
        }
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
        return formData.serviceIds.length > 0
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
              packages={packages}
              selectedServiceIds={formData.serviceIds}
              selectedPackage={formData.selectedPackage}
              onSelectPackage={(pkg) => {
                if (pkg === null) {
                  updateFormData({ selectedPackage: null, serviceIds: [], selectedServices: [] })
                } else {
                  updateFormData({
                    selectedPackage: pkg,
                    serviceIds: pkg.services.map((ps) => ps.serviceId),
                    selectedServices: pkg.services.map((ps) => ps.service),
                  })
                }
              }}
              onSelectService={(service) => {
                // Selecting an individual service clears any selected package
                const isSelected = formData.serviceIds.includes(service.id)
                let newServiceIds: string[]
                let newSelectedServices: SerializedService[]

                if (isSelected) {
                  newServiceIds = formData.serviceIds.filter((id) => id !== service.id)
                  newSelectedServices = formData.selectedServices.filter((s) => s.id !== service.id)
                } else {
                  newServiceIds = [...formData.serviceIds, service.id]
                  newSelectedServices = [...formData.selectedServices, service]
                }

                updateFormData({
                  selectedPackage: null,
                  serviceIds: newServiceIds,
                  selectedServices: newSelectedServices,
                })
              }}
              onNext={nextStep}
              onBack={prevStep}
              canProceed={canProceed()}
            />
          )}

          {currentStep === 3 && (
            <BookingDateTimeStep
              selectedDate={formData.date}
              selectedTime={formData.time}
              selectedServiceIds={formData.serviceIds}
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
              globalMinDeposit={globalMinDeposit}
            />
          )}
        </div>
      </div>
    </div>
  )
}