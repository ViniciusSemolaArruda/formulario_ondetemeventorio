import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Onde Tem Evento Rio? - Convites",
  description: "Você está convidado!",
  icons: {
    icon: "/favicon-32x32.png",
  },
  openGraph: {
    title: "Onde Tem Evento Rio? - Convites",
    description: "Você está convidado!",
    url: "https://convidado-ondetemevento.com.br/",
    siteName: "Onde Tem Evento Rio?",
    images: [
      {
        url: "https://convidado-ondetemevento.com.br/og-image.png",
        width: 1200,
        height: 630,
        alt: "Convite - Onde Tem Evento Rio?",
      },
    ],
    type: "website",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
