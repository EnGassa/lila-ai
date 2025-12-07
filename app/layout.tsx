import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ClientPostHogProvider } from '@/components/ClientPostHogProvider'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Toaster } from '@/components/ui/sonner'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Lila.Skin',
  description: 'Your personalized skin analyis',
  generator: 'lila.skin',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={`font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientPostHogProvider>
            {children}
          </ClientPostHogProvider>
          <div className="fixed bottom-4 right-4">
            <ThemeToggle />
          </div>
        </ThemeProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
