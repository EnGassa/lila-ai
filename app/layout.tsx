import type { Metadata, Viewport } from 'next'

const APP_NAME = "Lila Skin";
const APP_DEFAULT_TITLE = "Lila Skin";
const APP_TITLE_TEMPLATE = "%s - Lila Skin";
const APP_DESCRIPTION = "Your personalized skin analysis";
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ClientPostHogProvider } from '@/components/ClientPostHogProvider'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Toaster } from '@/components/ui/sonner'
import { Theme } from '@radix-ui/themes'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _playfair = Playfair_Display({
  subsets: ["latin"],
  variable: '--font-playfair'
});

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  themeColor: "#F2F0E9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`font-sans antialiased bg-background text-foreground ${_playfair.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Theme
            accentColor="red"
            grayColor="sand"
            panelBackground="translucent"
            radius="large"
            scaling="110%"
          >
            <ClientPostHogProvider>
              {children}
            </ClientPostHogProvider>
            <div className="fixed bottom-4 right-4">
              <ThemeToggle />
            </div>
          </Theme>
        </ThemeProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
