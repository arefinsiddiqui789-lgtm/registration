"use client"

import { useRegistrationStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import {
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
import { LOGO_BASE64 } from "@/lib/logo-base64"
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
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }, [pdfHtml])

  // Download as crisp vector PDF using jsPDF directly (no html2canvas!)
  const handleDownloadPdf = useCallback(async () => {
    if (!trackingId) return

    setDownloading(true)
    toast.info("Generating PDF document...")

    try {
      const { default: jsPDF } = await import("jspdf")

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // A4: 210 x 297 mm
      const pw = 210
      const ph = 297
      const m = 12 // margin
      const footerH = 12
      const maxContentY = ph - footerH - 2 // stop before footer

      // Colors
      const cDark = [10, 22, 40]
      const cSubDark = [19, 29, 53]
      const cText = [15, 23, 42]
      const cMuted = [100, 116, 139]
      const cGold = [212, 168, 67]
      const cBorder = [203, 213, 225]
      const cLightBg = [241, 245, 249]
      const cWhite = [255, 255, 255]

      // ── HEADER BAND ──────────────────────────────────────
      doc.setFillColor(...cDark)
      doc.rect(0, 0, pw, 28, "F")

      // Logo
      try {
        doc.addImage(LOGO_BASE64, "PNG", m, 4, 18, 18)
      } catch {
        doc.setFillColor(...cGold)
        doc.roundedRect(m, 4, 18, 18, 2, 2, "F")
        doc.setTextColor(...cDark)
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("FM", m + 9, 15, { align: "center" })
      }

      // Brand name
      doc.setTextColor(...cWhite)
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text("FrameMaxx", m + 22, 13)

      // Brand tagline
      doc.setTextColor(148, 163, 184)
      doc.setFontSize(6)
      doc.setFont("helvetica", "normal")
      doc.text("PROFESSIONAL AGENCY", m + 22, 18)

      // Document label (right side)
      doc.setTextColor(...cMuted)
      doc.setFontSize(6)
      doc.setFont("helvetica", "normal")
      doc.text("OFFICIAL DOCUMENT", pw - m, 10, { align: "right" })

      // Document title (right side)
      doc.setTextColor(...cWhite)
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("Registration Certificate", pw - m, 17, { align: "right" })

      // ── SUB HEADER ───────────────────────────────────────
      doc.setFillColor(...cSubDark)
      doc.rect(0, 28, pw, 13, "F")

      // Tracking ID chip background
      doc.setDrawColor(50, 65, 100)
      doc.setLineWidth(0.3)
      doc.setFillColor(30, 42, 70)
      doc.roundedRect(m, 30, 68, 8, 1.5, 1.5, "FD")

      // Tracking ID label
      doc.setTextColor(148, 163, 184)
      doc.setFontSize(5)
      doc.setFont("helvetica", "bold")
      doc.text("TRACKING ID", m + 4, 33.5)

      // Tracking ID value
      doc.setTextColor(226, 232, 240)
      doc.setFontSize(8)
      doc.setFont("courier", "bold")
      doc.text(trackingId, m + 4, 37)

      // ── HELPER FUNCTIONS ─────────────────────────────────
      let y = 44

      const drawSection = (title: string, letter: string, sy: number): number => {
        if (sy > maxContentY - 10) return sy // skip if too low
        // Icon box
        doc.setFillColor(...cDark)
        doc.roundedRect(m, sy, 5, 5, 1, 1, "F")
        doc.setTextColor(...cGold)
        doc.setFontSize(7)
        doc.setFont("helvetica", "bold")
        doc.text(letter, m + 2.5, sy + 3.5, { align: "center" })

        // Title
        doc.setTextColor(...cDark)
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text(title.toUpperCase(), m + 8, sy + 3.8)

        // Underline
        doc.setDrawColor(...cDark)
        doc.setLineWidth(0.6)
        doc.line(m, sy + 6, pw - m, sy + 6)

        return sy + 8
      }

      const fh = 9 // field row height
      const hw = (pw - 2 * m) / 2 // half width
      const contentW = pw - 2 * m - 5 // text max width in a cell
      const halfContentW = hw - 5 // text max width in half cell

      // Helper: truncate text to fit max width
      const truncText = (txt: string, maxW: number): string => {
        if (doc.getTextWidth(txt) <= maxW) return txt
        let t = txt
        while (doc.getTextWidth(t + "...") > maxW && t.length > 0) {
          t = t.slice(0, -1)
        }
        return t + "..."
      }

      const drawFieldRow = (
        label1: string,
        value1: string,
        label2: string,
        value2: string,
        fy: number,
        fullSpan = false
      ) => {
        if (fy > maxContentY - fh) return // skip if would overflow page
        const rowW = fullSpan ? pw - 2 * m : hw

        // Cell 1
        doc.setDrawColor(...cBorder)
        doc.setLineWidth(0.3)
        doc.rect(m, fy, rowW, fh)

        // Label 1
        doc.setTextColor(...cMuted)
        doc.setFontSize(5)
        doc.setFont("helvetica", "bold")
        doc.text(truncText(label1.toUpperCase(), rowW - 5), m + 2, fy + 3)

        // Value 1
        if (!value1) {
          doc.setTextColor(148, 163, 184)
          doc.setFont("helvetica", "italic")
        } else {
          doc.setTextColor(...cText)
          doc.setFont("helvetica", "bold")
        }
        doc.setFontSize(8)
        const dv1 = truncText(value1 || "Not specified", fullSpan ? contentW : halfContentW)
        doc.text(dv1, m + 2, fy + 7)

        if (!fullSpan) {
          // Cell 2
          doc.rect(m + hw, fy, hw, fh)

          // Label 2
          doc.setTextColor(...cMuted)
          doc.setFontSize(5)
          doc.setFont("helvetica", "bold")
          doc.text(truncText(label2.toUpperCase(), halfContentW), m + hw + 2, fy + 3)

          // Value 2
          if (!value2) {
            doc.setTextColor(148, 163, 184)
            doc.setFont("helvetica", "italic")
          } else {
            doc.setTextColor(...cText)
            doc.setFont("helvetica", "bold")
          }
          doc.setFontSize(8)
          const dv2 = truncText(value2 || "Not specified", halfContentW)
          doc.text(dv2, m + hw + 2, fy + 7)
        }
      }

      // ── PERSONAL INFORMATION ─────────────────────────────
      y = drawSection("Personal Information", "P", y)

      const formatDOB = (dob: string) => {
        if (!dob) return ""
        try {
          return new Date(dob + "T00:00:00").toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        } catch {
          return dob
        }
      }

      drawFieldRow(
        "Full Name",
        `${data.firstName} ${data.lastName}`,
        "Date of Birth",
        formatDOB(data.dateOfBirth),
        y
      )
      y += fh

      drawFieldRow(
        "Gender",
        data.gender,
        "Nationality",
        data.nationality,
        y
      )
      y += fh

      drawFieldRow(
        data.nidPassportType === "Passport" ? "Passport Number" : "National ID Number",
        data.nidPassportNumber,
        "ID Type",
        data.nidPassportType === "Passport" ? "Passport" : "National ID (NID)",
        y
      )
      y += fh + 3

      // ── CONTACT INFORMATION ──────────────────────────────
      y = drawSection("Contact Information", "C", y)

      drawFieldRow(
        "Email Address",
        data.email,
        "Phone Number",
        data.phone,
        y
      )
      y += fh

      const fullAddr = `${data.address || ""}${data.city ? ", " + data.city : ""}${data.state ? ", " + data.state : ""}${data.postalCode ? " " + data.postalCode : ""}${data.country ? ", " + data.country : ""}`
      drawFieldRow("Address", fullAddr, "", "", y, true)
      y += fh + 3

      // ── PROFESSIONAL INFORMATION ─────────────────────────
      y = drawSection("Professional Information", "W", y)

      drawFieldRow(
        "Occupation / Job Title",
        data.occupation,
        "Current Company",
        data.company,
        y
      )
      y += fh

      drawFieldRow(
        "Experience Level",
        data.experience,
        "Department of Interest",
        data.department,
        y
      )
      y += fh

      drawFieldRow("Skills & Expertise", data.skills, "", "", y, true)
      y += fh + 4

      // ── SIGNATURE SECTION ────────────────────────────────
      if (y < maxContentY - 30) {
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.5)
        doc.line(m, y, pw - m, y)
        y += 2

        doc.setTextColor(...cMuted)
        doc.setFontSize(5)
        doc.setFont("helvetica", "bold")
        doc.text("APPLICANT DECLARATION & SIGNATURE", m, y + 2.5)
        y += 5

        // Signature line
        doc.setDrawColor(...cDark)
        doc.setLineWidth(0.3)
        doc.line(m, y + 12, m + 50, y + 12)

        // Add signature image
        const sigData = data.signatureData
        if (sigData && sigData.startsWith("data:")) {
          try {
            doc.addImage(sigData, "PNG", m + 4, y - 1, 40, 13)
          } catch {
            // Skip signature image if it fails
          }
        }

        // Name under line
        doc.setTextColor(...cText)
        doc.setFontSize(7)
        doc.setFont("helvetica", "bold")
        doc.text(`${data.firstName} ${data.lastName}`, m, y + 16)

        doc.setTextColor(...cMuted)
        doc.setFontSize(5)
        doc.setFont("helvetica", "normal")
        doc.text("Applicant Signature", m, y + 19)

        // Date on right side
        const now = new Date()
        const dateStr = now.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
        const timeStr = now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })

        doc.setTextColor(...cText)
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.text(dateStr, pw - m, y + 2.5, { align: "right" })
        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(71, 85, 105)
        doc.text(timeStr, pw - m, y + 7, { align: "right" })
        doc.setTextColor(...cMuted)
        doc.setFontSize(5)
        doc.text("Date & Time of Submission", pw - m, y + 10, { align: "right" })

        y += 22
      }

      // ── DISCLAIMER ───────────────────────────────────────
      if (y < maxContentY - 12) {
        const disclaimerH = 12
        doc.setFillColor(...cLightBg)
        doc.rect(m, y, pw - 2 * m, disclaimerH, "F")
        doc.setFillColor(...cDark)
        doc.rect(m, y, 1, disclaimerH, "F")

        doc.setTextColor(...cMuted)
        doc.setFontSize(5.5)
        doc.setFont("helvetica", "normal")
        const disclaimer =
          "Confidential: This document is auto-generated by the FrameMaxx Registration Portal and contains confidential information. The digital signature above confirms the applicant's agreement to the Privacy Policy and Terms & Conditions. Unauthorized reproduction or distribution is prohibited. For verification, reference tracking ID " +
          trackingId +
          "."
        doc.text(disclaimer, m + 3, y + 3.5, {
          maxWidth: pw - 2 * m - 6,
        })
      }

      // ── FOOTER BAND ──────────────────────────────────────
      const footerY = ph - footerH
      doc.setFillColor(...cDark)
      doc.rect(0, footerY, pw, footerH, "F")

      const now2 = new Date()
      const dateStr2 = now2.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      const timeStr2 = now2.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })

      // Left side
      doc.setTextColor(148, 163, 184)
      doc.setFontSize(5.5)
      doc.setFont("helvetica", "bold")
      doc.text("FrameMaxx", m, footerY + 4.5)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...cMuted)
      doc.text("  \u2014  Official Registration Document", m + 14, footerY + 4.5)

      // Tracking ID badge
      doc.setDrawColor(40, 55, 85)
      doc.setFillColor(22, 38, 62)
      doc.setLineWidth(0.2)
      doc.roundedRect(m + 65, footerY + 2, 30, 4.5, 1, 1, "FD")
      doc.setTextColor(148, 163, 184)
      doc.setFont("courier", "bold")
      doc.setFontSize(5)
      doc.text(trackingId, m + 67, footerY + 5)

      // Right side
      doc.setTextColor(71, 85, 105)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(5)
      doc.text(
        `Generated ${dateStr2} at ${timeStr2}  \u2022  Page 1 of 1`,
        pw - m,
        footerY + 4.5,
        { align: "right" }
      )

      // Save the PDF
      doc.save(`FrameMaxx-Registration-${trackingId}.pdf`)
      toast.success("PDF downloaded successfully!")
    } catch (error) {
      console.error("PDF download error:", error)
      toast.error("Failed to generate PDF. Try using Print instead.")
    } finally {
      setDownloading(false)
    }
  }, [trackingId, data])

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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#fef3c7" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-amber-200/50" style={{ backgroundColor: "#fde68a" }}>
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
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Success card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-amber-200/60 shadow-xl mb-8" style={{ backgroundColor: "#f5e6b8" }}>
            <CardContent className="p-6 sm:p-8 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.3,
                  type: "spring",
                  stiffness: 180,
                  damping: 12,
                  mass: 0.8,
                }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 relative"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.3, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full bg-green-400/20"
                />
                <motion.div
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
                >
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" className="text-green-600" opacity="0.3" />
                    <motion.path
                      d="M12 20.5L17.5 26L28 15"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-green-600"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.6, duration: 0.45, ease: "easeOut" }}
                    />
                  </svg>
                </motion.div>
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
                  disabled={loadingPdf || !trackingId || downloading}
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
            <Card className="border-amber-200/60 shadow-lg" style={{ backgroundColor: "#f5e6b8" }}>
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
                <div className="bg-white/70 rounded-lg p-4 border border-amber-200/50 text-sm text-foreground/80 whitespace-pre-line">
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
            <Card className="border-amber-200/60 shadow-lg" style={{ backgroundColor: "#f5e6b8" }}>
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
                <div className="bg-amber-100/60 rounded-xl p-4 sm:p-8 overflow-auto">
                  <div className="mx-auto shadow-2xl" style={{ maxWidth: "794px" }}>
                    <iframe
                      ref={iframeRef}
                      srcDoc={pdfHtml}
                      className="w-full border-0 bg-white rounded-sm"
                      style={{ minHeight: "1123px", maxWidth: "794px", height: "1200px" }}
                      title="Registration Document"
                      onLoad={() => {
                        // Auto-size iframe to content height
                        const iframe = iframeRef.current
                        if (iframe && iframe.contentDocument) {
                          const contentHeight = iframe.contentDocument.documentElement.scrollHeight
                          if (contentHeight > 0) {
                            iframe.style.height = contentHeight + "px"
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-amber-200/50 py-4 mt-auto" style={{ backgroundColor: "#fde68a" }}>
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
