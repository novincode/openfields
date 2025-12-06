import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { HeroSection, FieldsSection, DownloadSection, SponsorsSection } from "@/components/sections";
import { generateMetadata } from "@/lib/seo";

export const metadata: Metadata = generateMetadata({
	title: "Free Open-Source WordPress Custom Fields Plugin - Alternative to ACF",
	description:
		"OpenFields is a free, open-source WordPress plugin offering a modern alternative to ACF. Build custom fields with an intuitive React admin. 100% GPL licensed, no premium tiers.",
	keywords: [
		"free ACF alternative",
		"WordPress custom fields",
		"open source WordPress plugin",
		"ACF alternative free",
		"WordPress field builder",
		"custom fields plugin",
		"repeater fields",
		"post meta fields",
	],
	path: "/",
	ogType: "website",
});

export default function Home() {
	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1">
				<HeroSection />
				<FieldsSection />
				<DownloadSection />
				<SponsorsSection />
			</main>
			<Footer />
		</div>
	);
}
