import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { DirectionProvider } from "@/components/ui/direction";
import { dirForLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

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
  const direction = dirForLocale("en");

  return (
    <html
      lang="en"
      dir={direction}
      suppressHydrationWarning
      className={cn("font-mono", jetbrainsMono.variable)}
    >
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
        )}
      >
        <DirectionProvider direction={direction}>
          <Providers>{children}</Providers>
        </DirectionProvider>
      </body>
    </html>
  );
}
