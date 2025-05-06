import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Remove the Navbar import
// import { Navbar } from "@/components/Navbar"; 
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pocket Score",
  description: "Your go-to scoring app",
  manifest: "/manifest.json",
  themeColor: "#0F172A",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" }, // Next.js will infer sizes or you can be more specific
      // Example if you had a sized one explicitly for 180x180:
      // { url: '/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
    // other: [], // For any other specific icon needs
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Remove the Navbar rendering */}
          {/* <Navbar /> */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
