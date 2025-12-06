/**
 * Centralized SEO Configuration
 * Single source of truth for all meta tags, OG tags, and structured data
 * Easy to update domain, description, keywords in one place
 */

// Change these values to update SEO everywhere
const SEO_CONFIG = {
	// Domain configuration - easy to swap between codeideal.com and openfields.dev
	domain: "openfields.codeideal.com", // TODO: Change to openfields.dev when ready
	protocol: "https",

	// Site branding
	siteName: "OpenFields",
	siteTagline: "Custom fields, done right.",
	siteDescription:
		"OpenFields is a free, open-source WordPress plugin that's the perfect ACF alternative. Build custom fields with an intuitive React admin interface. No premium tiers, 100% GPL licensed.",

	// Keywords - comprehensive for SEO targeting
	// These are the actual searches people make
	keywords: [
		// Direct searches
		"OpenFields",
		"OpenFields WordPress",
		"OpenFields plugin",

		// ACF alternative searches
		"ACF alternative",
		"ACF alternative WordPress",
		"free ACF alternative",
		"open source ACF alternative",

		// Custom fields searches
		"WordPress custom fields",
		"WordPress custom fields plugin",
		"custom fields builder",
		"custom post meta WordPress",
		"post meta fields",
		"meta fields WordPress",

		// Field types searches
		"repeater fields WordPress",
		"image gallery field WordPress",
		"conditional fields WordPress",

		// Use case searches
		"WordPress field builder",
		"WordPress form builder",
		"WordPress plugin development",

		// Technical searches
		"WordPress REST API",
		"WordPress plugin development",
		"WordPress admin interface",

		// Comparison searches
		"best WordPress custom field plugin",
		"WordPress field management",
		"custom field solution WordPress",

		// Open source searches
		"open source WordPress",
		"open source WordPress plugin",
		"free WordPress plugin",
		"GPL WordPress plugin",
	],

	// Author
	author: {
		name: "Shayan",
		website: "https://linkedin.com/in/shayanpng",
		twitter: "@shayanpng",
	},

	// Social
	social: {
		github: "https://github.com/novincode/openfields",
		sponsor: "https://github.com/sponsors/novincode",
		linkedin: "https://linkedin.com/in/shayanpng",
	},

	// Images
	images: {
		og: "/og-image.png", // Should be placed in public/
		icon: "/favicon.svg",
	},

	// Locale
	locale: "en_US",
	language: "en",

	// Additional metadata
	license: "GPL v2",
	licenseUrl: "https://www.gnu.org/licenses/gpl-2.0.html",
};

export const getFullUrl = (path: string = "") => {
	return `${SEO_CONFIG.protocol}://${SEO_CONFIG.domain}${path}`;
};

/**
 * Generate common metadata for any page
 * Can be merged with page-specific metadata
 */
export function generateMetadata(overrides?: {
	title?: string;
	description?: string;
	keywords?: string[];
	path?: string;
	ogImage?: string;
	ogType?: string;
}) {
	const title = overrides?.title
		? `${overrides.title} | ${SEO_CONFIG.siteName}`
		: `${SEO_CONFIG.siteName} - ${SEO_CONFIG.siteTagline}`;

	const description = overrides?.description || SEO_CONFIG.siteDescription;
	const keywords = overrides?.keywords || SEO_CONFIG.keywords;
	const path = overrides?.path || "";
	const url = getFullUrl(path);
	const ogImage = overrides?.ogImage || SEO_CONFIG.images.og;
	const ogType = overrides?.ogType || "website";

	return {
		// Basic metadata
		title,
		description,
		keywords: Array.isArray(keywords) ? keywords.join(", ") : keywords,

		// Author
		authors: [
			{
				name: SEO_CONFIG.author.name,
				url: SEO_CONFIG.author.website,
			},
		],
		creator: SEO_CONFIG.author.name,

		// Canonical URL
		alternates: {
			canonical: url,
		},

		// Open Graph
		openGraph: {
			type: ogType,
			locale: SEO_CONFIG.locale,
			url,
			title,
			description,
			siteName: SEO_CONFIG.siteName,
			images: [
				{
					url: getFullUrl(ogImage),
					width: 1200,
					height: 630,
					alt: `${SEO_CONFIG.siteName} - ${SEO_CONFIG.siteTagline}`,
					type: "image/png",
				},
			],
		},

		// Twitter
		twitter: {
			card: "summary_large_image",
			title,
			description,
			creator: SEO_CONFIG.author.twitter,
			images: [getFullUrl(ogImage)],
		},

		// Robots
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				"max-snippet": -1,
				"max-image-preview": "large" as const,
				"max-video-preview": -1,
			},
		},

		// Verification (add these if needed)
		// verification: {
		//   google: "google-site-verification-code",
		// },
	};
}

/**
 * Structured data (JSON-LD) for rich snippets
 */
export function generateStructuredData() {
	return {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: SEO_CONFIG.siteName,
		description: SEO_CONFIG.siteDescription,
		url: getFullUrl(),
		image: getFullUrl(SEO_CONFIG.images.og),
		author: {
			"@type": "Person",
			name: SEO_CONFIG.author.name,
			url: SEO_CONFIG.author.website,
		},
		license: SEO_CONFIG.licenseUrl,
		codeRepository: SEO_CONFIG.social.github,
		issueTracker: `${SEO_CONFIG.social.github}/issues`,
		downloadUrl: `${SEO_CONFIG.social.github}/releases`,
		programmingLanguage: ["PHP", "TypeScript", "React"],
		operatingSystem: "WordPress",
		applicationCategory: "PluginOrAddOn",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		},
	};
}

export default SEO_CONFIG;
