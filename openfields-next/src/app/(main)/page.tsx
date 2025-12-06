import type { Metadata } from "next";
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
		<>
			<HeroSection />
			<FieldsSection />
			<DownloadSection />
			<SponsorsSection />
		</>
	);
}