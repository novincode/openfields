import type { Metadata } from "next";
import InstallationPageClient from "./page.client";

export const metadata: Metadata = {
	title: "Installation",
	description: "How to install and set up OpenFields on your WordPress site.",
};

export default function InstallationPage() {
	return <InstallationPageClient />;
}
