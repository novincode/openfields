import type { Metadata } from "next";
import IntroductionPageClient from "./page.client";

export const metadata: Metadata = {
	title: "Documentation",
	description: "OpenFields documentation - Learn how to use WordPress custom fields the modern way.",
};

export default function DocsPage() {
	return <IntroductionPageClient />;
}
