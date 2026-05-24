import { NextRequest, NextResponse } from "next/server"
import { safeDb } from "@/lib/db"
import { LOGO_BASE64 } from "@/lib/logo-base64"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackingId } = body

    if (!trackingId) {
      return NextResponse.json(
        { error: "Tracking ID is required" },
        { status: 400 }
      )
    }

    // Try to get data from database first (works locally with SQLite)
    let registration = await safeDb(async (database) => {
      return database.registration.findUnique({
        where: { trackingId },
      })
    })

    // If DB lookup failed (e.g., on Vercel), use data sent from client
    if (!registration) {
      registration = body.registrationData || null
    }

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      )
    }

    // Handle signature data
    let sigSrc = registration.signatureData || ""
    if (sigSrc && sigSrc.startsWith("/uploads/")) {
      // Try to read the file from disk (local only)
      try {
        const { readFileSync } = await import("fs")
        const { join } = await import("path")
        const sigBuf = readFileSync(join(process.cwd(), "public", sigSrc))
        sigSrc = `data:image/png;base64,${sigBuf.toString("base64")}`
      } catch {
        sigSrc = ""
      }
    }

    const html = generatePdfHtml(registration, sigSrc)

    return NextResponse.json({
      success: true,
      html,
      trackingId: registration.trackingId,
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
    createdAt: Date | string
  },
  sigSrc: string
) {
  const createdDate = reg.createdAt instanceof Date ? reg.createdAt : new Date()

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

  html {
    width: 794px;
  }

  body {
    width: 794px;
    min-height: 1123px;
    font-family: Arial, Helvetica, sans-serif;
    color: #1e293b;
    font-size: 12px;
    line-height: 1.5;
    display: flex;
    flex-direction: column;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  @media print {
    html, body { height: auto; min-height: auto; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }

  .header-band {
    background: #0a1628;
    padding: 12px 30px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo-img {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    object-fit: contain;
  }
  .brand-name {
    font-size: 20px;
    font-weight: bold;
    color: #ffffff;
    letter-spacing: -0.3px;
  }
  .brand-tagline {
    font-size: 8px;
    color: #94a3b8;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 1px;
  }
  .header-right { text-align: right; }
  .doc-label {
    font-size: 7px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }
  .doc-title-header {
    font-size: 13px;
    font-weight: bold;
    color: #ffffff;
    letter-spacing: 0.5px;
    margin-top: 2px;
  }

  .sub-header {
    background: #131d35;
    padding: 6px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }
  .tracking-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 4px;
    padding: 3px 10px;
  }
  .tracking-label {
    font-size: 7px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: bold;
  }
  .tracking-value {
    font-size: 10px;
    color: #e2e8f0;
    font-weight: bold;
    font-family: 'Courier New', Courier, monospace;
    letter-spacing: 0.5px;
  }

  .page-body {
    flex: 1;
    padding: 10px 30px 8px;
    display: flex;
    flex-direction: column;
  }

  .section { margin-bottom: 8px; }
  .section-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 5px;
    padding-bottom: 4px;
    border-bottom: 2px solid #0a1628;
  }
  .section-icon {
    width: 18px;
    height: 18px;
    background: #0a1628;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    color: #d4a843;
    font-weight: bold;
    flex-shrink: 0;
  }
  .section-title {
    font-size: 10px;
    font-weight: bold;
    color: #0a1628;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    overflow: hidden;
  }
  .field {
    padding: 6px 10px;
    border-bottom: 1px solid #e2e8f0;
    border-right: 1px solid #e2e8f0;
    min-width: 0;
  }
  .field:nth-child(2n) { border-right: none; }
  .field:nth-last-child(-n+2) { border-bottom: none; }
  .field.full {
    grid-column: 1 / -1;
    border-right: none;
  }
  .field-label {
    font-size: 8px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: bold;
    margin-bottom: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .field-value {
    font-size: 11px;
    color: #0f172a;
    font-weight: 600;
    overflow-wrap: break-word;
    word-break: break-word;
  }
  .field-value.na {
    color: #94a3b8;
    font-style: italic;
    font-weight: 400;
  }

  .sig-section {
    margin-top: auto;
    padding-top: 6px;
    border-top: 2px solid #e2e8f0;
    flex-shrink: 0;
  }
  .sig-section-title {
    font-size: 8px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: bold;
    margin-bottom: 5px;
  }
  .sig-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .sig-block { text-align: center; }
  .sig-image {
    max-height: 40px;
    max-width: 140px;
    margin-bottom: 3px;
  }
  .sig-line {
    width: 140px;
    border-bottom: 1.5px solid #0a1628;
    margin: 0 auto 2px;
  }
  .sig-name {
    font-size: 9px;
    color: #0f172a;
    font-weight: bold;
  }
  .sig-label {
    font-size: 7px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .date-block { text-align: right; }
  .date-value {
    font-size: 11px;
    color: #0f172a;
    font-weight: bold;
  }
  .date-sub {
    font-size: 9px;
    font-weight: 400;
    color: #475569;
  }
  .date-label {
    font-size: 7px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-top: 1px;
  }

  .disclaimer {
    margin-top: 6px;
    padding: 6px 10px;
    background: #f8fafc;
    border-left: 3px solid #0a1628;
    border-radius: 0 4px 4px 0;
    flex-shrink: 0;
  }
  .disclaimer-text {
    font-size: 7.5px;
    color: #64748b;
    line-height: 1.4;
  }
  .disclaimer-text strong { color: #475569; }

  .footer-band {
    background: #0a1628;
    padding: 6px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }
  .footer-left {
    font-size: 7px;
    color: #64748b;
  }
  .footer-left .footer-brand {
    color: #94a3b8;
    font-weight: bold;
  }
  .footer-right {
    font-size: 7px;
    color: #475569;
  }
  .footer-badge {
    display: inline-block;
    background: rgba(255,255,255,0.08);
    color: #94a3b8;
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 7px;
    font-weight: bold;
    font-family: 'Courier New', Courier, monospace;
    margin-left: 4px;
  }
</style>
</head>
<body>

  <div class="header-band">
    <div class="header-left">
      <img class="logo-img" src="${LOGO_BASE64}" alt="FrameMaxx Logo" />
      <div>
        <div class="brand-name">FrameMaxx</div>
        <div class="brand-tagline">Marketing Agency</div>
      </div>
    </div>
    <div class="header-right">
      <div class="doc-label">Official Document</div>
      <div class="doc-title-header">Registration Certificate</div>
    </div>
  </div>

  <div class="sub-header">
    <div class="tracking-chip">
      <span class="tracking-label">Tracking ID</span>
      <span class="tracking-value">${reg.trackingId}</span>
    </div>
  </div>

  <div class="page-body">

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

    <div class="sig-section">
      <div class="sig-section-title">Applicant Declaration &amp; Signature</div>
      <div class="sig-row">
        <div class="sig-block">
          ${sigSrc ? `<img class="sig-image" src="${sigSrc}" alt="Digital Signature" />` : '<div style="height: 48px;"></div>'}
          <div class="sig-line"></div>
          <div class="sig-name">${reg.firstName} ${reg.lastName}</div>
          <div class="sig-label">Applicant Signature</div>
        </div>
        <div class="date-block">
          <div class="date-value">${formatDate(createdDate)}</div>
          <div class="date-sub">${formatTime(createdDate)}</div>
          <div class="date-label">Date &amp; Time of Submission</div>
        </div>
      </div>
    </div>

    <div class="disclaimer">
      <div class="disclaimer-text">
        <strong>Confidential:</strong> This document is auto-generated by the FrameMaxx Registration Portal
        and contains confidential information. The digital signature above confirms the applicant's agreement
        to the Privacy Policy and Terms &amp; Conditions. Unauthorized reproduction or distribution is prohibited.
        For verification, reference tracking ID <strong>${reg.trackingId}</strong>.
      </div>
    </div>

  </div>

  <div class="footer-band">
    <div class="footer-left">
      <span class="footer-brand">FrameMaxx</span> &mdash; Official Registration Document
      <span class="footer-badge">${reg.trackingId}</span>
    </div>
    <div class="footer-right">
      Generated ${formatDate(createdDate)} at ${formatTime(createdDate)} &bull; Page 1 of 1
    </div>
  </div>

</body>
</html>`
}
