import Link from "next/link";
import { RiGithubFill, RiArrowRightLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SITE_CONFIG, DOWNLOAD_LINKS } from "@/lib/data";

export function HeroSection() {
	return (
		<section className="relative overflow-hidden">
			{/* Subtle gradient background */}
			<div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-transparent" />

			<div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-24">
				<div className="flex flex-col items-center text-center">
					{/* Badge */}
					<Badge variant="secondary" className="mb-4">
						100% Open Source
					</Badge>

					{/* Heading */}
			<h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground max-w-3xl">
				WordPress Custom Fields,
				<br />
				<span className="text-brand">Done Right.</span>
			</h1>					{/* Subheading */}
			<p className="mt-4 text-lg text-muted-foreground max-w-xl">
				{SITE_CONFIG.description}. No premium tiers, no locked features.
			</p>					{/* CTA Buttons */}
					<div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
						<Button size="lg" asChild>
							<a href={DOWNLOAD_LINKS.github} target="_blank" rel="noopener noreferrer">
								<RiGithubFill className="size-5" />
								<span>View on GitHub</span>
							</a>
						</Button>
						<Button variant="outline" size="lg" asChild>
							<Link href="/docs">
								<span>Read the Docs</span>
								<RiArrowRightLine className="size-4" />
							</Link>
						</Button>
					</div>

				{/* Features badges */}
				<div className="mt-10 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
					<span className="px-2 py-1 rounded-md bg-secondary border border-border">Visual Builder</span>
					<span className="px-2 py-1 rounded-md bg-secondary border border-border">20+ Fields</span>
					<span className="px-2 py-1 rounded-md bg-secondary border border-border">100% Free</span>
					<span className="px-2 py-1 rounded-md bg-secondary border border-border">Open Source</span>
				</div>
				</div>
			</div>
		</section>
	);
}
