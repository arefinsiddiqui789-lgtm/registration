/**
 * WhatsApp Notification via CallMeBot API
 *
 * Setup (one-time):
 * 1. Add +34 644 52 74 88 to your WhatsApp contacts
 * 2. Send this message: "I allow callmebot to send me messages"
 * 3. You'll receive an API key — add it to .env as WHATSAPP_APIKEY
 *
 * API docs: https://www.callmebot.com/blog/free-api-whatsapp-messages/
 */

const CALLMEBOT_URL = "https://api.callmebot.com/whatsapp.php"

export interface WhatsAppConfig {
  phone: string
  apiKey: string
}

export function isWhatsAppConfigured(): boolean {
  const phone = process.env.WHATSAPP_PHONE?.trim() || ""
  const apiKey = process.env.WHATSAPP_APIKEY?.trim() || ""
  return !!phone && !!apiKey
}

function getConfig(): WhatsAppConfig | null {
  const phone = process.env.WHATSAPP_PHONE?.trim() || ""
  const apiKey = process.env.WHATSAPP_APIKEY?.trim() || ""
  if (!phone || !apiKey) return null
  return { phone, apiKey }
}

// Format phone number to international format (remove leading 0, add country code)
function formatPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-+]/g, "")
  // Bangladesh: 01701659879 → 8801701659879
  if (cleaned.startsWith("0") && cleaned.length >= 10) {
    cleaned = "88" + cleaned
  }
  return cleaned
}

export interface WhatsAppResult {
  success: boolean
  message: string
}

// Send a text message to WhatsApp
export async function sendWhatsAppText(
  text: string
): Promise<WhatsAppResult> {
  const config = getConfig()
  if (!config) {
    return { success: false, message: "WhatsApp not configured" }
  }

  try {
    const phone = formatPhone(config.phone)
    const url = `${CALLMEBOT_URL}?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${config.apiKey}`

    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(15000),
    })

    const body = await response.text()

    if (response.ok && !body.toLowerCase().includes("error")) {
      console.log("📱 WhatsApp message sent to", config.phone)
      return { success: true, message: "WhatsApp notification sent" }
    } else {
      console.error("WhatsApp API error:", body)
      return { success: false, message: `WhatsApp error: ${body}` }
    }
  } catch (error: unknown) {
    const err = error as Error
    console.error("WhatsApp send failed:", err.message)
    return { success: false, message: `WhatsApp failed: ${err.message}` }
  }
}

// Send an image to WhatsApp (image must be publicly accessible URL)
export async function sendWhatsAppImage(
  imageUrl: string,
  caption: string
): Promise<WhatsAppResult> {
  const config = getConfig()
  if (!config) {
    return { success: false, message: "WhatsApp not configured" }
  }

  try {
    const phone = formatPhone(config.phone)
    const url = `${CALLMEBOT_URL}?phone=${phone}&text=${encodeURIComponent(caption)}&apikey=${config.apiKey}&image=${encodeURIComponent(imageUrl)}`

    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(15000),
    })

    const body = await response.text()

    if (response.ok && !body.toLowerCase().includes("error")) {
      console.log("📱 WhatsApp image sent to", config.phone)
      return { success: true, message: "WhatsApp image sent" }
    } else {
      console.error("WhatsApp image error:", body)
      return { success: false, message: `WhatsApp image error: ${body}` }
    }
  } catch (error: unknown) {
    const err = error as Error
    console.error("WhatsApp image send failed:", err.message)
    return { success: false, message: `WhatsApp image failed: ${err.message}` }
  }
}

// Send full registration notification to WhatsApp
export async function sendRegistrationNotification({
  firstName,
  lastName,
  email,
  phone,
  trackingId,
  photoUrl,
  cvUrl,
  nidUrl,
  host,
}: {
  firstName: string
  lastName: string
  email: string
  phone: string
  trackingId: string
  photoUrl: string | null
  cvUrl: string | null
  nidUrl: string | null
  host: string
}): Promise<WhatsAppResult> {
  // Build the text message
  const fileLinks: string[] = []
  if (photoUrl) fileLinks.push(`📸 Photo: https://${host}${photoUrl}`)
  if (cvUrl) fileLinks.push(`📄 CV: https://${host}${cvUrl}`)
  if (nidUrl) fileLinks.push(`🪪 NID/Passport: https://${host}${nidUrl}`)

  const message = `🆕 *New FrameMaxx Registration!*

📋 *Details:*
👤 Name: ${firstName} ${lastName}
📧 Email: ${email}
📱 Phone: ${phone}
🏷️ Tracking ID: ${trackingId}

📎 *Uploaded Files:*
${fileLinks.length > 0 ? fileLinks.join("\n") : "No files uploaded"}

⏰ ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}`

  // Send text message with registration details
  const textResult = await sendWhatsAppText(message)

  // If photo exists, also try to send it as an image
  if (photoUrl && host) {
    const fullPhotoUrl = `https://${host}${photoUrl}`
    // Send photo as image (don't await - send in background)
    sendWhatsAppImage(fullPhotoUrl, `📸 ${firstName} ${lastName} - Profile Photo`).catch(() => {
      // Non-critical - image send is best effort
    })
  }

  return textResult
}
