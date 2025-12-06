import type { Metadata } from "next";
import InstallationPageClient from "./page.client";
import { generateMetadata } from "@/lib/seo";

export const metadata: Metadata = generateMetadata({
	title: "Installation",
	description:
		"How to install and set up OpenFields on your WordPress site. Step-by-step guide for WordPress plugin installation.",
	keywords: ["installation", "setup", "WordPress plugin installation", "OpenFields setup"],
	path: "/docs/installation",
});

export default function InstallationPage() {
	return <InstallationPageClient />;
}
