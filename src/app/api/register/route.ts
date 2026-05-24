import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { writeFileSync, mkdirSync, existsSync } from "fs"
import { join } from "path"
import { randomBytes } from "crypto"
import { sendRegistrationNotification, isTelegramConfigured, sendTelegramPhotoBuffer, sendTelegramDocumentBuffer } from "@/lib/telegram"
import { generateRegistrationPdfBuffer } from "@/lib/generate-pdf"

function generateTrackingId(): string {
  const year = new Date().getFullYear()
  const hex = randomBytes(3).toString("hex").toUpperCase()
  return `FMX-${year}-${hex}`
}

// Detect file extension from base64 data URI
function getExtFromBase64(dataUri: string): string {
  const match = dataUri.match(/^data:([^;]+);/)
  if (match) {
    const mime = match[1]
    if (mime.includes("pdf")) return "pdf"
    if (mime.includes("png")) return "png"
    if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg"
    if (mime.includes("webp")) return "webp"
  }
  return "bin"
}

// Check if we're running on Vercel (read-only filesystem)
function isVercel(): boolean {
  return !!process.env.VERCEL
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      nationality,
      nidPassportType,
      nidPassportNumber,
      email,
      phone,
      address,
      city,
      state,
      postalCode,
      country,
      occupation,
      company,
      experience,
      skills,
      department,
      signatureData,
      agreeToTerms,
      agreeToPrivacy,
      photoBase64,
      cvBase64,
      nidPassportBase64,
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !agreeToTerms || !agreeToPrivacy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!signatureData) {
      return NextResponse.json(
        { error: "Digital signature is required" },
        { status: 400 }
      )
    }

    const trackingId = generateTrackingId()

    // Save uploaded files (only on local dev, not Vercel)
    const uploadsDir = join(process.cwd(), "public", "uploads")
    let photoPath: string | null = null
    let cvPath: string | null = null
    let nidPassportPath: string | null = null

    // Extract buffers for Telegram sending
    let photoBuffer: Buffer | null = null
    let cvBuffer: Buffer | null = null
    let nidBuffer: Buffer | null = null
    let photoExt = "png"
    let cvExt = "pdf"
    let nidExt = "pdf"

    if (photoBase64) {
      photoBuffer = Buffer.from(photoBase64.split(",")[1] || photoBase64, "base64")
      photoExt = getExtFromBase64(photoBase64)
      if (!isVercel()) {
        if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })
        const filename = `${trackingId}-photo.${photoExt}`
        writeFileSync(join(uploadsDir, filename), photoBuffer)
        photoPath = `/uploads/${filename}`
      }
    }

    if (cvBase64) {
      cvBuffer = Buffer.from(cvBase64.split(",")[1] || cvBase64, "base64")
      cvExt = getExtFromBase64(cvBase64)
      if (!isVercel()) {
        const filename = `${trackingId}-cv.${cvExt}`
        writeFileSync(join(uploadsDir, filename), cvBuffer)
        cvPath = `/uploads/${filename}`
      }
    }

    if (nidPassportBase64) {
      nidBuffer = Buffer.from(nidPassportBase64.split(",")[1] || nidPassportBase64, "base64")
      nidExt = getExtFromBase64(nidPassportBase64)
      if (!isVercel()) {
        const filename = `${trackingId}-nid-passport.${nidExt}`
        writeFileSync(join(uploadsDir, filename), nidBuffer)
        nidPassportPath = `/uploads/${filename}`
      }
    }

    // Save signature
    const sigBuffer = Buffer.from(signatureData.split(",")[1] || signatureData, "base64")
    let sigPath = ""
    if (!isVercel()) {
      const sigFilename = `${trackingId}-signature.png`
      writeFileSync(join(uploadsDir, sigFilename), sigBuffer)
      sigPath = `/uploads/${sigFilename}`
    }

    // Save to database
    try {
      await db.registration.create({
        data: {
          trackingId,
          firstName,
          lastName,
          dateOfBirth: dateOfBirth || "",
          gender: gender || "",
          nationality: nationality || "",
          nidPassportType: nidPassportType || "NID",
          nidPassportNumber: nidPassportNumber || "",
          email,
          phone,
          address: address || "",
          city: city || "",
          state: state || "",
          postalCode: postalCode || "",
          country: country || "",
          occupation: occupation || "",
          company: company || "",
          experience: experience || "",
          skills: skills || "",
          department: department || "",
          photoPath,
          cvPath,
          nidPassportPath,
          signatureData: sigPath || signatureData.substring(0, 100),
          agreeToTerms,
          agreeToPrivacy,
        },
      })
    } catch (dbError) {
      console.error("Database save failed:", dbError)
      // Continue even if DB fails - Telegram & email are more important
    }

    // Generate the registration PDF
    let pdfBuffer: Buffer | null = null
    try {
      pdfBuffer = generateRegistrationPdfBuffer({
        trackingId,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth || "",
        gender: gender || "",
        nationality: nationality || "",
        nidPassportType: nidPassportType || "NID",
        nidPassportNumber: nidPassportNumber || "",
        email,
        phone,
        address: address || "",
        city: city || "",
        state: state || "",
        postalCode: postalCode || "",
        country: country || "",
        occupation: occupation || "",
        company: company || "",
        experience: experience || "",
        skills: skills || "",
        department: department || "",
        signatureData: sigBuffer,
      })

      // Save PDF locally (not on Vercel)
      if (!isVercel() && pdfBuffer) {
        const pdfFilename = `${trackingId}-registration.pdf`
        writeFileSync(join(uploadsDir, pdfFilename), pdfBuffer)
      }
    } catch (err) {
      console.error("PDF generation failed (non-critical):", err)
    }

    // Send Telegram notification with files directly (works on both local & Vercel)
    if (isTelegramConfigured()) {
      sendRegistrationNotification({
        firstName,
        lastName,
        email,
        phone,
        trackingId,
        department: department || "",
        occupation: occupation || "",
        photoBuffer,
        photoExt,
        cvBuffer,
        cvExt,
        nidBuffer,
        nidExt,
        pdfBuffer,
        // Also pass paths for local dev (alternative file sending)
        photoPath,
        cvPath,
        nidPath: nidPassportPath,
      }).catch((err) => {
        console.error("Telegram notification failed (non-critical):", err)
      })
    }

    return NextResponse.json({
      success: true,
      trackingId,
      telegramNotified: isTelegramConfigured(),
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
