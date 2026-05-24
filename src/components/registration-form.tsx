"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useRegistrationStore } from "@/lib/store"
import { PersonalInfoStep } from "@/components/form-steps/personal-info"
import { ContactInfoStep } from "@/components/form-steps/contact-info"
import { ProfessionalInfoStep } from "@/components/form-steps/professional-info"
import { DocumentUploadStep } from "@/components/form-steps/document-upload"
import { AgreementSignatureStep } from "@/components/form-steps/agreement-signature"
import { ReviewSubmitStep } from "@/components/form-steps/review-submit"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import {
  ArrowLeft,
  User,
  Phone,
  Briefcase,
  FileUp,
  PenTool,
  Send,
  Check,
} from "lucide-react"
import { toast } from "sonner"

const stepConfig = [
  { label: "Personal", icon: User },
  { label: "Contact", icon: Phone },
  { label: "Professional", icon: Briefcase },
  { label: "Documents", icon: FileUp },
  { label: "Agreement", icon: PenTool },
  { label: "Review", icon: Send },
]

interface RegistrationFormProps {
  onBack?: () => void
}

export function RegistrationForm({ onBack }: RegistrationFormProps) {
  const { currentStep, data, setStep, nextStep, prevStep } =
    useRegistrationStore()

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Personal
        if (!data.firstName.trim()) {
          toast.error("First name is required")
          return false
        }
        if (!data.lastName.trim()) {
          toast.error("Last name is required")
          return false
        }
        if (!data.dateOfBirth) {
          toast.error("Date of birth is required")
          return false
        }
        if (!data.gender) {
          toast.error("Please select your gender")
          return false
        }
        if (!data.nationality) {
          toast.error("Please select your nationality")
          return false
        }
        if (!data.nidPassportNumber.trim()) {
          toast.error(`${data.nidPassportType} number is required`)
          return false
        }
        return true
      case 1: // Contact
        if (!data.email.trim()) {
          toast.error("Email address is required")
          return false
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          toast.error("Please enter a valid email address")
          return false
        }
        if (!data.phone.trim()) {
          toast.error("Phone number is required")
          return false
        }
        if (!data.address.trim()) {
          toast.error("Address is required")
          return false
        }
        if (!data.city.trim()) {
          toast.error("City is required")
          return false
        }
        if (!data.country) {
          toast.error("Please select your country")
          return false
        }
        return true
      case 2: // Professional
        if (!data.occupation.trim()) {
          toast.error("Occupation is required")
          return false
        }
        if (!data.experience) {
          toast.error("Experience level is required")
          return false
        }
        if (!data.department) {
          toast.error("Department of interest is required")
          return false
        }
        return true
      case 3: // Documents - optional but recommended
        return true
      case 4: // Agreement
        if (!data.agreeToPrivacy) {
          toast.error("You must agree to the Privacy Policy")
          return false
        }
        if (!data.agreeToTerms) {
          toast.error("You must agree to the Terms & Conditions")
          return false
        }
        if (!data.signatureData) {
          toast.error("Digital signature is required")
          return false
        }
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      nextStep()
    }
  }

  const stepComponents = [
    <PersonalInfoStep key="personal" />,
    <ContactInfoStep key="contact" />,
    <ProfessionalInfoStep key="professional" />,
    <DocumentUploadStep key="documents" />,
    <AgreementSignatureStep key="agreement" />,
    <ReviewSubmitStep key="review" />,
  ]

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="h-8 w-8 mr-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Image
              src="/logo.png"
              alt="FrameMaxx"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground">
                FrameMaxx
              </h1>
              <p className="text-[9px] text-muted-foreground tracking-widest uppercase leading-none">
                Registration
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {stepConfig.map((step, i) => (
              <button
                key={i}
                onClick={() => {
                  if (i < currentStep) setStep(i)
                }}
                className={`flex flex-col items-center gap-1.5 flex-1 group ${
                  i <= currentStep ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    i < currentStep
                      ? "bg-[var(--brand)] text-white"
                      : i === currentStep
                        ? "bg-[var(--brand)] text-white ring-4 ring-[var(--brand)]/20"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-medium transition-colors ${
                    i <= currentStep
                      ? "text-[var(--brand)]"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </button>
            ))}
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--brand)] rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${((currentStep + 1) / stepConfig.length) * 100}%`,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Step content */}
        <Card className="glass border-border/50 shadow-lg">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {stepComponents[currentStep]}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            {currentStep < 5 && (
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-[var(--brand)] hover:bg-[var(--brand-light)] text-white gap-2"
                >
                  {currentStep === 4 ? "Review Application" : "Continue"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-4 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} FrameMaxx Agency
          </p>
          <p className="text-xs text-muted-foreground">
            Step {currentStep + 1} of 6
          </p>
        </div>
      </footer>
    </div>
  )
}
