"use client"

import { useRegistrationStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import {
  CheckCircle2,
  Download,
  Printer,
  Copy,
  ArrowLeft,
  Loader2,
  Mail,
} from "lucide-react"
import { toast } from "sonner"
import { useState, useEffect, useRef } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

export function SuccessPage() {
  const { trackingId, data, isSubmitted } = useRegistrationStore()
  const [pdfHtml, setPdfHtml] = useState<string | null>(null)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [emailContent, setEmailContent] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (trackingId) {
      generatePdf()
      fetchConfirmation()
    }
  }, [trackingId])

  const generatePdf = async () => {
    setLoadingPdf(true)
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId }),
      })
      const result = await response.json()
      if (result.success) {
        setPdfHtml(result.html)
      }
    } catch (err) {
      toast.error("Failed to generate PDF")
    } finally {
      setLoadingPdf(false)
    }
  }

  const fetchConfirmation = async () => {
    try {
      const response = await fetch("/api/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          trackingId,
        }),
      })
      const result = await response.json()
      if (result.success) {
        setEmailContent(result.emailContent)
      }
    } catch {
      // Non-critical
    }
  }

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus()
      iframeRef.current.contentWindow.print()
    }
  }

  const handleDownload = () => {
    if (!pdfHtml) return

    const blob = new Blob([pdfHtml], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `FrameMaxx-Registration-${trackingId}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Document downloaded!")
  }

  const copyTrackingId = () => {
    if (trackingId) {
      navigator.clipboard.writeText(trackingId)
      toast.success("Tracking ID copied!")
    }
  }

  const handleNewRegistration = () => {
    useRegistrationStore.getState().reset()
  }

  if (!isSubmitted) return null

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
                Registration Complete
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Success card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass border-border/50 shadow-xl mb-8">
            <CardContent className="p-6 sm:p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </motion.div>

              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Registration Submitted!
              </h2>
              <p className="text-muted-foreground mb-6">
                Your application has been successfully submitted. Please save
                your tracking ID for future reference.
              </p>

              {/* Tracking ID */}
              <div className="inline-flex items-center gap-3 bg-[var(--brand)]/10 border border-[var(--brand)]/20 rounded-xl px-6 py-3 mb-6">
                <span className="text-sm text-muted-foreground">
                  Tracking ID:
                </span>
                <span className="text-lg font-bold text-[var(--brand)] tracking-wider">
                  {trackingId}
                </span>
                <button
                  onClick={copyTrackingId}
                  className="w-8 h-8 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center hover:bg-[var(--brand)]/20 transition-colors"
                >
                  <Copy className="h-4 w-4 text-[var(--brand)]" />
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleDownload}
                  disabled={loadingPdf || !pdfHtml}
                  className="bg-[var(--brand)] hover:bg-[var(--brand-light)] text-white gap-2"
                >
                  {loadingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download Document
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePrint}
                  disabled={!pdfHtml}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Email confirmation preview */}
        {emailContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card className="glass border-border/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="h-5 w-5 text-[var(--brand)]" />
                  <h3 className="font-semibold text-foreground">
                    Confirmation Email
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  A confirmation email has been sent to{" "}
                  <strong>{data.email}</strong>
                </p>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border text-sm text-foreground/80 whitespace-pre-line">
                  {emailContent}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* PDF Preview */}
        {pdfHtml && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass border-border/50 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  Document Preview
                </h3>
                <div className="border rounded-lg overflow-hidden bg-white shadow-inner">
                  <iframe
                    ref={iframeRef}
                    srcDoc={pdfHtml}
                    className="w-full border-0"
                    style={{ height: "800px" }}
                    title="Registration Document"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-4 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewRegistration}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            New Registration
          </Button>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} FrameMaxx Agency. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
