import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata = {
  title: "TaskZen | The Evolution of Flow",
  description: "A premium productivity experience designed for high-achievers.",
  openGraph: {
    title: "TaskZen | The Evolution of Flow",
    description: "A premium productivity experience designed for high-achievers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TaskZen - The Evolution of Flow",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskZen | The Evolution of Flow",
    description: "A premium productivity experience designed for high-achievers.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} font-sans antialiased bg-[#030014] text-white`}
      >
        {children}
      </body>
    </html>
  );
}
