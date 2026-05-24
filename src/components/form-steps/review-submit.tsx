"use client"

import { useRegistrationStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Send, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

export function ReviewSubmitStep() {
  const { data, setSubmitting, setTrackingId, setSubmitted, isSubmitting } =
    useRegistrationStore()
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    // Validate
    if (!data.firstName || !data.lastName || !data.email || !data.phone) {
      setError("Please complete all required fields in previous steps.")
      toast.error("Missing required fields")
      return
    }
    if (!data.agreeToTerms || !data.agreeToPrivacy) {
      setError("You must agree to the Privacy Policy and Terms & Conditions.")
      toast.error("Agreement required")
      return
    }
    if (!data.signatureData) {
      setError("Digital signature is required.")
      toast.error("Signature required")
      return
    }

    setError("")
    setSubmitting(true)

    try {
      // Convert files to base64
      const fileToBase64 = (file: File | null): Promise<string> => {
        if (!file) return Promise.resolve("")
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
      }

      const photoBase64 = await fileToBase64(data.photoFile)
      const cvBase64 = await fileToBase64(data.cvFile)
      const nidPassportBase64 = await fileToBase64(data.nidPassportFile)

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          nationality: data.nationality,
          nidPassportType: data.nidPassportType,
          nidPassportNumber: data.nidPassportNumber,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          occupation: data.occupation,
          company: data.company,
          experience: data.experience,
          skills: data.skills,
          department: data.department,
          signatureData: data.signatureData,
          agreeToTerms: data.agreeToTerms,
          agreeToPrivacy: data.agreeToPrivacy,
          photoBase64,
          cvBase64,
          nidPassportBase64,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setTrackingId(result.trackingId)

        // Send confirmation email in background
        fetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            trackingId: result.trackingId,
          }),
        }).catch(() => {
          // Non-critical, don't block
        })

        setSubmitted(true)
        toast.success("Registration submitted successfully!")
      } else {
        setError(result.error || "Something went wrong. Please try again.")
        toast.error(result.error || "Submission failed")
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.")
      toast.error("Network error")
    } finally {
      setSubmitting(false)
    }
  }

  const InfoRow = ({
    label,
    value,
  }: {
    label: string
    value: string | undefined
  }) => (
    <div className="flex justify-between items-start py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[60%]">
        {value || "—"}
      </span>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[var(--brand)]/10 rounded-lg flex items-center justify-center">
          <Send className="h-5 w-5 text-[var(--brand)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Review & Submit
          </h3>
          <p className="text-sm text-muted-foreground">
            Please review your information before submitting
          </p>
        </div>
      </div>

      {/* Review sections */}
      <div className="space-y-6">
        {/* Personal */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="text-xs">
              Personal
            </Badge>
          </div>
          <div className="bg-muted/30 rounded-xl p-4 space-y-0.5">
            <InfoRow label="Full Name" value={`${data.firstName} ${data.lastName}`} />
            <InfoRow label="Date of Birth" value={data.dateOfBirth} />
            <InfoRow label="Gender" value={data.gender} />
            <InfoRow label="Nationality" value={data.nationality} />
            <InfoRow
              label={`${data.nidPassportType} Number`}
              value={data.nidPassportNumber}
            />
          </div>
        </div>

        {/* Contact */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="text-xs">
              Contact
            </Badge>
          </div>
          <div className="bg-muted/30 rounded-xl p-4 space-y-0.5">
            <InfoRow label="Email" value={data.email} />
            <InfoRow label="Phone" value={data.phone} />
            <InfoRow
              label="Address"
              value={`${data.address}, ${data.city}, ${data.state} ${data.postalCode}, ${data.country}`}
            />
          </div>
        </div>

        {/* Professional */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="text-xs">
              Professional
            </Badge>
          </div>
          <div className="bg-muted/30 rounded-xl p-4 space-y-0.5">
            <InfoRow label="Occupation" value={data.occupation} />
            <InfoRow label="Company" value={data.company} />
            <InfoRow label="Experience" value={data.experience} />
            <InfoRow label="Department" value={data.department} />
            <InfoRow label="Skills" value={data.skills} />
          </div>
        </div>

        {/* Documents */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="text-xs">
              Documents
            </Badge>
          </div>
          <div className="bg-muted/30 rounded-xl p-4 space-y-0.5">
            <InfoRow
              label="Profile Photo"
              value={data.photoFile ? data.photoFile.name : "Not uploaded"}
            />
            <InfoRow
              label="CV/Resume"
              value={data.cvFile ? data.cvFile.name : "Not uploaded"}
            />
            <InfoRow
              label={`${data.nidPassportType} Copy`}
              value={data.nidPassportFile ? data.nidPassportFile.name : "Not uploaded"}
            />
          </div>
        </div>

        {/* Signature */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="text-xs">
              Signature
            </Badge>
          </div>
          <div className="bg-muted/30 rounded-xl p-4">
            {data.signatureData ? (
              <div className="flex items-center gap-4">
                <div className="w-48 h-16 bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
                  <img
                    src={data.signatureData}
                    alt="Your signature"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs text-green-600 dark:text-green-400">
                  ✓ Signature verified
                </span>
              </div>
            ) : (
              <p className="text-sm text-destructive">No signature provided</p>
            )}
          </div>
        </div>

        {/* Agreements */}
        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm">
            {data.agreeToPrivacy ? (
              <span className="text-green-600 dark:text-green-400">✓</span>
            ) : (
              <span className="text-destructive">✗</span>
            )}
            Privacy Policy{" "}
            {data.agreeToPrivacy ? "accepted" : "not accepted"}
          </div>
          <div className="flex items-center gap-2 text-sm mt-1">
            {data.agreeToTerms ? (
              <span className="text-green-600 dark:text-green-400">✓</span>
            ) : (
              <span className="text-destructive">✗</span>
            )}
            Terms & Conditions{" "}
            {data.agreeToTerms ? "accepted" : "not accepted"}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Submit button */}
      <div className="mt-8 pt-6 border-t">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-[var(--brand)] hover:bg-[var(--brand-light)] text-white font-semibold h-12 text-base gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Submitting Application...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Submit Registration
            </>
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-3">
          By clicking submit, you confirm that all information provided is
          accurate and truthful.
        </p>
      </div>
    </motion.div>
  )
}
