import nodemailer from "nodemailer"

// Cache the Ethereal test account so we only create it once
let etherealAccount: {
  user: string
  pass: string
  web: string
} | null = null

// Known placeholder values that should NOT be treated as real credentials
const PLACEHOLDER_VALUES = new Set([
  "your-email@gmail.com",
  "your-16-char-app-password",
  "your-email",
  "your-password",
  "changeme",
  "xxx",
])

// Check if SMTP credentials look like real values (not placeholders)
function isRealSmtpConfigured(): boolean {
  const user = process.env.SMTP_USER || ""
  const pass = process.env.SMTP_PASS || ""
  if (!user || !pass) return false
  if (PLACEHOLDER_VALUES.has(user) || PLACEHOLDER_VALUES.has(pass)) return false
  if (user.includes("your-") || pass.includes("your-")) return false
  return true
}

// Create Ethereal test account (cached)
async function getEtherealAccount() {
  if (etherealAccount) return etherealAccount
  try {
    console.log("Creating Ethereal test email account...")
    etherealAccount = await nodemailer.createTestAccount()
    console.log("Ethereal account created:", etherealAccount.user)
    return etherealAccount
  } catch (err) {
    console.error("Failed to create Ethereal account:", err)
    return null
  }
}

// Create reusable transporter using SMTP
async function getTransporter() {
  // If real Gmail SMTP credentials are configured, use them
  if (isRealSmtpConfigured()) {
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com"
    const smtpPort = parseInt(process.env.SMTP_PORT || "587")
    const smtpUser = process.env.SMTP_USER!
    const smtpPass = process.env.SMTP_PASS!

    return {
      transporter: nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      }),
      fromEmail: smtpUser,
      fromName: process.env.SMTP_FROM_NAME || "FrameMaxx Agency",
      isEthereal: false,
    }
  }

  // No real SMTP configured — auto-create Ethereal test account
  const account = await getEtherealAccount()
  if (!account) return null

  return {
    transporter: nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    }),
    fromEmail: account.user,
    fromName: "FrameMaxx Agency",
    isEthereal: true,
  }
}

export interface SendEmailResult {
  success: boolean
  message: string
  messageId?: string
  previewUrl?: string
  isEthereal?: boolean
}

export interface SendEmailOptions {
  to: string
  subject: string
  text: string
  html: string
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions): Promise<SendEmailResult> {
  let config = await getTransporter()

  if (!config) {
    console.warn("No email transport available.")
    return {
      success: false,
      message: "No email transport available.",
    }
  }

  try {
    const info = await config.transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      text,
      html,
    })

    // Get the Ethereal preview URL
    const previewUrl = config.isEthereal ? nodemailer.getTestMessageUrl(info) : null

    if (config.isEthereal && previewUrl) {
      console.log("📧 Email sent via Ethereal. Preview at:", previewUrl)
    } else {
      console.log("📧 Email sent successfully:", info.messageId)
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || undefined,
      isEthereal: config.isEthereal,
      message: config.isEthereal
        ? "Email sent via test server"
        : "Email sent successfully",
    }
  } catch (error: unknown) {
    // If Gmail auth fails, try Ethereal as fallback
    if (!config.isEthereal) {
      console.warn("Gmail SMTP failed, falling back to Ethereal test email...")
      const account = await getEtherealAccount()
      if (account) {
        const fallbackTransporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: account.user,
            pass: account.pass,
          },
        })

        try {
          const info = await fallbackTransporter.sendMail({
            from: `"FrameMaxx Agency" <${account.user}>`,
            to,
            subject,
            text,
            html,
          })

          const previewUrl = nodemailer.getTestMessageUrl(info)
          console.log("📧 Email sent via Ethereal fallback. Preview at:", previewUrl)

          return {
            success: true,
            messageId: info.messageId,
            previewUrl: previewUrl || undefined,
            isEthereal: true,
            message: "Email sent via test server (Gmail auth failed)",
          }
        } catch (fallbackError) {
          console.error("Ethereal fallback also failed:", fallbackError)
        }
      }
    }

    console.error("Failed to send email:", error)
    const err = error as Error
    return {
      success: false,
      message: err.message || "Failed to send email.",
    }
  }
}

// Check if real SMTP (Gmail) is configured vs Ethereal fallback
export function isSmtpConfigured(): boolean {
  return isRealSmtpConfigured()
}

// Generate a beautiful HTML email template for registration confirmation
export function generateConfirmationEmailHtml({
  firstName,
  lastName,
  trackingId,
  emailContent,
}: {
  firstName: string
  lastName: string
  trackingId: string
  emailContent: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FrameMaxx Registration Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fef3c7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef3c7; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background-color: #0a1628; border-radius: 12px 12px 0 0; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 1px;">FrameMaxx</h1>
              <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">Professional Agency</p>
            </td>
          </tr>

          <!-- Tracking ID Banner -->
          <tr>
            <td style="background-color: #131d35; padding: 16px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #1e2a46; border: 1px solid #324164; border-radius: 8px; padding: 8px 20px;">
                    <p style="margin: 0; color: #94a3b8; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">Tracking ID</p>
                    <p style="margin: 2px 0 0 0; color: #e2e8f0; font-size: 16px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 1px;">${trackingId}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px;">
              <h2 style="margin: 0 0 8px 0; color: #0a1628; font-size: 20px;">Hello ${firstName} ${lastName},</h2>
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                ${emailContent.replace(/\n/g, "<br>")}
              </p>

              <!-- Tracking ID Reminder Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px 20px;">
                    <p style="margin: 0 0 4px 0; color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Tracking ID</p>
                    <p style="margin: 0; color: #0a1628; font-size: 22px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">${trackingId}</p>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                Please keep this tracking ID safe. You can use it to check the status of your application at any time.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0a1628; border-radius: 0 0 12px 12px; padding: 24px 40px; text-align: center;">
              <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 12px; font-weight: 600;">FrameMaxx Agency</p>
              <p style="margin: 0; color: #64748b; font-size: 11px;">This is an automated message. Please do not reply to this email.</p>
              <p style="margin: 4px 0 0 0; color: #475569; font-size: 10px;">&copy; ${new Date().getFullYear()} FrameMaxx Agency. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// Generate plain text version
export function generateConfirmationEmailText({
  firstName,
  lastName,
  trackingId,
  emailContent,
}: {
  firstName: string
  lastName: string
  trackingId: string
  emailContent: string
}): string {
  return `
FrameMaxx Agency - Registration Confirmation
==============================================

Hello ${firstName} ${lastName},

${emailContent}

==============================================
Your Tracking ID: ${trackingId}
==============================================

Please keep this tracking ID safe. You can use it to check the status of your application at any time.

--
FrameMaxx Agency
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} FrameMaxx Agency. All rights reserved.
  `.trim()
}
