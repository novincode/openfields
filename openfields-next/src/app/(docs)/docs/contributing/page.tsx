import type { Metadata } from "next";
import ContributingPageClient from "./page.client";

export const metadata: Metadata = {
	title: "Contributing",
	description: "How to contribute to OpenFields - setup, guidelines, and ways to help.",
};

export default function ContributingPage() {
	return <ContributingPageClient />;
}
