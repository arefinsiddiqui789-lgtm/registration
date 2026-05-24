/**
 * Telegram Bot Notification
 *
 * Sends registration details + files (photo, CV, NID, PDF) directly to your Telegram
 * using multipart/form-data file uploads via Buffer — works on both local and Vercel!
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

// Send a photo from a Buffer (works on Vercel and local)
export async function sendTelegramPhotoBuffer(
  buffer: Buffer,
  filename: string,
  caption: string
): Promise<TelegramResult> {
  if (!isTelegramConfigured()) {
    return { success: false, message: "Telegram not configured" }
  }

  try {
    const formData = new FormData()
    formData.append("chat_id", getChatId())
    formData.append("photo", new Blob([buffer]), filename)
    formData.append("caption", caption)
    formData.append("parse_mode", "Markdown")

    const url = `https://api.telegram.org/bot${getBotToken()}/sendPhoto`
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(30000),
    })

    const data = await response.json()

    if (data.ok) {
      console.log("📱 Telegram photo sent as image")
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

// Send a document from a Buffer (works on Vercel and local)
export async function sendTelegramDocumentBuffer(
  buffer: Buffer,
  filename: string,
  caption: string
): Promise<TelegramResult> {
  if (!isTelegramConfigured()) {
    return { success: false, message: "Telegram not configured" }
  }

  try {
    const formData = new FormData()
    formData.append("chat_id", getChatId())
    formData.append("document", new Blob([buffer]), filename)
    formData.append("caption", caption)
    formData.append("parse_mode", "Markdown")

    const url = `https://api.telegram.org/bot${getBotToken()}/sendDocument`
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(30000),
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

// Send full registration notification — uses buffers only (works on both Vercel and local)
export async function sendRegistrationNotification({
  firstName,
  lastName,
  email,
  phone,
  trackingId,
  department,
  occupation,
  photoBuffer,
  photoExt,
  cvBuffer,
  cvExt,
  nidBuffer,
  nidExt,
  pdfBuffer,
}: {
  firstName: string
  lastName: string
  email: string
  phone: string
  trackingId: string
  department: string
  occupation: string
  photoBuffer: Buffer | null
  photoExt: string
  cvBuffer: Buffer | null
  cvExt: string
  nidBuffer: Buffer | null
  nidExt: string
  pdfBuffer: Buffer | null
  // Legacy path params (ignored, kept for compatibility)
  photoPath?: string | null
  cvPath?: string | null
  nidPath?: string | null
}): Promise<TelegramResult> {
  // 1. Send the text message with registration details
  const uploadsInfo: string[] = []
  if (pdfBuffer) uploadsInfo.push("📑 Registration PDF")
  if (photoBuffer) uploadsInfo.push("📸 Profile Photo")
  if (cvBuffer) uploadsInfo.push("📄 CV")
  if (nidBuffer) uploadsInfo.push("🪪 NID/Passport")

  const message = `🆕 *New FrameMaxx Registration!*

📋 *Details:*
👤 Name: ${firstName} ${lastName}
📧 Email: ${email}
📱 Phone: ${phone}
💼 Occupation: ${occupation || "N/A"}
🏢 Department: ${department || "N/A"}
🏷️ Tracking ID: \`${trackingId}\`

📎 *Attached Files:*
${uploadsInfo.length > 0 ? uploadsInfo.join("\n") : "No files uploaded"}

⏰ ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}`

  const textResult = await sendTelegramMessage(message)
  if (!textResult.success) return textResult

  // 2. Send the Registration PDF (most important)
  if (pdfBuffer) {
    await sendTelegramDocumentBuffer(
      pdfBuffer,
      `${trackingId}-registration.pdf`,
      `📑 ${firstName} ${lastName} - Registration Certificate\n🏷️ ${trackingId}`
    ).catch(() => {})
  }

  // 3. Send photo as image
  if (photoBuffer) {
    await sendTelegramPhotoBuffer(
      photoBuffer,
      `${trackingId}-photo.${photoExt}`,
      `📸 ${firstName} ${lastName} - Profile Photo\n🏷️ ${trackingId}`
    ).catch(() => {})
  }

  // 4. Send CV as document
  if (cvBuffer) {
    await sendTelegramDocumentBuffer(
      cvBuffer,
      `${trackingId}-cv.${cvExt}`,
      `📄 ${firstName} ${lastName} - CV\n🏷️ ${trackingId}`
    ).catch(() => {})
  }

  // 5. Send NID/Passport
  if (nidBuffer) {
    const isImage = ["png", "jpg", "jpeg", "webp"].includes(nidExt)
    if (isImage) {
      await sendTelegramPhotoBuffer(
        nidBuffer,
        `${trackingId}-nid-passport.${nidExt}`,
        `🪪 ${firstName} ${lastName} - NID/Passport\n🏷️ ${trackingId}`
      ).catch(() => {})
    } else {
      await sendTelegramDocumentBuffer(
        nidBuffer,
        `${trackingId}-nid-passport.${nidExt}`,
        `🪪 ${firstName} ${lastName} - NID/Passport\n🏷️ ${trackingId}`
      ).catch(() => {})
    }
  }

  return textResult
}
