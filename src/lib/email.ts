import nodemailer from "nodemailer"

// Create reusable transporter using SMTP
const getTransporter = () => {
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com"
  const smtpPort = parseInt(process.env.SMTP_PORT || "587")
  const smtpUser = process.env.SMTP_USER || ""
  const smtpPass = process.env.SMTP_PASS || ""

  if (!smtpUser || !smtpPass) {
    return null
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })
}

export interface SendEmailOptions {
  to: string
  subject: string
  text: string
  html: string
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  const transporter = getTransporter()

  if (!transporter) {
    console.warn("SMTP not configured. Email would have been sent to:", to)
    return {
      success: false,
      message: "SMTP not configured. Set SMTP_USER and SMTP_PASS environment variables.",
    }
  }

  const fromEmail = process.env.SMTP_USER || "noreply@framemaxx.com"
  const fromName = process.env.SMTP_FROM_NAME || "FrameMaxx Agency"

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text,
      html,
    })

    console.log("Email sent successfully:", info.messageId)
    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error("Failed to send email:", error)
    return {
      success: false,
      message: "Failed to send email. Check SMTP configuration.",
    }
  }
}

// Check if SMTP is configured
export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS)
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
