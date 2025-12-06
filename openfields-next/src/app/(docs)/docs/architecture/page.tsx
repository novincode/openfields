import type { Metadata } from "next";
import ArchitecturePageClient from "./page.client";

export const metadata: Metadata = {
	title: "Architecture",
	description: "How OpenFields works - database schema, REST API, and technology stack.",
};

export default function ArchitecturePage() {
	return <ArchitecturePageClient />;
}
