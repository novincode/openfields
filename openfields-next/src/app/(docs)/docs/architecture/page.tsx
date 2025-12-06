import type { Metadata } from "next";
import ArchitecturePageClient from "./page.client";
import { generateMetadata } from "@/lib/seo";

export const metadata: Metadata = generateMetadata({
	title: "Architecture",
	description:
		"Understanding OpenFields architecture. Database schema, REST API design, location matching system, and technology stack (React, TypeScript, PHP, WordPress).",
	keywords: ["architecture", "database schema", "REST API", "WordPress plugin development", "React"],
	path: "/docs/architecture",
});

export default function ArchitecturePage() {
	return <ArchitecturePageClient />;
}
