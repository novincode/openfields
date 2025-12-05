import Link from "next/link";
import { RiHeartFill, RiGithubFill } from "react-icons/ri";
import { SITE_CONFIG, SOCIAL_LINKS } from "@/lib/data";

export function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="border-t border-border bg-background">
			<div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					{/* Links */}
					<nav className="flex items-center gap-6 text-sm text-muted-foreground">
						<Link href="/" className="hover:text-foreground transition-colors">
							Home
						</Link>
						<Link href="/docs" className="hover:text-foreground transition-colors">
							Docs
						</Link>
						<a
							href={SOCIAL_LINKS.github}
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
						>
							<RiGithubFill className="size-4" />
							<span>GitHub</span>
						</a>
					</nav>

					{/* Attribution */}
					<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
						<span>Made with</span>
						<RiHeartFill className="size-4 text-[#cf222e]" />
						<span>by</span>
						<a
							href={SITE_CONFIG.author.website}
							target="_blank"
							rel="noopener noreferrer"
							className="font-medium text-foreground hover:text-primary transition-colors"
						>
							{SITE_CONFIG.author.name}
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

				{/* Copyright */}
				<div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
					<p>
						{SITE_CONFIG.name} is open source software licensed under GPL v2.
					</p>
				</div>
			</div>
		</footer>
	);
}
