import { MetadataRoute } from "next";
import { getFullUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: [],
			},
		],
		sitemap: `${getFullUrl()}/sitemap.xml`,
	};
}
