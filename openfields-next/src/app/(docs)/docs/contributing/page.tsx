import type { Metadata } from "next";
import ContributingPageClient from "./page.client";
import { generateMetadata } from "@/lib/seo";

export const metadata: Metadata = generateMetadata({
	title: "Contributing",
	description:
		"Contribute to OpenFields open source project. Local development setup, coding guidelines, and ways to help the WordPress community.",
	keywords: ["contributing", "open source", "WordPress plugin development", "GitHub", "development setup"],
	path: "/docs/contributing",
});

export default function ContributingPage() {
	return <ContributingPageClient />;
}
