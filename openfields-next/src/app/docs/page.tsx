import { Header, Footer } from "@/components/layout";
import { RiBookOpenLine, RiArrowLeftLine, RiTimeLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Documentation",
	description: "OpenFields documentation - Learn how to use WordPress custom fields the modern way.",
};

export default function DocsPage() {
	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1">
				<div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-24">
					<div className="flex flex-col items-center text-center">
						{/* Icon */}
						<div className="flex size-16 items-center justify-center rounded-full bg-secondary border border-border mb-6">
							<RiBookOpenLine className="size-8 text-muted-foreground" />
						</div>

						{/* Heading */}
						<h1 className="text-2xl sm:text-3xl font-bold text-foreground">
							Documentation
						</h1>

						{/* Coming Soon Notice */}
						<div className="mt-4 flex items-center gap-2 text-muted-foreground">
							<RiTimeLine className="size-4" />
							<span className="text-sm">Coming soon</span>
						</div>

						{/* Description */}
						<p className="mt-6 text-muted-foreground max-w-md">
							We&apos;re working on comprehensive documentation. In the meantime, check out the README on GitHub.
						</p>

						{/* Actions */}
						<div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
							<Button variant="outline" asChild>
								<a href="https://github.com/novincode/openfields#readme" target="_blank" rel="noopener noreferrer">
									View README on GitHub
								</a>
							</Button>
							<Button variant="ghost" asChild>
								<Link href="/">
									<RiArrowLeftLine className="size-4" />
									<span>Back to Home</span>
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}
