"use client"

import { useRegistrationStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion } from "framer-motion"
import { User } from "lucide-react"

const genders = ["Male", "Female", "Non-binary", "Prefer not to say"]
const nationalities = [
  "Bangladeshi", "American", "British", "Canadian", "Australian",
  "Indian", "Pakistani", "Sri Lankan", "Nepalese", "Malaysian",
  "Singaporean", "Japanese", "Chinese", "South Korean", "German",
  "French", "Italian", "Spanish", "Brazilian", "Mexican", "Other",
]

export function PersonalInfoStep() {
  const { data, updateData } = useRegistrationStore()

  const update = (field: string, value: string) => {
    updateData({ [field]: value })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[var(--brand)]/10 rounded-lg flex items-center justify-center">
          <User className="h-5 w-5 text-[var(--brand)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Personal Information
          </h3>
          <p className="text-sm text-muted-foreground">
            Provide your basic personal details
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            placeholder="Enter your first name"
            value={data.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            placeholder="Enter your last name"
            value={data.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth" className="text-sm font-medium">
            Date of Birth <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => update("dateOfBirth", e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Gender <span className="text-destructive">*</span>
          </Label>
          <Select value={data.gender} onValueChange={(v) => update("gender", v)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {genders.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Nationality <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.nationality}
            onValueChange={(v) => update("nationality", v)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select nationality" />
            </SelectTrigger>
            <SelectContent>
              {nationalities.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            ID Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.nidPassportType}
            onValueChange={(v) => update("nidPassportType", v)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select ID type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NID">National ID (NID)</SelectItem>
              <SelectItem value="Passport">Passport</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nidPassportNumber" className="text-sm font-medium">
            {data.nidPassportType === "Passport" ? "Passport" : "NID"} Number{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nidPassportNumber"
            placeholder={`Enter your ${data.nidPassportType === "Passport" ? "passport" : "NID"} number`}
            value={data.nidPassportNumber}
            onChange={(e) => update("nidPassportNumber", e.target.value)}
            className="h-11"
          />
        </div>
      </div>
    </motion.div>
  )
}
