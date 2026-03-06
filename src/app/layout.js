import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata = {
  title: "TaskZen | The Evolution of Flow",
  description: "A premium productivity experience designed for high-achievers.",
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
