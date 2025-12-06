import Link from "next/link";
import { RiHeartFill, RiGithubFill, RiLinkedinFill } from "react-icons/ri";
import { SITE_CONFIG, SOCIAL_LINKS } from "@/lib/data";
import { Button } from "@/components/ui/button";

export function Footer() {
	return (
		<footer className="border-t border-border bg-background">
			<div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
				{/* Main Footer Grid */}
				<div className="grid sm:grid-cols-3 gap-8 mb-8">
					{/* Left: About */}
					<div className="space-y-3">
						<h3 className="font-semibold text-foreground">{SITE_CONFIG.name}</h3>
						<p className="text-sm text-muted-foreground">
							The modern, open-source Advanced Custom Fields solution for WordPress
						</p>
					</div>

					{/* Center: Quick Links */}
					<div className="space-y-3">
						<h4 className="font-semibold text-sm text-foreground">Quick Links</h4>
						<nav className="flex flex-col gap-2 text-sm">
							<Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
								Home
							</Link>
							<Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
								Documentation
							</Link>
							<a
								href={SOCIAL_LINKS.github}
								target="_blank"
								rel="noopener noreferrer"
								className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
							>
								<RiGithubFill className="size-4" />
								<span>View on GitHub</span>
							</a>
						</nav>
					</div>

					{/* Right: Actions */}
					<div className="space-y-3">
						<h4 className="font-semibold text-sm text-foreground">Support the Project</h4>
						<div className="flex flex-col gap-2">
							<Button asChild variant="outline" size="sm" className="justify-start">
								<a
									href={SOCIAL_LINKS.github}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2"
								>
									<RiGithubFill className="size-4" />
									<span>Star on GitHub</span>
								</a>
							</Button>
							<Button asChild variant="outline" size="sm" className="justify-start">
								<a
									href={SOCIAL_LINKS.sponsor}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2"
								>
									<RiHeartFill className="size-4 text-destructive" />
									<span>Sponsor This Project</span>
								</a>
							</Button>
						</div>
					</div>
				</div>

				{/* Divider */}
				<div className="border-t border-border my-6" />

				{/* Bottom Footer */}
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
					{/* Left: Copyright */}
					<div className="text-muted-foreground">
						<p>
							© {new Date().getFullYear()} {SITE_CONFIG.name}. Licensed under{" "}
							<a
								href="https://www.gnu.org/licenses/gpl-2.0.html"
								target="_blank"
								rel="noopener noreferrer"
								className="text-foreground hover:underline"
							>
								GPL v2
							</a>
							.
						</p>
					</div>

					{/* Right: Creator */}
					<div className="flex items-center gap-1.5 text-muted-foreground">
						<span>Made with</span>
						<RiHeartFill className="size-4 text-destructive" />
						<span>by</span>
						<a
							href={SOCIAL_LINKS.linkedin}
							target="_blank"
							rel="noopener noreferrer"
							className="font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
						>
							Shayan
						</a>
						<span>@</span>
						<a
							href={SITE_CONFIG.author.website}
							target="_blank"
							rel="noopener noreferrer"
							className="font-medium text-foreground hover:text-primary transition-colors"
						>
							{SITE_CONFIG.author.company}
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
