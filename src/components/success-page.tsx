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
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import { useState, useEffect, useRef, useCallback } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

export function SuccessPage() {
  const { trackingId, data, isSubmitted } = useRegistrationStore()
  const [pdfHtml, setPdfHtml] = useState<string | null>(null)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [downloading, setDownloading] = useState(false)
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
      toast.error("Failed to generate document")
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

  // Print using a new window for sharp text rendering
  const handlePrint = useCallback(() => {
    if (!pdfHtml) return
    const printWindow = window.open("", "_blank", "width=800,height=1000")
    if (!printWindow) {
      toast.error("Please allow popups to print the document")
      return
    }
    printWindow.document.write(pdfHtml)
    printWindow.document.close()
    // Wait for content to render, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }, [pdfHtml])

  // Download as crisp PDF using html2canvas at 4x + PNG lossless
  const handleDownloadPdf = useCallback(async () => {
    if (!pdfHtml) return

    setDownloading(true)
    toast.info("Generating PDF document...")

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas-pro"),
      ])

      // Create a hidden render container
      const container = document.createElement("div")
      container.style.position = "fixed"
      container.style.left = "-9999px"
      container.style.top = "0"
      container.style.width = "794px"
      container.style.background = "white"
      container.style.zIndex = "-1"
      document.body.appendChild(container)

      // Render HTML into it
      container.innerHTML = pdfHtml

      // Wait for all images to load
      const images = container.querySelectorAll("img")
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) resolve()
              else {
                img.onload = () => resolve()
                img.onerror = () => resolve()
              }
            })
        )
      )

      // Extra render time
      await new Promise((r) => setTimeout(r, 500))

      // Capture at 4x scale for super crisp text
      const canvas = await html2canvas(container, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 794,
        logging: false,
      })

      // Clean up render container
      document.body.removeChild(container)

      // A4 in mm
      const a4Width = 210
      const a4Height = 297

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      const imgWidth = a4Width
      const imgHeight = (canvasHeight * a4Width) / canvasWidth

      // Use PNG for lossless text quality
      const imgData = canvas.toDataURL("image/png")

      if (imgHeight <= a4Height) {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      } else {
        let heightLeft = imgHeight
        let position = 0
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= a4Height
        while (heightLeft > 0) {
          position -= a4Height
          pdf.addPage()
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
          heightLeft -= a4Height
        }
      }

      pdf.save(`FrameMaxx-Registration-${trackingId}.pdf`)
      toast.success("PDF downloaded successfully!")
    } catch (error) {
      console.error("PDF download error:", error)
      toast.error("Failed to generate PDF. Try using Print instead.")
    } finally {
      setDownloading(false)
    }
  }, [pdfHtml, trackingId])

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
                  onClick={handleDownloadPdf}
                  disabled={loadingPdf || !pdfHtml || downloading}
                  className="bg-[var(--brand)] hover:bg-[var(--brand-light)] text-white gap-2"
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {downloading ? "Generating PDF..." : "Download PDF"}
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

        {/* PDF Preview - A4 Paper Style */}
        {pdfHtml && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass border-border/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">
                    Document Preview
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      A4 Format &bull; 210 &times; 297 mm
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadPdf}
                      disabled={downloading}
                      className="gap-1.5 h-8 text-xs"
                    >
                      {downloading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      PDF
                    </Button>
                  </div>
                </div>
                {/* A4 Paper container */}
                <div className="bg-slate-200 dark:bg-slate-800 rounded-xl p-4 sm:p-8 overflow-auto">
                  <div className="mx-auto shadow-2xl" style={{ maxWidth: "794px" }}>
                    <iframe
                      ref={iframeRef}
                      srcDoc={pdfHtml}
                      className="w-full border-0 bg-white rounded-sm"
                      style={{ height: "1123px", maxWidth: "794px" }}
                      title="Registration Document"
                    />
                  </div>
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
