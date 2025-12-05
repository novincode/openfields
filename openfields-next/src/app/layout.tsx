import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { SITE_CONFIG } from "@/lib/data";
import { Providers } from "@/components/providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

// Modern rounded font similar to Sohne
const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	display: "swap",
});

export const metadata: Metadata = {
	title: {
		default: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
		template: `%s | ${SITE_CONFIG.name}`,
	},
	description: SITE_CONFIG.description,
	keywords: [
		"WordPress",
		"custom fields",
		"open source",
		"WordPress plugin",
		"meta fields",
		"post meta",
		"custom post types",
	],
	authors: [{ name: SITE_CONFIG.author.name, url: SITE_CONFIG.author.website }],
	creator: SITE_CONFIG.author.name,
	openGraph: {
		type: "website",
		locale: "en_US",
		url: SITE_CONFIG.url,
		title: SITE_CONFIG.name,
		description: SITE_CONFIG.description,
		siteName: SITE_CONFIG.name,
	},
	twitter: {
		card: "summary_large_image",
		title: SITE_CONFIG.name,
		description: SITE_CONFIG.description,
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
