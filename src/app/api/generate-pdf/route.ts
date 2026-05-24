import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import QRCode from "qrcode"

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
        width: 150,
        margin: 1,
        color: {
          dark: "#0a1628",
          light: "#ffffff",
        },
      }
    )

    // Generate HTML for PDF
    const html = generatePdfHtml(registration, qrCodeDataUrl)

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
  qrCodeDataUrl: string
) {
  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const sigSrc = reg.signatureData.startsWith("data:")
    ? reg.signatureData
    : reg.signatureData.startsWith("/uploads/")
      ? reg.signatureData
      : `data:image/png;base64,${reg.signatureData}`

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Poppins', 'Segoe UI', Arial, sans-serif; color: #1a1a2e; font-size: 11px; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0a1628; padding-bottom: 15px; margin-bottom: 20px; }
  .header-left { display: flex; align-items: center; gap: 12px; }
  .logo-box { width: 50px; height: 50px; background: #0a1628; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #d4a843; font-weight: 800; font-size: 16px; }
  .company-name { font-size: 20px; font-weight: 700; color: #0a1628; letter-spacing: -0.5px; }
  .company-sub { font-size: 10px; color: #64748b; font-weight: 400; letter-spacing: 1px; text-transform: uppercase; }
  .header-right { text-align: right; }
  .doc-title { font-size: 14px; font-weight: 600; color: #0a1628; text-transform: uppercase; letter-spacing: 1px; }
  .tracking-id { font-size: 11px; color: #64748b; margin-top: 2px; }
  .tracking-id span { color: #0a1628; font-weight: 600; }

  .qr-section { position: absolute; top: 20mm; right: 20mm; }

  .section { margin-bottom: 16px; }
  .section-title { font-size: 12px; font-weight: 600; color: #0a1628; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 8px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
  .field { margin-bottom: 3px; }
  .field-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; }
  .field-value { font-size: 11px; color: #1a1a2e; font-weight: 500; }

  .full-width { grid-column: 1 / -1; }

  .signature-section { margin-top: 20px; padding-top: 12px; border-top: 1.5px solid #e2e8f0; }
  .sig-row { display: flex; justify-content: space-between; align-items: flex-end; }
  .sig-box { text-align: center; }
  .sig-img { max-height: 50px; max-width: 200px; margin-bottom: 4px; }
  .sig-line { width: 200px; border-bottom: 1px solid #0a1628; margin-bottom: 4px; }
  .sig-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }

  .footer { position: fixed; bottom: 20mm; left: 20mm; right: 20mm; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; }
  .footer-left { font-size: 8px; color: #94a3b8; }
  .footer-right { font-size: 8px; color: #94a3b8; }

  .badge { display: inline-block; background: #0a1628; color: white; padding: 2px 8px; border-radius: 3px; font-size: 9px; font-weight: 600; letter-spacing: 0.5px; }
  .qr-img { width: 80px; height: 80px; }
</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="logo-box">FM</div>
      <div>
        <div class="company-name">FrameMaxx</div>
        <div class="company-sub">Professional Agency</div>
      </div>
    </div>
    <div class="header-right">
      <div class="doc-title">Registration Document</div>
      <div class="tracking-id">Tracking ID: <span>${reg.trackingId}</span></div>
    </div>
  </div>

  <div style="text-align: right; margin-top: -60px; margin-bottom: 20px;">
    <img class="qr-img" src="${qrCodeDataUrl}" alt="QR Code" />
  </div>

  <div class="section">
    <div class="section-title">Personal Information</div>
    <div class="grid">
      <div class="field">
        <div class="field-label">Full Name</div>
        <div class="field-value">${reg.firstName} ${reg.lastName}</div>
      </div>
      <div class="field">
        <div class="field-label">Date of Birth</div>
        <div class="field-value">${reg.dateOfBirth || "N/A"}</div>
      </div>
      <div class="field">
        <div class="field-label">Gender</div>
        <div class="field-value">${reg.gender || "N/A"}</div>
      </div>
      <div class="field">
        <div class="field-label">Nationality</div>
        <div class="field-value">${reg.nationality || "N/A"}</div>
      </div>
      <div class="field">
        <div class="field-label">${reg.nidPassportType} Number</div>
        <div class="field-value">${reg.nidPassportNumber || "N/A"}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Contact Information</div>
    <div class="grid">
      <div class="field">
        <div class="field-label">Email Address</div>
        <div class="field-value">${reg.email}</div>
      </div>
      <div class="field">
        <div class="field-label">Phone Number</div>
        <div class="field-value">${reg.phone}</div>
      </div>
      <div class="field full-width">
        <div class="field-label">Address</div>
        <div class="field-value">${reg.address}${reg.city ? ", " + reg.city : ""}${reg.state ? ", " + reg.state : ""}${reg.postalCode ? " " + reg.postalCode : ""}${reg.country ? ", " + reg.country : ""}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Professional Information</div>
    <div class="grid">
      <div class="field">
        <div class="field-label">Occupation</div>
        <div class="field-value">${reg.occupation || "N/A"}</div>
      </div>
      <div class="field">
        <div class="field-label">Company</div>
        <div class="field-value">${reg.company || "N/A"}</div>
      </div>
      <div class="field">
        <div class="field-label">Experience</div>
        <div class="field-value">${reg.experience || "N/A"}</div>
      </div>
      <div class="field">
        <div class="field-label">Department</div>
        <div class="field-value">${reg.department || "N/A"}</div>
      </div>
      <div class="field full-width">
        <div class="field-label">Skills</div>
        <div class="field-value">${reg.skills || "N/A"}</div>
      </div>
    </div>
  </div>

  <div class="signature-section">
    <div class="sig-row">
      <div class="sig-box">
        <img class="sig-img" src="${sigSrc}" alt="Digital Signature" />
        <div class="sig-line"></div>
        <div class="sig-label">Applicant Signature</div>
      </div>
      <div class="sig-box" style="text-align: right;">
        <div class="field-value" style="font-size: 10px;">${formatDate(reg.createdAt)}</div>
        <div class="sig-label">Date & Time</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-left">
      <span class="badge">${reg.trackingId}</span>
      &nbsp; This document was auto-generated by FrameMaxx Registration Portal
    </div>
    <div class="footer-right">
      Generated on ${formatDate(reg.createdAt)} &bull; Confidential
    </div>
  </div>
</body>
</html>`
}
