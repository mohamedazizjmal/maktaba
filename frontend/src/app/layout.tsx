import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "Maktaba — AI Reading Platform",
  description: "Your AI-powered reading companion",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <MobileNav />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1A1A2E',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10B981', secondary: 'white' } },
            error: { iconTheme: { primary: '#EF4444', secondary: 'white' } },
          }}
        />
      </body>
    </html>
  );
}