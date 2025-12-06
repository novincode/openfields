import type { Metadata } from "next";
import FieldTypesPageClient from "./page.client";

export const metadata: Metadata = {
	title: "Field Types",
	description: "All available field types in OpenFields and their options.",
};

export default function FieldTypesPage() {
	return <FieldTypesPageClient />;
}
