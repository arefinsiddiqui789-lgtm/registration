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
import { Phone } from "lucide-react"

const countries = [
  "Bangladesh", "United States", "United Kingdom", "Canada", "Australia",
  "India", "Pakistan", "Sri Lanka", "Nepal", "Malaysia",
  "Singapore", "Japan", "China", "South Korea", "Germany",
  "France", "Italy", "Spain", "Brazil", "Mexico", "Other",
]

export function ContactInfoStep() {
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
          <Phone className="h-5 w-5 text-[var(--brand)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Contact Information
          </h3>
          <p className="text-sm text-muted-foreground">
            How we can reach you
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+880 1XXX-XXXXXX"
            value={data.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address" className="text-sm font-medium">
            Street Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="address"
            placeholder="House, Road, Area"
            value={data.address}
            onChange={(e) => update("address", e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm font-medium">
            City <span className="text-destructive">*</span>
          </Label>
          <Input
            id="city"
            placeholder="Enter city"
            value={data.city}
            onChange={(e) => update("city", e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state" className="text-sm font-medium">
            State / Division
          </Label>
          <Input
            id="state"
            placeholder="Enter state or division"
            value={data.state}
            onChange={(e) => update("state", e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode" className="text-sm font-medium">
            Postal Code
          </Label>
          <Input
            id="postalCode"
            placeholder="Enter postal code"
            value={data.postalCode}
            onChange={(e) => update("postalCode", e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Country <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.country}
            onValueChange={(v) => update("country", v)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  )
}
