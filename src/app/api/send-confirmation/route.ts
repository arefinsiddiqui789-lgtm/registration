import { NextRequest, NextResponse } from "next/server"
import {
  sendEmail,
  isRealDeliveryConfigured,
  isSmtpUserOnlyMissing,
  generateConfirmationEmailHtml,
  generateConfirmationEmailText,
} from "@/lib/email"

// Fallback email content if LLM is unavailable
function generateFallbackEmailContent(firstName: string, lastName: string, trackingId: string): string {
  return `Dear ${firstName} ${lastName},

Thank you for registering with FrameMaxx Agency! Your registration has been successfully received and is now being processed.

Your Tracking ID: ${trackingId}

Please keep this tracking ID safe, as you can use it to check the status of your application at any time.

Our team will review your application and get back to you within 3-5 business days.

If you have any questions, please don't hesitate to reach out to us.

Best regards,
FrameMaxx Agency Team`
}

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, trackingId } = await request.json()

    if (!email || !trackingId) {
      return NextResponse.json(
        { error: "Email and tracking ID are required" },
        { status: 400 }
      )
    }

    // Generate confirmation email content - try LLM first, fallback to template
    let emailContent = ""

    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default
      const zai = await ZAI.create()
      const response = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a professional email writer for FrameMaxx Agency. Write concise, professional confirmation emails. Do not include subject line. Start directly with the greeting.",
          },
          {
            role: "user",
            content: `Write a professional registration confirmation email for ${firstName} ${lastName}. Their tracking ID is ${trackingId}. The email should:
1. Confirm their registration was received
2. Include their tracking ID prominently
3. Mention they can use the tracking ID to check their application status
4. Say the team will review and get back within 3-5 business days
5. Include a professional sign-off from FrameMaxx Agency
Keep it concise and professional.`,
          },
        ],
        thinking: { type: "disabled" },
      })
      emailContent = response.choices[0]?.message?.content || ""
    } catch (llmError) {
      console.error("LLM generation failed, using fallback template:", llmError)
      emailContent = generateFallbackEmailContent(firstName, lastName, trackingId)
    }

    if (!emailContent) {
      emailContent = generateFallbackEmailContent(firstName, lastName, trackingId)
    }

    // Generate HTML and text versions of the email
    const htmlContent = generateConfirmationEmailHtml({
      firstName,
      lastName,
      trackingId,
      emailContent,
    })

    const textContent = generateConfirmationEmailText({
      firstName,
      lastName,
      trackingId,
      emailContent,
    })

    // Send the email via Gmail SMTP
    const result = await sendEmail({
      to: email,
      subject: `FrameMaxx Registration Confirmation - ${trackingId}`,
      text: textContent,
      html: htmlContent,
    })

    return NextResponse.json({
      success: true,
      emailContent,
      trackingId,
      emailSent: result.success,
      emailMessage: result.message,
      isRealDelivery: result.isRealDelivery ?? false,
      needsSmtpConfig: !isRealDeliveryConfigured(),
      needsSmtpUser: isSmtpUserOnlyMissing(),
    })
  } catch (error) {
    console.error("Email confirmation error:", error)
    return NextResponse.json(
      { error: "Failed to generate confirmation email" },
      { status: 500 }
    )
  }
}
