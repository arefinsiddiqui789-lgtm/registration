import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import QRCode from "qrcode"
import { LOGO_BASE64 } from "@/lib/logo-base64"
import { readFileSync } from "fs"
import { join } from "path"

export async function POST(request: NextRequest) {
  try {
    const { trackingId } = await request.json()

    if (!trackingId) {
      return NextResponse.json(
        { error: "Tracking ID is required" },
        { status: 400 }
      )
    }

    const registration = await db.registration.findUnique({
      where: { trackingId },
    })

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      )
    }

    // Generate QR code as base64
    const qrCodeDataUrl = await QRCode.toDataURL(
      JSON.stringify({
        trackingId: registration.trackingId,
        name: `${registration.firstName} ${registration.lastName}`,
        email: registration.email,
        timestamp: registration.createdAt.toISOString(),
      }),
      {
        width: 200,
        margin: 1,
        color: {
          dark: "#0a1628",
          light: "#ffffff",
        },
      }
    )

    // Read the signature file if it's a path
    let sigSrc = registration.signatureData
    if (sigSrc.startsWith("/uploads/")) {
      try {
        const sigBuf = readFileSync(join(process.cwd(), "public", sigSrc))
        sigSrc = `data:image/png;base64,${sigBuf.toString("base64")}`
      } catch {
        sigSrc = ""
      }
    }

    // Generate HTML for PDF
    const html = generatePdfHtml(registration, qrCodeDataUrl, sigSrc)

    return NextResponse.json({
      success: true,
      html,
      trackingId: registration.trackingId,
      qrCode: qrCodeDataUrl,
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}

function generatePdfHtml(
  reg: {
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
    signatureData: string
    createdAt: Date
  },
  qrCodeDataUrl: string,
  sigSrc: string
) {
  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })

  const formatDOB = (dob: string) => {
    if (!dob) return "N/A"
    try {
      const d = new Date(dob + "T00:00:00")
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dob
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4;
    margin: 0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    color: #1e293b;
    font-size: 10.5pt;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── HEADER BAND ─────────────────────────────────── */
  .header-band {
    background: #0a1628;
    padding: 28px 40px 22px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .logo-img {
    width: 52px;
    height: 52px;
    border-radius: 10px;
    object-fit: contain;
  }
  .brand-text {
    display: flex;
    flex-direction: column;
  }
  .brand-name {
    font-size: 22pt;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.3px;
    line-height: 1.1;
  }
  .brand-tagline {
    font-size: 8pt;
    color: #94a3b8;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    font-weight: 400;
    margin-top: 2px;
  }
  .header-right {
    text-align: right;
  }
  .doc-label {
    font-size: 7pt;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 500;
  }
  .doc-title-header {
    font-size: 13pt;
    font-weight: 600;
    color: #ffffff;
    letter-spacing: 0.5px;
    margin-top: 2px;
  }

  /* ── SUB-HEADER BAR ──────────────────────────────── */
  .sub-header {
    background: #131d35;
    padding: 10px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .tracking-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    padding: 4px 12px;
  }
  .tracking-label {
    font-size: 7pt;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 500;
  }
  .tracking-value {
    font-size: 9pt;
    color: #e2e8f0;
    font-weight: 600;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.5px;
  }
  .qr-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .qr-img {
    width: 56px;
    height: 56px;
    border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.15);
  }
  .qr-label {
    font-size: 6.5pt;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* ── PAGE BODY ────────────────────────────────────── */
  .page-body {
    padding: 28px 40px 20px;
  }

  /* ── SECTION ──────────────────────────────────────── */
  .section {
    margin-bottom: 20px;
  }
  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid #0a1628;
  }
  .section-icon {
    width: 22px;
    height: 22px;
    background: #0a1628;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10pt;
    color: #d4a843;
    font-weight: 700;
    flex-shrink: 0;
  }
  .section-title {
    font-size: 11pt;
    font-weight: 700;
    color: #0a1628;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  /* ── FIELD GRID ───────────────────────────────────── */
  .fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
  }
  .field {
    padding: 9px 14px;
    border-bottom: 1px solid #f1f5f9;
    border-right: 1px solid #f1f5f9;
  }
  .field:nth-child(2n) {
    border-right: none;
  }
  .field:nth-last-child(-n+2) {
    border-bottom: none;
  }
  .field.full {
    grid-column: 1 / -1;
    border-right: none;
  }
  .field-label {
    font-size: 7pt;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-weight: 600;
    margin-bottom: 2px;
  }
  .field-value {
    font-size: 10pt;
    color: #0f172a;
    font-weight: 500;
  }
  .field-value.na {
    color: #94a3b8;
    font-style: italic;
    font-weight: 400;
  }

  /* ── SIGNATURE SECTION ────────────────────────────── */
  .sig-section {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 2px solid #e2e8f0;
  }
  .sig-section-title {
    font-size: 8pt;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
    margin-bottom: 12px;
  }
  .sig-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .sig-block {
    text-align: center;
  }
  .sig-image {
    max-height: 55px;
    max-width: 180px;
    margin-bottom: 6px;
  }
  .sig-line {
    width: 180px;
    border-bottom: 1.5px solid #0a1628;
    margin: 0 auto 4px;
  }
  .sig-name {
    font-size: 8pt;
    color: #0f172a;
    font-weight: 600;
  }
  .sig-label {
    font-size: 7pt;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .date-block {
    text-align: right;
  }
  .date-value {
    font-size: 10pt;
    color: #0f172a;
    font-weight: 600;
  }
  .date-label {
    font-size: 7pt;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  /* ── WATERMARK ────────────────────────────────────── */
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 60pt;
    font-weight: 800;
    color: rgba(10, 22, 40, 0.03);
    letter-spacing: 8px;
    text-transform: uppercase;
    pointer-events: none;
    z-index: 0;
    white-space: nowrap;
  }

  /* ── FOOTER BAND ──────────────────────────────────── */
  .footer-band {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #0a1628;
    padding: 8px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-left {
    font-size: 7pt;
    color: #64748b;
    letter-spacing: 0.3px;
  }
  .footer-left .footer-brand {
    color: #94a3b8;
    font-weight: 600;
  }
  .footer-right {
    font-size: 7pt;
    color: #475569;
  }
  .footer-badge {
    display: inline-block;
    background: rgba(255,255,255,0.08);
    color: #94a3b8;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 7pt;
    font-weight: 600;
    letter-spacing: 0.5px;
    font-family: 'Courier New', monospace;
    margin-left: 6px;
  }

  /* ── DISCLAIMER ───────────────────────────────────── */
  .disclaimer {
    margin-top: 20px;
    padding: 10px 14px;
    background: #f8fafc;
    border-left: 3px solid #0a1628;
    border-radius: 0 4px 4px 0;
  }
  .disclaimer-text {
    font-size: 7.5pt;
    color: #64748b;
    line-height: 1.5;
  }
  .disclaimer-text strong {
    color: #475569;
  }
</style>
</head>
<body>

  <!-- Watermark -->
  <div class="watermark">FRAMEMAXX</div>

  <!-- Header Band -->
  <div class="header-band">
    <div class="header-left">
      <img class="logo-img" src="${LOGO_BASE64}" alt="FrameMaxx Logo" />
      <div class="brand-text">
        <div class="brand-name">FrameMaxx</div>
        <div class="brand-tagline">Professional Agency</div>
      </div>
    </div>
    <div class="header-right">
      <div class="doc-label">Official Document</div>
      <div class="doc-title-header">Registration Certificate</div>
    </div>
  </div>

  <!-- Sub-header Bar -->
  <div class="sub-header">
    <div class="tracking-chip">
      <span class="tracking-label">Tracking ID</span>
      <span class="tracking-value">${reg.trackingId}</span>
    </div>
    <div class="qr-wrapper">
      <div>
        <div class="qr-label">Scan to verify</div>
      </div>
      <img class="qr-img" src="${qrCodeDataUrl}" alt="QR Code" />
    </div>
  </div>

  <!-- Page Body -->
  <div class="page-body">

    <!-- Personal Information -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon">P</div>
        <div class="section-title">Personal Information</div>
      </div>
      <div class="fields">
        <div class="field">
          <div class="field-label">Full Name</div>
          <div class="field-value">${reg.firstName} ${reg.lastName}</div>
        </div>
        <div class="field">
          <div class="field-label">Date of Birth</div>
          <div class="field-value ${!reg.dateOfBirth ? 'na' : ''}">${formatDOB(reg.dateOfBirth)}</div>
        </div>
        <div class="field">
          <div class="field-label">Gender</div>
          <div class="field-value ${!reg.gender ? 'na' : ''}">${reg.gender || "Not specified"}</div>
        </div>
        <div class="field">
          <div class="field-label">Nationality</div>
          <div class="field-value ${!reg.nationality ? 'na' : ''}">${reg.nationality || "Not specified"}</div>
        </div>
        <div class="field">
          <div class="field-label">${reg.nidPassportType === "Passport" ? "Passport Number" : "National ID Number"}</div>
          <div class="field-value ${!reg.nidPassportNumber ? 'na' : ''}">${reg.nidPassportNumber || "Not provided"}</div>
        </div>
        <div class="field">
          <div class="field-label">ID Type</div>
          <div class="field-value">${reg.nidPassportType === "Passport" ? "Passport" : "National ID (NID)"}</div>
        </div>
      </div>
    </div>

    <!-- Contact Information -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon">C</div>
        <div class="section-title">Contact Information</div>
      </div>
      <div class="fields">
        <div class="field">
          <div class="field-label">Email Address</div>
          <div class="field-value">${reg.email}</div>
        </div>
        <div class="field">
          <div class="field-label">Phone Number</div>
          <div class="field-value">${reg.phone}</div>
        </div>
        <div class="field full">
          <div class="field-label">Address</div>
          <div class="field-value">${reg.address || ""}${reg.city ? ", " + reg.city : ""}${reg.state ? ", " + reg.state : ""}${reg.postalCode ? " " + reg.postalCode : ""}${reg.country ? ", " + reg.country : ""}</div>
        </div>
      </div>
    </div>

    <!-- Professional Information -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon">W</div>
        <div class="section-title">Professional Information</div>
      </div>
      <div class="fields">
        <div class="field">
          <div class="field-label">Occupation / Job Title</div>
          <div class="field-value ${!reg.occupation ? 'na' : ''}">${reg.occupation || "Not specified"}</div>
        </div>
        <div class="field">
          <div class="field-label">Current Company</div>
          <div class="field-value ${!reg.company ? 'na' : ''}">${reg.company || "Not provided"}</div>
        </div>
        <div class="field">
          <div class="field-label">Experience Level</div>
          <div class="field-value ${!reg.experience ? 'na' : ''}">${reg.experience || "Not specified"}</div>
        </div>
        <div class="field">
          <div class="field-label">Department of Interest</div>
          <div class="field-value ${!reg.department ? 'na' : ''}">${reg.department || "Not specified"}</div>
        </div>
        <div class="field full">
          <div class="field-label">Skills &amp; Expertise</div>
          <div class="field-value ${!reg.skills ? 'na' : ''}">${reg.skills || "Not provided"}</div>
        </div>
      </div>
    </div>

    <!-- Signature -->
    <div class="sig-section">
      <div class="sig-section-title">Applicant Declaration &amp; Signature</div>
      <div class="sig-row">
        <div class="sig-block">
          ${sigSrc ? `<img class="sig-image" src="${sigSrc}" alt="Digital Signature" />` : '<div style="height: 55px;"></div>'}
          <div class="sig-line"></div>
          <div class="sig-name">${reg.firstName} ${reg.lastName}</div>
          <div class="sig-label">Applicant Signature</div>
        </div>
        <div class="date-block">
          <div class="date-value">${formatDate(reg.createdAt)}</div>
          <div class="date-value" style="font-size: 9pt; font-weight: 400; color: #475569;">${formatTime(reg.createdAt)}</div>
          <div class="date-label" style="margin-top: 6px;">Date &amp; Time of Submission</div>
        </div>
      </div>
    </div>

    <!-- Disclaimer -->
    <div class="disclaimer">
      <div class="disclaimer-text">
        <strong>Confidential:</strong> This document is auto-generated by the FrameMaxx Registration Portal
        and contains confidential information. The digital signature above confirms the applicant's agreement
        to the Privacy Policy and Terms &amp; Conditions. Unauthorized reproduction or distribution is prohibited.
        For verification, scan the QR code or contact <strong>support@framemaxx.com</strong> with tracking ID
        <strong>${reg.trackingId}</strong>.
      </div>
    </div>

  </div>

  <!-- Footer Band -->
  <div class="footer-band">
    <div class="footer-left">
      <span class="footer-brand">FrameMaxx</span> &mdash; Official Registration Document
      <span class="footer-badge">${reg.trackingId}</span>
    </div>
    <div class="footer-right">
      Generated ${formatDate(reg.createdAt)} at ${formatTime(reg.createdAt)} &bull; Page 1 of 1
    </div>
  </div>

</body>
</html>`
}
