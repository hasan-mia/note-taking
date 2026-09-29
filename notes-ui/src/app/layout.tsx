import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import { siteConfig } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          new MutationObserver((mutations) => {
            for (const m of mutations) {
              if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked') {
                m.target.removeAttribute('bis_skin_checked');
              }
            }
          }).observe(document.documentElement, {
            attributes: true,
            subtree: true,
            attributeFilter: ['bis_skin_checked'],
          });
        `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
