import type { Metadata } from "next";
import APIPageClient from "./page.client";

export const metadata: Metadata = {
	title: "API Reference",
	description: "Template functions for retrieving and working with OpenFields field values.",
};

export default function APIPage() {
	return <APIPageClient />;
}
