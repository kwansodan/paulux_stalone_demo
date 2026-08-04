"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { BookingFormData } from "./customer-booking-form"

type Props = {
  fullName: string
  email: string
  phone: string
  onUpdate: (data: Partial<BookingFormData>) => void
  onNext: () => void
  onBack: () => void
  canProceed: boolean
}

export default function CustomerDetailsForm({
  fullName,
  email,
  phone,
  onUpdate,
  onNext,
  onBack,
  canProceed,
}: Props) {
  const [errors, setErrors] = useState({
    email: "",
    phone: "",
  })

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return "Email is required"
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address"
    }
    return ""
  }

  const validatePhone = (phone: string) => {
    if (!phone.trim()) {
      return "Phone number is required"
    }
    
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, "")
    
    // Check if it's 10 digits (without country code) or 12 digits (with +233)
    if (digitsOnly.length === 10) {
      return "" // Valid 10 digits
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith("233")) {
      return "" // Valid with country code
    } else {
      return "Phone number must be 10 digits"
    }
  }

  const formatPhoneNumber = (input: string) => {
    // Remove all non-digit characters
    let digitsOnly = input.replace(/\D/g, "")
    
    // If starts with 0, replace with 233
    if (digitsOnly.startsWith("0")) {
      digitsOnly = "233" + digitsOnly.substring(1)
    }
    
    // If doesn't start with 233, add it
    if (!digitsOnly.startsWith("233") && digitsOnly.length > 0) {
      digitsOnly = "233" + digitsOnly
    }
    
    // Format as +233 XXXXXXXXX
    if (digitsOnly.length >= 3) {
      return `+${digitsOnly.substring(0, 3)} ${digitsOnly.substring(3)}`
    } else if (digitsOnly.length > 0) {
      return `+${digitsOnly}`
    }
    
    return ""
  }

  const handleEmailChange = (value: string) => {
    onUpdate({ email: value })
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }))
    }
  }

  const handleEmailBlur = () => {
    setErrors((prev) => ({ ...prev, email: validateEmail(email) }))
  }

  const handlePhoneChange = (value: string) => {
    // Allow user to type freely
    const formatted = formatPhoneNumber(value)
    onUpdate({ phone: formatted })
    
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: validatePhone(formatted) }))
    }
  }

  const handlePhoneBlur = () => {
    setErrors((prev) => ({ ...prev, phone: validatePhone(phone) }))
  }

  const handleContinue = () => {
    const emailError = validateEmail(email)
    const phoneError = validatePhone(phone)

    if (emailError || phoneError) {
      setErrors({
        email: emailError,
        phone: phoneError,
      })
      return
    }

    onNext()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Your details</h2>

      <div className="space-y-4">
        {/* Full name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium">
            Full name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Ama mensah"
            value={fullName}
            onChange={(e) => onUpdate({ fullName: e.target.value })}
            className="h-14 bg-gray-50 border-gray-200 rounded-xl"
          />
        </div>

        {/* Email address */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="ama@example.com"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={handleEmailBlur}
            className={`h-14 bg-gray-50 rounded-xl ${
              errors.email ? "border-red-500" : "border-gray-200"
            }`}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Phone number */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="0584943029"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onBlur={handlePhoneBlur}
            className={`h-14 bg-gray-50 rounded-xl ${
              errors.phone ? "border-red-500" : "border-gray-200"
            }`}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 h-14 rounded-full text-base font-medium border-gray-200"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!canProceed}
          className="flex-1 h-14 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-full text-base font-medium"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}