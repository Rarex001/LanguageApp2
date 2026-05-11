import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'French Vocab',
  description: 'Build your French vocabulary',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
