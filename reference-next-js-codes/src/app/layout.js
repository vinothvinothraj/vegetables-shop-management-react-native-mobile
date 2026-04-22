import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata = {
  title: "Veggie Shop",
  description: "Mobile-friendly vegetable shop management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full overflow-hidden font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
