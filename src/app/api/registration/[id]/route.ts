import { NextRequest, NextResponse } from "next/server"
import { safeDb } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const registration = await safeDb(async (database) => {
      return database.registration.findUnique({
        where: { trackingId: id },
      })
    })

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ registration })
  } catch (error) {
    console.error("Fetch registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
