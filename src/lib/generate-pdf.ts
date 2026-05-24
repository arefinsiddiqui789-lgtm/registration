/**
 * Server-side PDF generator for FrameMaxx Registration
 * Uses jsPDF to create a professional A4 registration certificate PDF
 * and saves it to the uploads directory.
 */

import jsPDF from "jspdf"
import { writeFileSync, readFileSync } from "fs"
import { join } from "path"
import { LOGO_BASE64 } from "@/lib/logo-base64"

interface RegistrationData {
  trackingId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  nationality: string
  nidPassportType: string
  nidPassportNumber: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  occupation: string
  company: string
  experience: string
  skills: string
  department: string
  signatureData: string // path like /uploads/FMX-xxx-signature.png
}

export function generateRegistrationPdf(
  data: RegistrationData,
  uploadsDir: string
): string {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // A4: 210 x 297 mm
  const pw = 210
  const ph = 297
  const m = 12
  const footerH = 12
  const maxContentY = ph - footerH - 2

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
  doc.text("MARKETING AGENCY", m + 22, 18)

  // Document label (right side)
  doc.setTextColor(...cMuted)
  doc.setFontSize(6)
  doc.setFont("helvetica", "normal")
  doc.text("OFFICIAL DOCUMENT", pw - m, 10, { align: "right" })

  // Document title
  doc.setTextColor(...cWhite)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Registration Certificate", pw - m, 17, { align: "right" })

  // ── SUB HEADER ───────────────────────────────────────
  doc.setFillColor(...cSubDark)
  doc.rect(0, 28, pw, 13, "F")

  // Tracking ID chip
  doc.setDrawColor(50, 65, 100)
  doc.setLineWidth(0.3)
  doc.setFillColor(30, 42, 70)
  doc.roundedRect(m, 30, 68, 8, 1.5, 1.5, "FD")

  doc.setTextColor(148, 163, 184)
  doc.setFontSize(5)
  doc.setFont("helvetica", "bold")
  doc.text("TRACKING ID", m + 4, 33.5)

  doc.setTextColor(226, 232, 240)
  doc.setFontSize(8)
  doc.setFont("courier", "bold")
  doc.text(data.trackingId, m + 4, 37)

  // ── HELPER FUNCTIONS ─────────────────────────────────
  let y = 44

  const drawSection = (title: string, letter: string, sy: number): number => {
    if (sy > maxContentY - 10) return sy
    doc.setFillColor(...cDark)
    doc.roundedRect(m, sy, 5, 5, 1, 1, "F")
    doc.setTextColor(...cGold)
    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.text(letter, m + 2.5, sy + 3.5, { align: "center" })

    doc.setTextColor(...cDark)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(title.toUpperCase(), m + 8, sy + 3.8)

    doc.setDrawColor(...cDark)
    doc.setLineWidth(0.6)
    doc.line(m, sy + 6, pw - m, sy + 6)

    return sy + 8
  }

  const fh = 9
  const hw = (pw - 2 * m) / 2
  const halfContentW = hw - 5

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
    if (fy > maxContentY - fh) return
    const rowW = fullSpan ? pw - 2 * m : hw

    doc.setDrawColor(...cBorder)
    doc.setLineWidth(0.3)
    doc.rect(m, fy, rowW, fh)

    doc.setTextColor(...cMuted)
    doc.setFontSize(5)
    doc.setFont("helvetica", "bold")
    doc.text(truncText(label1.toUpperCase(), rowW - 5), m + 2, fy + 3)

    if (!value1) {
      doc.setTextColor(148, 163, 184)
      doc.setFont("helvetica", "italic")
    } else {
      doc.setTextColor(...cText)
      doc.setFont("helvetica", "bold")
    }
    doc.setFontSize(8)
    const contentW = fullSpan ? pw - 2 * m - 5 : halfContentW
    doc.text(truncText(value1 || "Not specified", contentW), m + 2, fy + 7)

    if (!fullSpan) {
      doc.rect(m + hw, fy, hw, fh)
      doc.setTextColor(...cMuted)
      doc.setFontSize(5)
      doc.setFont("helvetica", "bold")
      doc.text(truncText(label2.toUpperCase(), halfContentW), m + hw + 2, fy + 3)

      if (!value2) {
        doc.setTextColor(148, 163, 184)
        doc.setFont("helvetica", "italic")
      } else {
        doc.setTextColor(...cText)
        doc.setFont("helvetica", "bold")
      }
      doc.setFontSize(8)
      doc.text(truncText(value2 || "Not specified", halfContentW), m + hw + 2, fy + 7)
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

  drawFieldRow("Full Name", `${data.firstName} ${data.lastName}`, "Date of Birth", formatDOB(data.dateOfBirth), y)
  y += fh
  drawFieldRow("Gender", data.gender, "Nationality", data.nationality, y)
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
  drawFieldRow("Email Address", data.email, "Phone Number", data.phone, y)
  y += fh
  const fullAddr = `${data.address || ""}${data.city ? ", " + data.city : ""}${data.state ? ", " + data.state : ""}${data.postalCode ? " " + data.postalCode : ""}${data.country ? ", " + data.country : ""}`
  drawFieldRow("Address", fullAddr, "", "", y, true)
  y += fh + 3

  // ── PROFESSIONAL INFORMATION ─────────────────────────
  y = drawSection("Professional Information", "W", y)
  drawFieldRow("Occupation / Job Title", data.occupation, "Current Company", data.company, y)
  y += fh
  drawFieldRow("Experience Level", data.experience, "Department of Interest", data.department, y)
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
    if (data.signatureData && data.signatureData.startsWith("/uploads/")) {
      try {
        const sigBuf = readFileSync(join(process.cwd(), "public", data.signatureData))
        const sigBase64 = `data:image/png;base64,${sigBuf.toString("base64")}`
        doc.addImage(sigBase64, "PNG", m + 4, y - 1, 40, 13)
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
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

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
      data.trackingId +
      "."
    doc.text(disclaimer, m + 3, y + 3.5, { maxWidth: pw - 2 * m - 6 })
  }

  // ── FOOTER BAND ──────────────────────────────────────
  const footerY = ph - footerH
  doc.setFillColor(...cDark)
  doc.rect(0, footerY, pw, footerH, "F")

  const now2 = new Date()
  const dateStr2 = now2.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  const timeStr2 = now2.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

  doc.setTextColor(148, 163, 184)
  doc.setFontSize(5.5)
  doc.setFont("helvetica", "bold")
  doc.text("FrameMaxx", m, footerY + 4.5)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...cMuted)
  doc.text("  \u2014  Official Registration Document", m + 14, footerY + 4.5)

  doc.setDrawColor(40, 55, 85)
  doc.setFillColor(22, 38, 62)
  doc.setLineWidth(0.2)
  doc.roundedRect(m + 65, footerY + 2, 30, 4.5, 1, 1, "FD")
  doc.setTextColor(148, 163, 184)
  doc.setFont("courier", "bold")
  doc.setFontSize(5)
  doc.text(data.trackingId, m + 67, footerY + 5)

  doc.setTextColor(71, 85, 105)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(5)
  doc.text(`Generated ${dateStr2} at ${timeStr2}  \u2022  Page 1 of 1`, pw - m, footerY + 4.5, { align: "right" })

  // Save PDF to file
  const pdfFilename = `${data.trackingId}-registration.pdf`
  const pdfPath = join(uploadsDir, pdfFilename)
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"))
  writeFileSync(pdfPath, pdfBuffer)

  return `/uploads/${pdfFilename}`
}
