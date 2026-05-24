"use client"

import { useRegistrationStore } from "@/lib/store"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import { PenTool, RotateCcw, Check } from "lucide-react"
import dynamic from "next/dynamic"
import { useRef, useState, useCallback } from "react"

const SignatureCanvas = dynamic(
  () => import("react-signature-canvas"),
  { ssr: false }
)

function PrivacyPolicyDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-[var(--brand)] underline underline-offset-2 hover:text-[var(--brand-light)] font-medium">
          Privacy Policy
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          <div className="text-sm text-muted-foreground space-y-4 pr-4">
            <p>
              <strong>FrameMaxx Agency</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to
              protecting your privacy. This Privacy Policy explains how we
              collect, use, and safeguard your personal information.
            </p>
            <h4 className="font-semibold text-foreground">Information We Collect</h4>
            <p>
              We collect personal information that you provide during the
              registration process, including but not limited to: name, email
              address, phone number, date of birth, nationality, identification
              documents, professional information, and digital signature.
            </p>
            <h4 className="font-semibold text-foreground">How We Use Your Information</h4>
            <p>
              Your information is used to process your registration application,
              verify your identity, communicate with you about your application
              status, and maintain our records. We do not sell or share your
              personal information with third parties without your consent.
            </p>
            <h4 className="font-semibold text-foreground">Data Security</h4>
            <p>
              We implement industry-standard security measures to protect your
              data. All information is encrypted during transmission and stored
              securely. Access to your personal information is restricted to
              authorized personnel only.
            </p>
            <h4 className="font-semibold text-foreground">Data Retention</h4>
            <p>
              We retain your personal information for as long as necessary to
              fulfill the purposes outlined in this policy, unless a longer
              retention period is required by law.
            </p>
            <h4 className="font-semibold text-foreground">Your Rights</h4>
            <p>
              You have the right to access, correct, or delete your personal
              information. To exercise these rights, please contact us through
              our official channels.
            </p>
            <h4 className="font-semibold text-foreground">Contact Us</h4>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at privacy@framemaxx.com.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function TermsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-[var(--brand)] underline underline-offset-2 hover:text-[var(--brand-light)] font-medium">
          Terms & Conditions
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Terms & Conditions</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          <div className="text-sm text-muted-foreground space-y-4 pr-4">
            <p>
              By registering with <strong>FrameMaxx Agency</strong>, you agree to
              the following terms and conditions:
            </p>
            <h4 className="font-semibold text-foreground">1. Registration</h4>
            <p>
              You agree to provide accurate and complete information during the
              registration process. Any false or misleading information may
              result in rejection of your application.
            </p>
            <h4 className="font-semibold text-foreground">2. Use of Information</h4>
            <p>
              The information you provide will be used solely for the purpose of
              processing your registration and evaluating your application for
              collaboration with FrameMaxx Agency.
            </p>
            <h4 className="font-semibold text-foreground">3. Document Verification</h4>
            <p>
              FrameMaxx reserves the right to verify all submitted documents.
              Submission of forged or falsified documents will result in
              immediate rejection and may be reported to relevant authorities.
            </p>
            <h4 className="font-semibold text-foreground">4. Digital Signature</h4>
            <p>
              By providing your digital signature, you confirm that all
              information submitted is truthful and that you agree to these
              terms. Your digital signature holds the same legal validity as a
              handwritten signature.
            </p>
            <h4 className="font-semibold text-foreground">5. Application Status</h4>
            <p>
              FrameMaxx will review your application within 3-5 business days.
              You will be notified of the outcome via email. The decision of
              FrameMaxx is final.
            </p>
            <h4 className="font-semibold text-foreground">6. Confidentiality</h4>
            <p>
              Both parties agree to maintain the confidentiality of any
              proprietary or sensitive information shared during the
              registration and onboarding process.
            </p>
            <h4 className="font-semibold text-foreground">7. Amendments</h4>
            <p>
              FrameMaxx reserves the right to amend these terms at any time.
              Continued use of the portal constitutes acceptance of any changes.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export function AgreementSignatureStep() {
  const { data, updateData } = useRegistrationStore()
  const sigCanvasRef = useRef<any>(null)
  const [sigEmpty, setSigEmpty] = useState(!data.signatureData)

  const clearSignature = useCallback(() => {
    sigCanvasRef.current?.clear()
    updateData({ signatureData: "" })
    setSigEmpty(true)
  }, [updateData])

  const saveSignature = useCallback(() => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      const dataUrl = sigCanvasRef.current.toDataURL("image/png")
      updateData({ signatureData: dataUrl })
      setSigEmpty(false)
    }
  }, [updateData])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[var(--brand)]/10 rounded-lg flex items-center justify-center">
          <PenTool className="h-5 w-5 text-[var(--brand)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Agreement & Signature
          </h3>
          <p className="text-sm text-muted-foreground">
            Review the policies and provide your digital signature
          </p>
        </div>
      </div>

      {/* Agreement checkboxes */}
      <div className="space-y-4 mb-8">
        <div className="flex items-start gap-3 p-4 rounded-xl border bg-muted/20">
          <Checkbox
            id="privacy"
            checked={data.agreeToPrivacy}
            onCheckedChange={(checked) =>
              updateData({ agreeToPrivacy: checked === true })
            }
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label htmlFor="privacy" className="text-sm font-medium cursor-pointer">
              I have read and agree to the{" "}
              <PrivacyPolicyDialog />
            </Label>
            <p className="text-xs text-muted-foreground">
              Your personal data will be processed in accordance with our privacy policy.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl border bg-muted/20">
          <Checkbox
            id="terms"
            checked={data.agreeToTerms}
            onCheckedChange={(checked) =>
              updateData({ agreeToTerms: checked === true })
            }
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label htmlFor="terms" className="text-sm font-medium cursor-pointer">
              I agree to the{" "}
              <TermsDialog />
            </Label>
            <p className="text-xs text-muted-foreground">
              You confirm that all information provided is accurate and truthful.
            </p>
          </div>
        </div>
      </div>

      {/* Digital Signature */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Digital Signature <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Draw your signature in the box below using your mouse or finger
        </p>
        <div className="border-2 border-dashed rounded-xl overflow-hidden bg-white dark:bg-slate-800/50">
          <SignatureCanvas
            ref={sigCanvasRef}
            canvasProps={{
              className:
                "signature-canvas w-full",
              style: { width: "100%", height: "180px" },
            }}
            onEnd={saveSignature}
          />
        </div>
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={clearSignature}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear Signature
          </Button>
          {data.signatureData && (
            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <Check className="h-3.5 w-3.5" />
              Signature captured
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
