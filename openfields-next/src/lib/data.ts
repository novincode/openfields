/**
 * Centralized data for OpenFields website
 * All content in one place for easy maintenance
 */

// ============================================================================
// NAVIGATION
// ============================================================================

export const NAV_LINKS = [
	{ label: "Home", href: "/" },
	{ label: "Docs", href: "/docs" },
	{ label: "Download", href: "#download" },
	{ label: "Support", href: "/support" },
] as const;

// ============================================================================
// FIELD TYPES - Based on the actual plugin registry
// ============================================================================

export type FieldCategory = "basic" | "content" | "choice" | "relational" | "layout";

export interface FieldType {
	type: string;
	label: string;
	icon: string;
	category: FieldCategory;
	description: string;
	available: boolean;
}

export const FIELD_TYPES: FieldType[] = [
	// Basic Fields
	{ type: "text", label: "Text", icon: "Type", category: "basic", description: "Single line text input", available: true },
	{ type: "textarea", label: "Textarea", icon: "AlignLeft", category: "basic", description: "Multi-line text area", available: true },
	{ type: "number", label: "Number", icon: "Hash", category: "basic", description: "Numeric input with validation", available: true },
	{ type: "email", label: "Email", icon: "Mail", category: "basic", description: "Email input with validation", available: true },
	{ type: "url", label: "URL", icon: "Link", category: "basic", description: "URL input with validation", available: true },

	// Content Fields
	{ type: "wysiwyg", label: "WYSIWYG Editor", icon: "FileText", category: "content", description: "Rich text editor", available: true },
	{ type: "image", label: "Image", icon: "Image", category: "content", description: "Single image upload", available: true },
	{ type: "gallery", label: "Gallery", icon: "Images", category: "content", description: "Multiple image gallery", available: true },
	{ type: "file", label: "File", icon: "File", category: "content", description: "File upload", available: true },

	// Choice Fields
	{ type: "select", label: "Select", icon: "ChevronDown", category: "choice", description: "Dropdown selection", available: true },
	{ type: "radio", label: "Radio", icon: "Circle", category: "choice", description: "Radio button group", available: true },
	{ type: "checkbox", label: "Checkbox", icon: "CheckSquare", category: "choice", description: "Checkbox group", available: true },
	{ type: "switch", label: "Switch", icon: "ToggleLeft", category: "choice", description: "True/False toggle", available: true },

	// Date & Time
	{ type: "date", label: "Date Picker", icon: "Calendar", category: "basic", description: "Date selection", available: true },
	{ type: "datetime", label: "Date Time", icon: "CalendarClock", category: "basic", description: "Date and time selection", available: true },
	{ type: "time", label: "Time", icon: "Clock", category: "basic", description: "Time selection", available: true },
	{ type: "color", label: "Color Picker", icon: "Palette", category: "basic", description: "Color selection", available: true },

	// Relational Fields
	{ type: "link", label: "Link", icon: "ExternalLink", category: "basic", description: "URL with title and target", available: true },
	{ type: "post_object", label: "Post Object", icon: "FileText", category: "relational", description: "Select WordPress posts", available: true },
	{ type: "taxonomy", label: "Taxonomy", icon: "Tags", category: "relational", description: "Select taxonomy terms", available: true },
	{ type: "user", label: "User", icon: "User", category: "relational", description: "Select WordPress users", available: true },

	// Layout Fields
	{ type: "repeater", label: "Repeater", icon: "Repeat", category: "layout", description: "Repeatable sub-fields", available: true },
	{ type: "group", label: "Group", icon: "FolderOpen", category: "layout", description: "Group fields together", available: true },
];

export const FIELD_CATEGORIES: { key: FieldCategory; label: string }[] = [
	{ key: "basic", label: "Basic" },
	{ key: "content", label: "Content" },
	{ key: "choice", label: "Choice" },
	{ key: "relational", label: "Relational" },
	{ key: "layout", label: "Layout" },
];

// ============================================================================
// SPONSORS
// ============================================================================

export interface Sponsor {
	name: string;
	avatar?: string;
	tier: "founding" | "supporter" | "backer";
	url?: string;
	color?: string;
}

export const SPONSORS: Sponsor[] = [
	{ name: "Mom", tier: "founding", color: "bg-accent" },
	{ name: "Dad", tier: "founding", color: "bg-accent" },
	{ name: "My GF 🥲", tier: "founding", color: "bg-accent" },
];

export const SPONSOR_TIERS = [
	{ key: "founding", label: "Founding Sponsors", price: "Early believers" },
	{ key: "supporter", label: "Supporters", price: "$10/month" },
	{ key: "backer", label: "Backers", price: "$5/month" },
] as const;

// ============================================================================
// DOWNLOAD LINKS
// ============================================================================

export const DOWNLOAD_LINKS = {
	github: "https://github.com/novincode/openfields",
	wordpress: "#", // Coming soon
	releases: "https://github.com/novincode/openfields/releases",
} as const;

// ============================================================================
// SOCIAL LINKS
// ============================================================================

export const SOCIAL_LINKS = {
	github: "https://github.com/novincode/openfields",
	sponsor: "https://github.com/sponsors/novincode",
	linkedin: "https://linkedin.com/in/shayanpng",
} as const;

// ============================================================================
// SITE CONFIG
// ============================================================================

export const SITE_CONFIG = {
	name: "OpenFields",
	description: "The modern, open-source alternative to ACF for WordPress",
	tagline: "Custom fields, done right.",
	url: "https://openfields.dev",
	author: {
		name: "Shayan",
		company: "Codeideal",
		website: "https://codeideal.com",
	},
} as const;

// ============================================================================
// FEATURES
// ============================================================================

export const FEATURES = [
	{
		title: "Visual Builder",
		description: "Drag-and-drop field editor with live preview",
	},
	{
		title: "20+ Field Types",
		description: "Everything you need, out of the box",
	},
	{
		title: "Conditional Logic",
		description: "Show/hide fields based on values",
	},
	{
		title: "100% Free",
		description: "No premium tiers. No locked features.",
	},
] as const;

// ============================================================================
// TECH STACK
// ============================================================================

export const TECH_STACK = [
	{ name: "React", icon: "react" },
	{ name: "TypeScript", icon: "typescript" },
	{ name: "Tailwind CSS", icon: "tailwind" },
	{ name: "WordPress", icon: "wordpress" },
] as const;
