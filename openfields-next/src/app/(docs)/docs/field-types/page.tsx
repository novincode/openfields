import type { Metadata } from "next";
import FieldTypesPageClient from "./page.client";
import { generateMetadata } from "@/lib/seo";

export const metadata: Metadata = generateMetadata({
	title: "Field Types",
	description:
		"Complete guide to all OpenFields field types. Text, textarea, select, repeater, image gallery, and more for building WordPress custom fields.",
	keywords: [
		"field types",
		"text field",
		"repeater field",
		"select field",
		"image field",
		"WordPress fields",
	],
	path: "/docs/field-types",
});

export default function FieldTypesPage() {
	return <FieldTypesPageClient />;
}
