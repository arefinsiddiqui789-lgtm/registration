"use client"

import { useRegistrationStore } from "@/lib/store"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { FileUp, Upload, X, Image, FileText, CreditCard } from "lucide-react"
import { useCallback, useRef, useState } from "react"

interface FileWithPreview {
  file: File
  preview: string
}

function FileUploadField({
  label,
  description,
  accept,
  icon: Icon,
  fileData,
  onFileChange,
  onFileRemove,
}: {
  label: string
  description: string
  accept: string
  icon: React.ComponentType<{ className?: string }>
  fileData: FileWithPreview | null
  onFileChange: (file: File) => void
  onFileRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFileChange(file)
    },
    [onFileChange]
  )

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {!fileData ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-[var(--brand)] bg-[var(--brand)]/5"
              : "border-border hover:border-[var(--brand)]/50 hover:bg-muted/50"
          }`}
        >
          <div className="w-12 h-12 bg-[var(--brand)]/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Icon className="h-6 w-6 text-[var(--brand)]" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFileChange(file)
            }}
          />
        </div>
      ) : (
        <div className="border rounded-xl p-4 flex items-center gap-3 bg-muted/30">
          {fileData.preview ? (
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img
                src={fileData.preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-6 w-6 text-[var(--brand)]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {fileData.file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(fileData.file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onFileRemove()
            }}
            className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
          >
            <X className="h-4 w-4 text-destructive" />
          </button>
        </div>
      )}
    </div>
  )
}

export function DocumentUploadStep() {
  const { data, updateData } = useRegistrationStore()
  const [photoPreview, setPhotoPreview] = useState<FileWithPreview | null>(null)
  const [cvPreview, setCvPreview] = useState<FileWithPreview | null>(null)
  const [nidPreview, setNidPreview] = useState<FileWithPreview | null>(null)

  const handlePhotoChange = (file: File) => {
    const preview = URL.createObjectURL(file)
    setPhotoPreview({ file, preview })
    updateData({ photoFile: file })
  }

  const handleCvChange = (file: File) => {
    const isPdf = file.type === "application/pdf"
    setCvPreview({ file, preview: isPdf ? "" : URL.createObjectURL(file) })
    updateData({ cvFile: file })
  }

  const handleNidChange = (file: File) => {
    const isPdf = file.type === "application/pdf"
    setNidPreview({ file, preview: isPdf ? "" : URL.createObjectURL(file) })
    updateData({ nidPassportFile: file })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[var(--brand)]/10 rounded-lg flex items-center justify-center">
          <FileUp className="h-5 w-5 text-[var(--brand)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Document Upload
          </h3>
          <p className="text-sm text-muted-foreground">
            Upload required documents for verification
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <FileUploadField
          label="Profile Photo"
          description="Upload a recent passport-size photo (JPG, PNG, max 2MB)"
          accept="image/jpeg,image/png,image/webp"
          icon={Image}
          fileData={photoPreview}
          onFileChange={handlePhotoChange}
          onFileRemove={() => {
            setPhotoPreview(null)
            updateData({ photoFile: null })
          }}
        />

        <FileUploadField
          label="Curriculum Vitae (CV)"
          description="Upload your CV or resume (PDF, max 5MB)"
          accept="application/pdf"
          icon={FileText}
          fileData={cvPreview}
          onFileChange={handleCvChange}
          onFileRemove={() => {
            setCvPreview(null)
            updateData({ cvFile: null })
          }}
        />

        <FileUploadField
          label={`${data.nidPassportType === "Passport" ? "Passport" : "National ID"} Copy`}
          description={`Upload a copy of your ${data.nidPassportType === "Passport" ? "passport" : "NID"} (PDF or image, max 5MB)`}
          accept="application/pdf,image/jpeg,image/png"
          icon={CreditCard}
          fileData={nidPreview}
          onFileChange={handleNidChange}
          onFileRemove={() => {
            setNidPreview(null)
            updateData({ nidPassportFile: null })
          }}
        />
      </div>
    </motion.div>
  )
}
