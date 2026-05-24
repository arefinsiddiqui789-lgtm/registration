import { create } from "zustand"

export interface RegistrationData {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  nationality: string
  nidPassportType: string
  nidPassportNumber: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  occupation: string
  company: string
  experience: string
  skills: string
  department: string
  photoFile: File | null
  cvFile: File | null
  nidPassportFile: File | null
  signatureData: string
  agreeToTerms: boolean
  agreeToPrivacy: boolean
}

export interface RegistrationState {
  currentStep: number
  data: RegistrationData
  trackingId: string | null
  isSubmitting: boolean
  isSubmitted: boolean
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  updateData: (partial: Partial<RegistrationData>) => void
  setTrackingId: (id: string) => void
  setSubmitting: (val: boolean) => void
  setSubmitted: (val: boolean) => void
  reset: () => void
}

const initialData: RegistrationData = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  nationality: "",
  nidPassportType: "NID",
  nidPassportNumber: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  occupation: "",
  company: "",
  experience: "",
  skills: "",
  department: "",
  photoFile: null,
  cvFile: null,
  nidPassportFile: null,
  signatureData: "",
  agreeToTerms: false,
  agreeToPrivacy: false,
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  currentStep: 0,
  data: { ...initialData },
  trackingId: null,
  isSubmitting: false,
  isSubmitted: false,
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
  updateData: (partial) =>
    set((state) => ({ data: { ...state.data, ...partial } })),
  setTrackingId: (id) => set({ trackingId: id }),
  setSubmitting: (val) => set({ isSubmitting: val }),
  setSubmitted: (val) => set({ isSubmitted: val }),
  reset: () =>
    set({
      currentStep: 0,
      data: { ...initialData },
      trackingId: null,
      isSubmitting: false,
      isSubmitted: false,
    }),
}))
