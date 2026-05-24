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
import { LOGO_BASE64 } from "@/lib/logo-base64"
import Image from "next/image"

export function SuccessPage() {
  const { trackingId, data, isSubmitted } = useRegistrationStore()
  const [pdfHtml, setPdfHtml] = useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
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
        if (result.qrCode) {
          setQrCodeDataUrl(result.qrCode)
        }
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
      const m = 14 // margin

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
      doc.rect(0, 0, pw, 34, "F")

      // Logo
      try {
        doc.addImage(LOGO_BASE64, "PNG", m, 5, 22, 22)
      } catch {
        // Fallback: draw placeholder
        doc.setFillColor(...cGold)
        doc.roundedRect(m, 5, 22, 22, 3, 3, "F")
        doc.setTextColor(...cDark)
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("FM", m + 11, 18, { align: "center" })
      }

      // Brand name
      doc.setTextColor(...cWhite)
      doc.setFontSize(22)
      doc.setFont("helvetica", "bold")
      doc.text("FrameMaxx", m + 28, 15)

      // Brand tagline
      doc.setTextColor(148, 163, 184)
      doc.setFontSize(7)
      doc.setFont("helvetica", "normal")
      doc.text("PROFESSIONAL AGENCY", m + 28, 20)

      // Document label (right side)
      doc.setTextColor(...cMuted)
      doc.setFontSize(7)
      doc.setFont("helvetica", "normal")
      doc.text("OFFICIAL DOCUMENT", pw - m, 12, { align: "right" })

      // Document title (right side)
      doc.setTextColor(...cWhite)
      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.text("Registration Certificate", pw - m, 20, { align: "right" })

      // ── SUB HEADER ───────────────────────────────────────
      doc.setFillColor(...cSubDark)
      doc.rect(0, 34, pw, 16, "F")

      // Tracking ID chip background (simulated transparency with solid colors)
      doc.setDrawColor(50, 65, 100)
      doc.setLineWidth(0.3)
      doc.setFillColor(30, 42, 70)
      doc.roundedRect(m, 37, 72, 10, 1.5, 1.5, "FD")

      // Tracking ID label
      doc.setTextColor(148, 163, 184)
      doc.setFontSize(6)
      doc.setFont("helvetica", "bold")
      doc.text("TRACKING ID", m + 5, 41.5)

      // Tracking ID value
      doc.setTextColor(226, 232, 240)
      doc.setFontSize(9)
      doc.setFont("courier", "bold")
      doc.text(trackingId, m + 5, 45.5)

      // QR Code
      if (qrCodeDataUrl) {
        try {
          doc.addImage(qrCodeDataUrl, "PNG", pw - m - 13, 36, 12, 12)
        } catch {
          // Skip QR if image fails
        }
        doc.setTextColor(...cMuted)
        doc.setFontSize(5)
        doc.setFont("helvetica", "normal")
        doc.text("Scan to verify", pw - m - 13, 50)
      }

      // ── HELPER FUNCTIONS ─────────────────────────────────
      let y = 54

      const drawSection = (title: string, letter: string, sy: number): number => {
        // Icon box
        doc.setFillColor(...cDark)
        doc.roundedRect(m, sy, 6, 6, 1, 1, "F")
        doc.setTextColor(...cGold)
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.text(letter, m + 3, sy + 4.2, { align: "center" })

        // Title
        doc.setTextColor(...cDark)
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text(title.toUpperCase(), m + 9, sy + 4.5)

        // Underline
        doc.setDrawColor(...cDark)
        doc.setLineWidth(0.8)
        doc.line(m, sy + 7, pw - m, sy + 7)

        return sy + 10
      }

      const fh = 11 // field row height
      const hw = (pw - 2 * m) / 2 // half width

      // Detect if a string is a linkable value and return its URL
      const getLinkUrl = (val: string): string | null => {
        if (!val) return null
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const phoneRegex = /^[+]?[\d\s()-]{7,20}$/
        const urlRegex = /^https?:\/\/.+/i
        if (emailRegex.test(val)) return `mailto:${val}`
        if (phoneRegex.test(val)) return `tel:${val.replace(/[\s()-]/g, "")}`
        if (urlRegex.test(val)) return val
        return null
      }

      // Draw value text and add hyperlink if applicable
      const drawValueWithLink = (
        text: string,
        x: number,
        yPos: number,
        maxW: number,
        isLinkable: boolean
      ) => {
        const isLink = isLinkable && !!getLinkUrl(text)
        if (isLink) {
          // Blue color for hyperlinks
          doc.setTextColor(14, 95, 196)
          doc.setFont("helvetica", "bold")
        }
        doc.setFontSize(9)
        let dv = text || "Not specified"
        if (doc.getTextWidth(dv) > maxW) {
          while (doc.getTextWidth(dv + "...") > maxW && dv.length > 0) {
            dv = dv.slice(0, -1)
          }
          dv += "..."
        }
        doc.text(dv, x, yPos)

        // Add clickable link area + underline for links
        if (isLink && text) {
          const tw = doc.getTextWidth(dv)
          // Underline
          doc.setDrawColor(14, 95, 196)
          doc.setLineWidth(0.2)
          doc.line(x, yPos + 0.5, x + tw, yPos + 0.5)
          // Clickable area
          const linkUrl = getLinkUrl(text)
          if (linkUrl) {
            doc.link(x, yPos - 3, tw, 4, { url: linkUrl })
          }
        }
      }

      const drawFieldRow = (
        label1: string,
        value1: string,
        label2: string,
        value2: string,
        fy: number,
        fullSpan = false
      ) => {
        const rowW = fullSpan ? pw - 2 * m : hw

        // Cell 1
        doc.setDrawColor(...cBorder)
        doc.setLineWidth(0.3)
        doc.rect(m, fy, rowW, fh)

        // Label 1
        doc.setTextColor(...cMuted)
        doc.setFontSize(6)
        doc.setFont("helvetica", "bold")
        doc.text(label1.toUpperCase(), m + 2.5, fy + 3.5)

        // Value 1
        if (!value1) {
          doc.setTextColor(148, 163, 184)
          doc.setFont("helvetica", "italic")
        }
        drawValueWithLink(value1, m + 2.5, fy + 8, rowW - 5, true)

        if (!fullSpan) {
          // Cell 2
          doc.rect(m + hw, fy, hw, fh)

          // Label 2
          doc.setTextColor(...cMuted)
          doc.setFontSize(6)
          doc.setFont("helvetica", "bold")
          doc.text(label2.toUpperCase(), m + hw + 2.5, fy + 3.5)

          // Value 2
          if (!value2) {
            doc.setTextColor(148, 163, 184)
            doc.setFont("helvetica", "italic")
          }
          drawValueWithLink(value2, m + hw + 2.5, fy + 8, hw - 5, true)
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
      y += fh + 4

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
      y += fh + 4

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
      y += fh + 5

      // ── SIGNATURE SECTION ────────────────────────────────
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.6)
      doc.line(m, y, pw - m, y)
      y += 3

      doc.setTextColor(...cMuted)
      doc.setFontSize(6)
      doc.setFont("helvetica", "bold")
      doc.text("APPLICANT DECLARATION & SIGNATURE", m, y + 3)
      y += 7

      // Signature line
      doc.setDrawColor(...cDark)
      doc.setLineWidth(0.3)
      doc.line(m, y + 15, m + 55, y + 15)

      // Add signature image
      const sigData = data.signatureData
      if (sigData && sigData.startsWith("data:")) {
        try {
          doc.addImage(sigData, "PNG", m + 5, y - 2, 45, 16)
        } catch {
          // Skip signature image if it fails
        }
      }

      // Name under line
      doc.setTextColor(...cText)
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.text(`${data.firstName} ${data.lastName}`, m, y + 19)

      doc.setTextColor(...cMuted)
      doc.setFontSize(6)
      doc.setFont("helvetica", "normal")
      doc.text("Applicant Signature", m, y + 23)

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
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.text(dateStr, pw - m, y + 3, { align: "right" })
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(71, 85, 105)
      doc.text(timeStr, pw - m, y + 8, { align: "right" })
      doc.setTextColor(...cMuted)
      doc.setFontSize(6)
      doc.text("Date & Time of Submission", pw - m, y + 12, { align: "right" })

      y += 27

      // ── DISCLAIMER ───────────────────────────────────────
      doc.setFillColor(...cLightBg)
      doc.rect(m, y, pw - 2 * m, 15, "F")
      doc.setFillColor(...cDark)
      doc.rect(m, y, 1.2, 15, "F")

      doc.setTextColor(...cMuted)
      doc.setFontSize(6.5)
      doc.setFont("helvetica", "normal")

      // Disclaimer with clickable email hyperlink
      const disclaimerPart1 = "Confidential: This document is auto-generated by the FrameMaxx Registration Portal and contains confidential information. The digital signature above confirms the applicant's agreement to the Privacy Policy and Terms & Conditions. Unauthorized reproduction or distribution is prohibited. For verification, scan the QR code or contact "
      const disclaimerEmail = "support@framemaxx.com"
      const disclaimerPart2 = " with tracking ID " + trackingId + "."

      // Draw disclaimer text line by line to handle wrapping + embed link
      const disclaimX = m + 4
      const disclaimMaxW = pw - 2 * m - 8
      doc.text(disclaimerPart1, disclaimX, y + 4, { maxWidth: disclaimMaxW })

      // Calculate where the email should go - use splitTextToSize to find the last line position
      const part1Lines = doc.splitTextToSize(disclaimerPart1, disclaimMaxW)
      const lastLineY = y + 4 + (part1Lines.length - 1) * 3.2
      const lastLineText = part1Lines[part1Lines.length - 1]
      const lastLineW = doc.getTextWidth(lastLineText)

      // Check if email fits on the same line
      const emailW = doc.getTextWidth(disclaimerEmail)
      const remainingW = disclaimMaxW - lastLineW

      let emailX: number
      let emailY: number

      if (emailW + doc.getTextWidth(disclaimerPart2) <= remainingW) {
        // Email on same line
        emailX = disclaimX + lastLineW
        emailY = lastLineY
      } else if (emailW <= remainingW) {
        // Email on same line, part2 wraps
        emailX = disclaimX + lastLineW
        emailY = lastLineY
      } else {
        // Email on new line
        emailX = disclaimX
        emailY = lastLineY + 3.2
      }

      // Draw email as hyperlink
      doc.setTextColor(14, 95, 196)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(6.5)
      doc.text(disclaimerEmail, emailX, emailY)
      doc.setDrawColor(14, 95, 196)
      doc.setLineWidth(0.15)
      doc.line(emailX, emailY + 0.4, emailX + emailW, emailY + 0.4)
      doc.link(emailX, emailY - 2.5, emailW, 3.5, { url: "mailto:support@framemaxx.com" })

      // Draw part2 after email
      doc.setTextColor(...cMuted)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(6.5)
      const afterEmailX = emailX + emailW
      const part2FirstLineW = disclaimMaxW - (afterEmailX - disclaimX)
      if (part2FirstLineW > doc.getTextWidth(disclaimerPart2) && afterEmailX > disclaimX) {
        // Part2 fits on same line as email
        doc.text(disclaimerPart2, afterEmailX, emailY)
      } else {
        // Part2 on new line(s)
        const part2Lines = doc.splitTextToSize(disclaimerPart2, disclaimMaxW)
        doc.text(part2Lines, disclaimX, emailY + 3.2)
      }

      // Website link in footer area
      const webX = m
      const webY = y + 12
      doc.setTextColor(14, 95, 196)
      doc.setFontSize(6)
      doc.setFont("helvetica", "bold")
      doc.text("www.framemaxx.com", webX, webY)
      const webW = doc.getTextWidth("www.framemaxx.com")
      doc.setDrawColor(14, 95, 196)
      doc.setLineWidth(0.15)
      doc.line(webX, webY + 0.4, webX + webW, webY + 0.4)
      doc.link(webX, webY - 2, webW, 3, { url: "https://www.framemaxx.com" })

      // ── FOOTER BAND ──────────────────────────────────────
      const footerY = ph - 14
      doc.setFillColor(...cDark)
      doc.rect(0, footerY, pw, 14, "F")

      // Left side
      doc.setTextColor(148, 163, 184)
      doc.setFontSize(6.5)
      doc.setFont("helvetica", "bold")
      doc.text("FrameMaxx", m, footerY + 5.5)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...cMuted)
      doc.text("  \u2014  Official Registration Document", m + 16, footerY + 5.5)

      // Tracking ID badge (simulated transparency)
      doc.setDrawColor(40, 55, 85)
      doc.setFillColor(22, 38, 62)
      doc.setLineWidth(0.2)
      doc.roundedRect(m + 72, footerY + 2.5, 32, 5, 1, 1, "FD")
      doc.setTextColor(148, 163, 184)
      doc.setFont("courier", "bold")
      doc.setFontSize(5.5)
      doc.text(trackingId, m + 74, footerY + 6)

      // Right side
      doc.setTextColor(71, 85, 105)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(5.5)
      doc.text(
        `Generated ${dateStr} at ${timeStr}  \u2022  Page 1 of 1`,
        pw - m,
        footerY + 5.5,
        { align: "right" }
      )

      // Website hyperlink in footer
      doc.setTextColor(100, 170, 255)
      doc.setFontSize(5.5)
      doc.setFont("helvetica", "bold")
      const footerWebText = "www.framemaxx.com"
      doc.text(footerWebText, pw - m, footerY + 10, { align: "right" })
      const footerWebW = doc.getTextWidth(footerWebText)
      doc.setDrawColor(100, 170, 255)
      doc.setLineWidth(0.1)
      doc.line(pw - m - footerWebW, footerY + 10.3, pw - m, footerY + 10.3)
      doc.link(pw - m - footerWebW, footerY + 8, footerWebW, 3, { url: "https://www.framemaxx.com" })

      // Save the PDF
      doc.save(`FrameMaxx-Registration-${trackingId}.pdf`)
      toast.success("PDF downloaded successfully!")
    } catch (error) {
      console.error("PDF download error:", error)
      toast.error("Failed to generate PDF. Try using Print instead.")
    } finally {
      setDownloading(false)
    }
  }, [trackingId, data, qrCodeDataUrl])

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
