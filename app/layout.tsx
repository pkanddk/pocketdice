import ErrorBoundary from '../components/ErrorBoundary';
import { Navbar } from "@/components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <ErrorBoundary fallback={<div>Something went wrong. Please try refreshing the page.</div>}>
          <main>{children}</main>
        </ErrorBoundary>
      </body>
    </html>
  )
}



import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };
