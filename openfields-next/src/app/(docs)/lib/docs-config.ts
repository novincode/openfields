/**
 * Documentation sidebar configuration
 * Simple, minimal structure
 */

export interface DocLink {
	title: string;
	href: string;
	description?: string;
}

export interface DocSection {
	title: string;
	links: DocLink[];
}

export const DOCS_CONFIG: DocSection[] = [
	{
		title: "Getting Started",
		links: [
			{
				title: "Introduction",
				href: "/docs",
				description: "What is OpenFields and why use it",
			},
			{
				title: "Installation",
				href: "/docs/installation",
				description: "How to install and activate the plugin",
			},
		],
	},
	{
		title: "Usage",
		links: [
			{
				title: "API Reference",
				href: "/docs/api",
				description: "Template functions for retrieving field values",
			},
			{
				title: "Field Types",
				href: "/docs/field-types",
				description: "Available field types and their options",
			},
		],
	},
	{
		title: "Advanced",
		links: [
			{
				title: "Architecture",
				href: "/docs/architecture",
				description: "How OpenFields works under the hood",
			},
			{
				title: "Contributing",
				href: "/docs/contributing",
				description: "How to contribute to the project",
			},
		],
	},
];

export const DOCS_META = {
	title: "OpenFields Documentation",
	description: "Learn how to use OpenFields - the modern WordPress custom fields plugin",
};
