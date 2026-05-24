import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { writeFileSync, mkdirSync, existsSync } from "fs"
import { join } from "path"
import { randomBytes } from "crypto"

function generateTrackingId(): string {
  const year = new Date().getFullYear()
  const hex = randomBytes(3).toString("hex").toUpperCase()
  return `FMX-${year}-${hex}`
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

    // Save uploaded files
    const uploadsDir = join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true })
    }

    let photoPath: string | null = null
    let cvPath: string | null = null
    let nidPassportPath: string | null = null

    if (photoBase64) {
      const buffer = Buffer.from(photoBase64.split(",")[1] || photoBase64, "base64")
      const filename = `${trackingId}-photo.png`
      writeFileSync(join(uploadsDir, filename), buffer)
      photoPath = `/uploads/${filename}`
    }

    if (cvBase64) {
      const buffer = Buffer.from(cvBase64.split(",")[1] || cvBase64, "base64")
      const filename = `${trackingId}-cv.pdf`
      writeFileSync(join(uploadsDir, filename), buffer)
      cvPath = `/uploads/${filename}`
    }

    if (nidPassportBase64) {
      const buffer = Buffer.from(nidPassportBase64.split(",")[1] || nidPassportBase64, "base64")
      const filename = `${trackingId}-nid-passport.pdf`
      writeFileSync(join(uploadsDir, filename), buffer)
      nidPassportPath = `/uploads/${filename}`
    }

    // Save signature
    const sigBuffer = Buffer.from(signatureData.split(",")[1] || signatureData, "base64")
    const sigFilename = `${trackingId}-signature.png`
    writeFileSync(join(uploadsDir, sigFilename), sigBuffer)

    // Save to database
    const registration = await db.registration.create({
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
        signatureData: `/uploads/${sigFilename}`,
        agreeToTerms,
        agreeToPrivacy,
      },
    })

    return NextResponse.json({
      success: true,
      trackingId: registration.trackingId,
      id: registration.id,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
