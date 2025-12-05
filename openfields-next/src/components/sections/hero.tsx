import Link from "next/link";
import { RiGithubFill, RiArrowRightLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SITE_CONFIG, DOWNLOAD_LINKS } from "@/lib/data";

export function HeroSection() {
	return (
		<section className="relative overflow-hidden py-20 sm:py-32">
			<div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-secondary/5 dark:from-brand/10 dark:via-transparent dark:to-secondary/10" />

			<div className="relative mx-auto max-w-5xl px-4 sm:px-6">
				<div className="flex flex-col items-center text-center">
					{/* Badge */}
					<Badge variant="secondary" className="mb-4">
						Built for Wordpress Community
					</Badge>

					{/* Heading */}
					<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-4xl leading-tight">
						WordPress Custom Fields,
						<br />
						<span className="text-brand">Done Right.</span>
					</h1>

					{/* Subheading */}
					<p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
						{SITE_CONFIG.description}. No premium tiers, no locked features.
					</p>

					{/* CTA Buttons */}
					<div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
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
					<div className="mt-12 flex flex-wrap justify-center gap-3 text-sm">
						<span className="px-3 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors cursor-default">Visual Builder</span>
						<span className="px-3 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors cursor-default">20+ Fields</span>
						<span className="px-3 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors cursor-default">100% Free</span>
						<span className="px-3 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors cursor-default">Open Source</span>
					</div>
				</div>
			</div>
		</section>
	);
}
