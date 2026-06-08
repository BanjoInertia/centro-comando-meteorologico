import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Centro de Comando Meteorológico",
  description:
    "Visualização 3D interativa de dados meteorológicos aeronáuticos com inteligência artificial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="h-full overflow-hidden bg-[#050b14] text-slate-100 font-[family-name:var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
