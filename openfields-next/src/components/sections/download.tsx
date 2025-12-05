import { RiGithubFill, RiWordpressFill, RiArrowRightLine, RiBookOpenLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { DOWNLOAD_LINKS } from "@/lib/data";
import Link from "next/link";

export function DownloadSection() {
	return (
		<section id="download" className="border-t border-border bg-secondary/30">
			<div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20">
				{/* Header */}
				<div className="text-center mb-10">
					<h2 className="text-2xl sm:text-3xl font-bold text-foreground">
						Get Started
					</h2>
					<p className="mt-2 text-muted-foreground">
						Download OpenFields and start building.
					</p>
				</div>

				{/* Download Options */}
				<div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
					{/* GitHub */}
					<div className="flex flex-col p-6 rounded-lg border border-border bg-background">
						<div className="flex items-center gap-3 mb-4">
							<div className="flex size-10 items-center justify-center rounded-md bg-[#24292f] text-white">
								<RiGithubFill className="size-5" />
							</div>
							<div>
								<h3 className="font-semibold text-foreground">GitHub</h3>
								<p className="text-xs text-muted-foreground">Source code & releases</p>
							</div>
						</div>
						<p className="text-sm text-muted-foreground mb-4 flex-1">
							Clone the repo, contribute, or download the latest release.
						</p>
						<Button variant="outline" className="w-full" asChild>
							<a href={DOWNLOAD_LINKS.github} target="_blank" rel="noopener noreferrer">
								<span>View Repository</span>
								<RiArrowRightLine className="size-4" />
							</a>
						</Button>
					</div>

					{/* WordPress.org */}
					<div className="flex flex-col p-6 rounded-lg border border-border bg-background">
						<div className="flex items-center gap-3 mb-4">
							<div className="flex size-10 items-center justify-center rounded-md bg-[#21759b] text-white">
								<RiWordpressFill className="size-5" />
							</div>
							<div>
								<h3 className="font-semibold text-foreground">WordPress.org</h3>
								<p className="text-xs text-muted-foreground">One-click install</p>
							</div>
						</div>
						<p className="text-sm text-muted-foreground mb-4 flex-1">
							Install directly from your WordPress dashboard.
						</p>
						<Button variant="secondary" className="w-full" disabled>
							<span>Coming Soon</span>
						</Button>
					</div>
				</div>

				{/* Docs Link */}
				<div className="mt-8 text-center">
					<Button variant="link" asChild>
						<Link href="/docs">
							<RiBookOpenLine className="size-4" />
							<span>Read the documentation</span>
						</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}
