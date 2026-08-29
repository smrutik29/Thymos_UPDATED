import type { Metadata } from "next";
import { Sora, Public_Sans } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.thymoshealth.com"),
  title: "Thymos Health — Find Out What's Really Driving Your Symptoms",
  description:
    "Take the Thymos Health quiz to get a personalized, root-cause approach to your autoimmune or chronic inflammatory symptoms.",
  alternates: { canonical: "/quiz" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Thymos Health",
    url: "/quiz",
    title: "Thymos Health — Find Out What's Really Driving Your Symptoms",
    description:
      "Take the Thymos Health quiz to get a personalized, root-cause approach to your autoimmune or chronic inflammatory symptoms.",
    images: ["/img/thymos-logo-flames.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thymos Health — Find Out What's Really Driving Your Symptoms",
    description:
      "Take the Thymos Health quiz to get a personalized, root-cause approach to your autoimmune or chronic inflammatory symptoms.",
    images: ["/img/thymos-logo-flames.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${publicSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-page font-body text-ink">
        {children}
      </body>
    </html>
  );
}
