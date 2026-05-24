"use client"

import { useRegistrationStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion } from "framer-motion"
import { Briefcase } from "lucide-react"

const departments = [
  "Creative Design",
  "Digital Marketing",
  "Web Development",
  "Video Production",
  "Project Management",
  "Business Development",
  "Content Writing",
  "Social Media",
  "Human Resources",
  "Finance & Accounts",
  "Operations",
  "Other",
]

const experienceLevels = [
  "Less than 1 year",
  "1-2 years",
  "2-5 years",
  "5-10 years",
  "10+ years",
]

export function ProfessionalInfoStep() {
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
          <Briefcase className="h-5 w-5 text-[var(--brand)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Professional Information
          </h3>
          <p className="text-sm text-muted-foreground">
            Tell us about your professional background
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="occupation" className="text-sm font-medium">
            Occupation / Job Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="occupation"
            placeholder="e.g. Graphic Designer, Developer"
            value={data.occupation}
            onChange={(e) => update("occupation", e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company" className="text-sm font-medium">
            Current Company
          </Label>
          <Input
            id="company"
            placeholder="Enter company name"
            value={data.company}
            onChange={(e) => update("company", e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Experience Level <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.experience}
            onValueChange={(v) => update("experience", v)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              {experienceLevels.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Department of Interest <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.department}
            onValueChange={(v) => update("department", v)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="skills" className="text-sm font-medium">
            Skills & Expertise
          </Label>
          <Textarea
            id="skills"
            placeholder="List your key skills, tools, and areas of expertise (e.g. Adobe Creative Suite, React, Project Management)"
            value={data.skills}
            onChange={(e) => update("skills", e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>
      </div>
    </motion.div>
  )
}
