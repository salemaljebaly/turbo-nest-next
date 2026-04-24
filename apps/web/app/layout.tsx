import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DirectionProvider } from "@/components/ui/direction";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "turbo-nest-next",
    template: "%s | turbo-nest-next",
  },
  description:
    "Production-ready full-stack monorepo template with NestJS, Next.js, Better Auth, Drizzle ORM, PostgreSQL, and Redis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
        )}
      >
        <DirectionProvider direction="rtl">
          <Providers>{children}</Providers>
        </DirectionProvider>
      </body>
    </html>
  );
}
