import type { Metadata } from "next";
import IntroductionPageClient from "./page.client";
import { generateMetadata } from "@/lib/seo";

export const metadata: Metadata = generateMetadata({
	title: "Documentation",
	description:
		"OpenFields documentation - Learn how to use WordPress custom fields the modern way. API reference, field types, and architecture guide.",
	keywords: [
		"WordPress documentation",
		"custom fields",
		"ACF alternative",
		"field builder documentation",
	],
	path: "/docs",
});

export default function DocsPage() {
	return <IntroductionPageClient />;
}
