"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Shield,
  UserPlus,
  FileCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Fingerprint,
  BadgeCheck,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

interface LandingPageProps {
  onStartRegistration: () => void
}

const features = [
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "Your data is encrypted and stored securely with industry-standard protection.",
  },
  {
    icon: UserPlus,
    title: "Easy Registration",
    desc: "Simple multi-step form guides you through the process seamlessly.",
  },
  {
    icon: FileCheck,
    title: "Instant PDF Document",
    desc: "Get a professional registration document with QR code immediately.",
  },
  {
    icon: Clock,
    title: "Quick Processing",
    desc: "Applications are reviewed within 3-5 business days.",
  },
]

const steps = [
  { step: 1, title: "Fill Your Details", desc: "Complete personal, contact & professional information" },
  { step: 2, title: "Upload Documents", desc: "Upload your photo, CV and identification" },
  { step: 3, title: "Sign & Submit", desc: "Review, digitally sign and submit your application" },
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
}

export function LandingPage({ onStartRegistration }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="FrameMaxx"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                FrameMaxx
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase leading-none">
                Registration Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              onClick={onStartRegistration}
              size="sm"
              className="bg-[var(--brand)] hover:bg-[var(--brand-light)] text-white font-medium"
            >
              Register Now
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--brand)]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[var(--gold)]/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 bg-[var(--brand)]/10 text-[var(--brand)] px-3 py-1 rounded-full text-xs font-medium mb-6">
                <BadgeCheck className="h-3.5 w-3.5" />
                Official Registration Portal
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                Join the{" "}
                <span className="text-[var(--brand)]">FrameMaxx</span>{" "}
                Team
              </h2>
              <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Begin your professional journey with FrameMaxx Agency.
                Complete your registration securely and receive your
                official confirmation document instantly.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={onStartRegistration}
                  size="lg"
                  className="bg-[var(--brand)] hover:bg-[var(--brand-light)] text-white font-semibold text-base px-8 h-12"
                >
                  Start Registration
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="font-medium text-base h-12"
                  onClick={() =>
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  How It Works
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Free to apply
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Secure process
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Instant document
                </span>
              </div>
            </motion.div>

            {/* Hero visual - decorative card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-[var(--brand)]/20 to-[var(--gold)]/20 rounded-3xl blur-2xl" />
                <Card className="relative glass border-border/50 shadow-xl">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-[var(--brand)] rounded-xl flex items-center justify-center">
                          <Image
                            src="/logo.png"
                            alt="FrameMaxx"
                            width={40}
                            height={40}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            Registration Preview
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Your document will look like this
                          </p>
                        </div>
                      </div>
                      {/* Mini A4 preview */}
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border shadow-sm">
                        <div className="border-b-2 border-[var(--brand)] pb-2 mb-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-[var(--brand)] rounded flex items-center justify-center text-white text-xs font-bold">
                                FM
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  FrameMaxx
                                </div>
                                <div className="text-[8px] text-slate-500">
                                  Professional Agency
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[9px] font-semibold text-slate-700 dark:text-slate-300 uppercase">
                                Registration
                              </div>
                              <div className="text-[8px] text-slate-400">
                                FMX-2026-XXXXX
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-1">
                              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                              <div className="h-3 bg-slate-100 dark:bg-slate-600 rounded w-full" />
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-2 border-t flex justify-between items-center">
                          <div className="h-6 w-24 bg-slate-100 dark:bg-slate-700 rounded" />
                          <div className="h-6 w-6 bg-slate-200 dark:bg-slate-600 rounded" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <motion.h3
              custom={0}
              variants={fadeUp}
              className="text-2xl sm:text-3xl font-bold text-foreground"
            >
              Why Register With Us?
            </motion.h3>
            <motion.p
              custom={1}
              variants={fadeUp}
              className="mt-3 text-muted-foreground max-w-2xl mx-auto"
            >
              FrameMaxx provides a seamless and secure registration experience
              with professional documentation.
            </motion.p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i + 2}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
              >
                <Card className="glass border-border/50 h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 bg-[var(--brand)]/10 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="h-5 w-5 text-[var(--brand)]" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
              How It Works
            </h3>
            <p className="mt-3 text-muted-foreground">
              Three simple steps to complete your registration
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="text-center"
              >
                <div className="w-14 h-14 bg-[var(--brand)] rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                  {item.step}
                </div>
                <h4 className="font-semibold text-foreground text-lg mb-2">
                  {item.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[var(--brand)] relative overflow-hidden">
        <div className="absolute inset-0 -z-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-[var(--gold)]/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Fingerprint className="h-12 w-12 text-white/80 mx-auto mb-6" />
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Join FrameMaxx?
          </h3>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            Complete your registration now and take the first step toward
            a professional partnership with FrameMaxx Agency.
          </p>
          <Button
            onClick={onStartRegistration}
            size="lg"
            className="bg-white text-[var(--brand)] hover:bg-white/90 font-semibold text-base px-8 h-12"
          >
            Start Your Registration
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="FrameMaxx"
                width={24}
                height={24}
                className="rounded"
              />
              <span className="text-sm font-semibold text-foreground">
                FrameMaxx
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} FrameMaxx Agency. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
