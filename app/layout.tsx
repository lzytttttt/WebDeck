import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { getDictionary } from "@/lib/i18n/getDictionary";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = getDictionary();
  return {
    title: "Web Deck",
    description: t.home.subtitle,
    icons: {
      icon: "/icon.svg",
      shortcut: "/icon.svg",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = getDictionary();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans">
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
