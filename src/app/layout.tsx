import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acelis Access | Control de Invitaciones QR",
  description: "Plataforma de gestión de cortesías y control de acceso desarrollada por Acelis Design.",
  authors: [{ name: "Texcia Sandoval" }],
  creator: "Texcia Sandoval",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-neutral-950 text-neutral-100 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}