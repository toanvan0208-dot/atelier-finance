import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hỗ trợ đầu tư",
  description: "Cửa vào hệ thống phân tích cổ phiếu cho người mới",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
