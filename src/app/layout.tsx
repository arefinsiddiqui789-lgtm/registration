import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "FrameMaxx Registration Portal",
  description: "Professional registration portal for FrameMaxx Agency. Join our team and grow with us.",
  keywords: ["FrameMaxx", "Registration", "Agency", "Professional"],
  authors: [{ name: "FrameMaxx" }],
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased bg-background text-foreground font-[family-name:var(--font-poppins)]`}
      >
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
