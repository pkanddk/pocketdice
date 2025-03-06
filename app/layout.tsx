import ErrorBoundary from '../components/ErrorBoundary';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary fallback={<div>Something went wrong. Please try refreshing the page.</div>}>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}



import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };
