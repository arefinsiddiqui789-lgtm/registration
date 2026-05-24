import { NextRequest, NextResponse } from "next/server"
import { safeDb } from "@/lib/db"
import { randomBytes } from "crypto"
import { sendRegistrationNotification, isTelegramConfigured } from "@/lib/telegram"
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

    // Extract buffers for Telegram sending (works on both Vercel and local)
    let photoBuffer: Buffer | null = null
    let cvBuffer: Buffer | null = null
    let nidBuffer: Buffer | null = null
    let photoExt = "png"
    let cvExt = "pdf"
    let nidExt = "pdf"

    if (photoBase64) {
      photoBuffer = Buffer.from(photoBase64.split(",")[1] || photoBase64, "base64")
      photoExt = getExtFromBase64(photoBase64)
      console.log(`📸 Photo buffer: ${(photoBuffer.length / 1024).toFixed(1)} KB, ext: ${photoExt}`)
    } else {
      console.log("📸 No photo uploaded")
    }

    if (cvBase64) {
      cvBuffer = Buffer.from(cvBase64.split(",")[1] || cvBase64, "base64")
      cvExt = getExtFromBase64(cvBase64)
      console.log(`📄 CV buffer: ${(cvBuffer.length / 1024).toFixed(1)} KB, ext: ${cvExt}`)
    } else {
      console.log("📄 No CV uploaded")
    }

    if (nidPassportBase64) {
      nidBuffer = Buffer.from(nidPassportBase64.split(",")[1] || nidPassportBase64, "base64")
      nidExt = getExtFromBase64(nidPassportBase64)
      console.log(`🪪 NID buffer: ${(nidBuffer.length / 1024).toFixed(1)} KB, ext: ${nidExt}`)
    } else {
      console.log("🪪 No NID/Passport uploaded")
    }

    // Signature buffer
    const sigBuffer = Buffer.from(signatureData.split(",")[1] || signatureData, "base64")

    // Save to database (gracefully handles failure on Vercel)
    await safeDb(async (database) => {
      await database.registration.create({
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
          photoPath: null,
          cvPath: null,
          nidPassportPath: null,
          signatureData: signatureData.substring(0, 100),
          agreeToTerms,
          agreeToPrivacy,
        },
      })
    })

    // Save files locally (only in development, not on Vercel)
    if (!isVercel()) {
      try {
        const { writeFileSync, mkdirSync, existsSync } = await import("fs")
        const { join } = await import("path")
        const uploadsDir = join(process.cwd(), "public", "uploads")

        if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })

        if (photoBuffer) {
          writeFileSync(join(uploadsDir, `${trackingId}-photo.${photoExt}`), photoBuffer)
        }
        if (cvBuffer) {
          writeFileSync(join(uploadsDir, `${trackingId}-cv.${cvExt}`), cvBuffer)
        }
        if (nidBuffer) {
          writeFileSync(join(uploadsDir, `${trackingId}-nid-passport.${nidExt}`), nidBuffer)
        }
        writeFileSync(join(uploadsDir, `${trackingId}-signature.png`), sigBuffer)
      } catch (fsErr) {
        console.error("File save failed (non-critical):", fsErr)
      }
    }

    // Generate the registration PDF (in-memory, works everywhere)
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
        try {
          const { writeFileSync } = await import("fs")
          const { join } = await import("path")
          writeFileSync(
            join(process.cwd(), "public", "uploads", `${trackingId}-registration.pdf`),
            pdfBuffer
          )
        } catch (e) {
          console.error("PDF local save failed:", e)
        }
      }
    } catch (err) {
      console.error("PDF generation failed (non-critical):", err)
    }

    // Send Telegram notification with files (works on both local & Vercel)
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
