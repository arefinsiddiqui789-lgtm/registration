/**
 * Telegram Bot Notification
 *
 * Sends registration details + files (photo, CV, NID) directly to your Telegram
 * using multipart/form-data file uploads — files are sent directly from the server,
 * no public URLs needed!
 *
 * Setup (one-time, 2 minutes):
 * 1. Open Telegram, search for @BotFather
 * 2. Send /newbot → follow prompts → get your Bot Token
 * 3. Send a message to your new bot
 * 4. Visit https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates to get your Chat ID
 * 5. Add both to .env: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
 *
 * 100% FREE, unlimited messages, works instantly!
 */

import { readFileSync } from "fs"
import { join } from "path"

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

// Send a photo by uploading the file directly from the server filesystem
export async function sendTelegramPhotoFile(
  filePath: string,
  caption: string
): Promise<TelegramResult> {
  if (!isTelegramConfigured()) {
    return { success: false, message: "Telegram not configured" }
  }

  try {
    const fileBuffer = readFileSync(filePath)
    const filename = filePath.split("/").pop() || "photo.png"

    const formData = new FormData()
    formData.append("chat_id", getChatId())
    formData.append("photo", new Blob([fileBuffer]), filename)
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

// Send a document (PDF, etc.) by uploading the file directly from the server filesystem
export async function sendTelegramDocumentFile(
  filePath: string,
  caption: string
): Promise<TelegramResult> {
  if (!isTelegramConfigured()) {
    return { success: false, message: "Telegram not configured" }
  }

  try {
    const fileBuffer = readFileSync(filePath)
    const filename = filePath.split("/").pop() || "document.pdf"

    const formData = new FormData()
    formData.append("chat_id", getChatId())
    formData.append("document", new Blob([fileBuffer]), filename)
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

// Send full registration notification with all files uploaded directly
export async function sendRegistrationNotification({
  firstName,
  lastName,
  email,
  phone,
  trackingId,
  department,
  occupation,
  photoPath,
  cvPath,
  nidPath,
}: {
  firstName: string
  lastName: string
  email: string
  phone: string
  trackingId: string
  department: string
  occupation: string
  photoPath: string | null
  cvPath: string | null
  nidPath: string | null
}): Promise<TelegramResult> {
  // 1. Send the text message with registration details
  const uploadsInfo: string[] = []
  if (photoPath) uploadsInfo.push("📸 Profile Photo (image)")
  if (cvPath) uploadsInfo.push("📄 CV (document)")
  if (nidPath) uploadsInfo.push("🪪 NID/Passport (document)")

  const message = `🆕 *New FrameMaxx Registration!*

📋 *Details:*
👤 Name: ${firstName} ${lastName}
📧 Email: ${email}
📱 Phone: ${phone}
💼 Occupation: ${occupation || "N/A"}
🏢 Department: ${department || "N/A"}
🏷️ Tracking ID: \`${trackingId}\`

📎 *Uploaded Files:*
${uploadsInfo.length > 0 ? uploadsInfo.join("\n") : "No files uploaded"}

⏰ ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}`

  const textResult = await sendTelegramMessage(message)
  if (!textResult.success) return textResult

  const uploadsDir = join(process.cwd(), "public")

  // 2. Send photo as image (shows as picture in Telegram)
  if (photoPath) {
    const fullPath = join(uploadsDir, photoPath)
    await sendTelegramPhotoFile(
      fullPath,
      `📸 ${firstName} ${lastName} - Profile Photo\n🏷️ ${trackingId}`
    ).catch(() => {})
  }

  // 3. Send CV as document
  if (cvPath) {
    const fullPath = join(uploadsDir, cvPath)
    await sendTelegramDocumentFile(
      fullPath,
      `📄 ${firstName} ${lastName} - CV\n🏷️ ${trackingId}`
    ).catch(() => {})
  }

  // 4. Send NID/Passport — if image, send as photo; if PDF, send as document
  if (nidPath) {
    const fullPath = join(uploadsDir, nidPath)
    const ext = nidPath.toLowerCase().split(".").pop()
    if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp") {
      await sendTelegramPhotoFile(
        fullPath,
        `🪪 ${firstName} ${lastName} - NID/Passport\n🏷️ ${trackingId}`
      ).catch(() => {})
    } else {
      await sendTelegramDocumentFile(
        fullPath,
        `🪪 ${firstName} ${lastName} - NID/Passport\n🏷️ ${trackingId}`
      ).catch(() => {})
    }
  }

  return textResult
}
