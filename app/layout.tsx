import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import JsonLd from "./components/JsonLd";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GetMeFcknABI - Smart Contract ABI Extractor",
  description:
    "Extract ABIs from any smart contract with minimal hassle. Works across all EVM chains, supports both verified and unverified contracts.",
  keywords: [
    "ethereum",
    "blockchain",
    "abi",
    "smart-contract",
    "web3",
    "dapp",
    "ethereum-contract",
    "developer-tools",
  ],
  authors: [{ name: "bezata" }],
  openGraph: {
    title: "GetMeFcknABI - Smart Contract ABI Extractor",
    description:
      "Extract ABIs from any smart contract with minimal hassle. Works across all EVM chains, supports both verified and unverified contracts.",
    url: "https://getmefcknabi.fun",
    siteName: "GetMeFcknABI",
    images: [
      {
        url: "/favicon.ico",
        width: 512,
        height: 512,
        alt: "GetMeFcknABI Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GetMeFcknABI - Smart Contract ABI Extractor",
    description: "Extract ABIs from any smart contract with minimal hassle",
    images: ["/favicon.ico"],
    creator: "@getmefcknabi",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-32x32.svg",
    apple: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
  metadataBase: new URL("https://getmefcknabi.fun"),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="google-site-verification"
          content="your-verification-code"
        />
        <JsonLd />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-G4C5F2EPLZ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-G4C5F2EPLZ');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Flame Logo SVG as hidden element for page identity */}
        <div className="sr-only">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            width="0"
            height="0"
          >
            <title>GetMeFcknABI Flame Logo</title>
            <path d="M12 2c.9 0 1.8.4 2.4 1.2l6.4 7.9c.6.8.9 1.8.8 2.9-.1 1-.6 2-1.4 2.7-.8.7-1.8 1-2.8.9-1 0-2-.5-2.6-1.2-1.1-1.2-1-3 0-4.3.2-.2.3-.5.3-.7 0-.3-.1-.5-.3-.7l-.2-.2c-.5-.5-1.2-.5-1.7 0l-.1.1c-1.5 1.8-2.4 4.1-2.4 6.7v1c0 1.3-.3 2.7-1 3.8-.7 1.2-1.9 2-3.4 2-1.3 0-2.4-.5-3.2-1.3-1.7-1.8-1.6-4.6.2-6.3.9-.8 1.5-1.9 1.5-3.2 0-1.7-1-3.2-2.5-3.9-.3-.1-.4-.6-.2-.9.1-.1.2-.2.3-.2.9-.4 1.9-.5 2.8-.4.9.1 1.8.6 2.4 1.2.6.7 1 1.5 1.1 2.3.1.9-.1 1.7-.5 2.5-.5.9-.2 2 .8 2.6.9.5 2 .1 2.5-.8.1-.2.2-.5.2-.7 0-.3 0-.5-.1-.8-.2-.9-.2-1.8-.1-2.7.1-.8.3-1.7.7-2.4.5-1 1.1-1.9 2-2.6.7-.6 1.5-.9 2.4-.9z" />
          </svg>
        </div>
        {children}
      </body>
    </html>
  );
}
