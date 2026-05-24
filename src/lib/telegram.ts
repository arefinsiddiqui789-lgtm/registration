/**
 * Telegram Bot Notification
 *
 * Sends registration details + files (photo, CV, NID) directly to your Telegram.
 *
 * Setup (one-time, 2 minutes):
 * 1. Open Telegram, search for @BotFather
 * 2. Send /newbot → follow prompts → get your Bot Token
 * 3. Send a message to your new bot
 * 4. Visit https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates to get your Chat ID
 * 5. Add both to .env: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
 *
 * This is 100% FREE, unlimited messages, and works instantly!
 */

export function isTelegramConfigured(): boolean {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim() || ""
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim() || ""
  return !!token && !!chatId
}

function getBotToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || ""
}

function getChatId(): string {
  return process.env.TELEGRAM_CHAT_ID?.trim() || ""
}

export interface TelegramResult {
  success: boolean
  message: string
}

// Send a text message
export async function sendTelegramMessage(text: string): Promise<TelegramResult> {
  if (!isTelegramConfigured()) {
    return { success: false, message: "Telegram not configured" }
  }

  try {
    const url = `https://api.telegram.org/bot${getBotToken()}/sendMessage`
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: getChatId(),
        text,
        parse_mode: "Markdown",
      }),
      signal: AbortSignal.timeout(15000),
    })

    const data = await response.json()

    if (data.ok) {
      console.log("📱 Telegram message sent")
      return { success: true, message: "Telegram notification sent" }
    } else {
      console.error("Telegram API error:", data.description)
      return { success: false, message: `Telegram error: ${data.description}` }
    }
  } catch (error: unknown) {
    const err = error as Error
    console.error("Telegram send failed:", err.message)
    return { success: false, message: `Telegram failed: ${err.message}` }
  }
}

// Send a photo (from public URL or local file path)
export async function sendTelegramPhoto(
  photoUrl: string,
  caption: string
): Promise<TelegramResult> {
  if (!isTelegramConfigured()) {
    return { success: false, message: "Telegram not configured" }
  }

  try {
    const url = `https://api.telegram.org/bot${getBotToken()}/sendPhoto`
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: getChatId(),
        photo: photoUrl,
        caption,
        parse_mode: "Markdown",
      }),
      signal: AbortSignal.timeout(15000),
    })

    const data = await response.json()

    if (data.ok) {
      console.log("📱 Telegram photo sent")
      return { success: true, message: "Telegram photo sent" }
    } else {
      console.error("Telegram photo error:", data.description)
      return { success: false, message: `Telegram photo error: ${data.description}` }
    }
  } catch (error: unknown) {
    const err = error as Error
    console.error("Telegram photo send failed:", err.message)
    return { success: false, message: `Telegram photo failed: ${err.message}` }
  }
}

// Send a document (PDF, etc.) from public URL
export async function sendTelegramDocument(
  documentUrl: string,
  caption: string
): Promise<TelegramResult> {
  if (!isTelegramConfigured()) {
    return { success: false, message: "Telegram not configured" }
  }

  try {
    const url = `https://api.telegram.org/bot${getBotToken()}/sendDocument`
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: getChatId(),
        document: documentUrl,
        caption,
        parse_mode: "Markdown",
      }),
      signal: AbortSignal.timeout(15000),
    })

    const data = await response.json()

    if (data.ok) {
      console.log("📱 Telegram document sent")
      return { success: true, message: "Telegram document sent" }
    } else {
      console.error("Telegram document error:", data.description)
      return { success: false, message: `Telegram document error: ${data.description}` }
    }
  } catch (error: unknown) {
    const err = error as Error
    console.error("Telegram document send failed:", err.message)
    return { success: false, message: `Telegram document failed: ${err.message}` }
  }
}

// Send full registration notification with all files
export async function sendRegistrationNotification({
  firstName,
  lastName,
  email,
  phone,
  trackingId,
  department,
  occupation,
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
  department: string
  occupation: string
  photoUrl: string | null
  cvUrl: string | null
  nidUrl: string | null
  host: string
}): Promise<TelegramResult> {
  // 1. Send the text message with registration details
  const fileLinks: string[] = []
  if (photoUrl) fileLinks.push(`📸 Photo: https://${host}${photoUrl}`)
  if (cvUrl) fileLinks.push(`📄 CV: https://${host}${cvUrl}`)
  if (nidUrl) fileLinks.push(`🪪 NID/Passport: https://${host}${nidUrl}`)

  const message = `🆕 *New FrameMaxx Registration!*

📋 *Details:*
👤 Name: ${firstName} ${lastName}
📧 Email: ${email}
📱 Phone: ${phone}
💼 Occupation: ${occupation || "N/A"}
🏢 Department: ${department || "N/A"}
🏷️ Tracking ID: \`${trackingId}\`

📎 *Uploaded Files:*
${fileLinks.length > 0 ? fileLinks.join("\n") : "No files uploaded"}

⏰ ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}`

  const textResult = await sendTelegramMessage(message)
  if (!textResult.success) return textResult

  // 2. Send photo as image
  if (photoUrl) {
    await sendTelegramPhoto(
      `https://${host}${photoUrl}`,
      `📸 ${firstName} ${lastName} - Profile Photo\n🏷️ ${trackingId}`
    ).catch(() => {})
  }

  // 3. Send CV as document
  if (cvUrl) {
    await sendTelegramDocument(
      `https://${host}${cvUrl}`,
      `📄 ${firstName} ${lastName} - CV\n🏷️ ${trackingId}`
    ).catch(() => {})
  }

  // 4. Send NID/Passport as document
  if (nidUrl) {
    await sendTelegramDocument(
      `https://${host}${nidUrl}`,
      `🪪 ${firstName} ${lastName} - NID/Passport\n🏷️ ${trackingId}`
    ).catch(() => {})
  }

  return textResult
}
