/**
 * Telegram Bot Notification
 *
 * Sends registration details + files (photo, CV, NID, PDF) directly to your Telegram
 * Uses multipart/form-data with proper Buffer handling — works on both local and Vercel!
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

// Build multipart/form-data body manually for maximum compatibility
function buildMultipartBody(fields: { name: string; value: string | Buffer; filename?: string; contentType?: string }[]): { body: Uint8Array; contentType: string } {
  const boundary = "----FormBoundary" + Math.random().toString(36).substring(2)
  const parts: Uint8Array[] = []
  const encoder = new TextEncoder()

  for (const field of fields) {
    // Add boundary
    parts.push(encoder.encode(`--${boundary}\r\n`))

    if (field.value instanceof Buffer || field.value instanceof Uint8Array) {
      // Binary field
      const filename = field.filename || "file"
      const contentType = field.contentType || "application/octet-stream"
      parts.push(encoder.encode(
        `Content-Disposition: form-data; name="${field.name}"; filename="${filename}"\r\n` +
        `Content-Type: ${contentType}\r\n\r\n`
      ))
      parts.push(new Uint8Array(field.value))
      parts.push(encoder.encode("\r\n"))
    } else {
      // Text field
      parts.push(encoder.encode(
        `Content-Disposition: form-data; name="${field.name}"\r\n\r\n` +
        `${field.value}\r\n`
      ))
    }
  }

  // Final boundary
  parts.push(encoder.encode(`--${boundary}--\r\n`))

  // Combine all parts
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0)
  const body = new Uint8Array(totalLength)
  let offset = 0
  for (const part of parts) {
    body.set(part, offset)
    offset += part.length
  }

  return {
    body,
    contentType: `multipart/form-data; boundary=${boundary}`,
  }
}

// Get MIME type from file extension
function getMimeType(ext: string): string {
  const mimeMap: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    pdf: "application/pdf",
    gif: "image/gif",
    bin: "application/octet-stream",
  }
  return mimeMap[ext.toLowerCase()] || "application/octet-stream"
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
    const ext = filename.split(".").pop() || "png"
    const { body, contentType } = buildMultipartBody([
      { name: "chat_id", value: getChatId() },
      { name: "photo", value: buffer, filename, contentType: getMimeType(ext) },
      { name: "caption", value: caption },
      { name: "parse_mode", value: "Markdown" },
    ])

    const url = `https://api.telegram.org/bot${getBotToken()}/sendPhoto`
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body,
      signal: AbortSignal.timeout(60000), // 60s for large files
    })

    const data = await response.json()

    if (data.ok) {
      console.log("📱 Telegram photo sent as image:", filename)
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
    const ext = filename.split(".").pop() || "pdf"
    const { body, contentType } = buildMultipartBody([
      { name: "chat_id", value: getChatId() },
      { name: "document", value: buffer, filename, contentType: getMimeType(ext) },
      { name: "caption", value: caption },
      { name: "parse_mode", value: "Markdown" },
    ])

    const url = `https://api.telegram.org/bot${getBotToken()}/sendDocument`
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body,
      signal: AbortSignal.timeout(60000), // 60s for large files
    })

    const data = await response.json()

    if (data.ok) {
      console.log("📱 Telegram document sent:", filename)
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
    console.log(`📱 Sending PDF to Telegram (${(pdfBuffer.length / 1024).toFixed(1)} KB)...`)
    await sendTelegramDocumentBuffer(
      pdfBuffer,
      `${trackingId}-registration.pdf`,
      `📑 ${firstName} ${lastName} - Registration Certificate\n🏷️ ${trackingId}`
    ).catch((err) => console.error("PDF send error:", err))
  }

  // 3. Send photo as image
  if (photoBuffer) {
    console.log(`📱 Sending photo to Telegram (${(photoBuffer.length / 1024).toFixed(1)} KB, ${photoExt})...`)
    await sendTelegramPhotoBuffer(
      photoBuffer,
      `${trackingId}-photo.${photoExt}`,
      `📸 ${firstName} ${lastName} - Profile Photo\n🏷️ ${trackingId}`
    ).catch((err) => console.error("Photo send error:", err))
  }

  // 4. Send CV as document
  if (cvBuffer) {
    console.log(`📱 Sending CV to Telegram (${(cvBuffer.length / 1024).toFixed(1)} KB, ${cvExt})...`)
    await sendTelegramDocumentBuffer(
      cvBuffer,
      `${trackingId}-cv.${cvExt}`,
      `📄 ${firstName} ${lastName} - CV\n🏷️ ${trackingId}`
    ).catch((err) => console.error("CV send error:", err))
  }

  // 5. Send NID/Passport
  if (nidBuffer) {
    const isImage = ["png", "jpg", "jpeg", "webp"].includes(nidExt.toLowerCase())
    console.log(`📱 Sending NID/Passport to Telegram (${(nidBuffer.length / 1024).toFixed(1)} KB, ${nidExt})...`)
    if (isImage) {
      await sendTelegramPhotoBuffer(
        nidBuffer,
        `${trackingId}-nid-passport.${nidExt}`,
        `🪪 ${firstName} ${lastName} - NID/Passport\n🏷️ ${trackingId}`
      ).catch((err) => console.error("NID send error:", err))
    } else {
      await sendTelegramDocumentBuffer(
        nidBuffer,
        `${trackingId}-nid-passport.${nidExt}`,
        `🪪 ${firstName} ${lastName} - NID/Passport\n🏷️ ${trackingId}`
      ).catch((err) => console.error("NID send error:", err))
    }
  }

  return textResult
}
