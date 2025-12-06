import type { Metadata } from "next";
import APIPageClient from "./page.client";
import { generateMetadata } from "@/lib/seo";

export const metadata: Metadata = generateMetadata({
	title: "API Reference",
	description:
		"OpenFields template functions and API reference. Learn get_field(), have_rows(), update_field() and more for retrieving custom field values in WordPress themes.",
	keywords: ["API", "template functions", "get_field", "ACF functions", "WordPress meta"],
	path: "/docs/api",
});

export default function APIPage() {
	return <APIPageClient />;
}
