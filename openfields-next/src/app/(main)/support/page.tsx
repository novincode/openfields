import type { Metadata } from "next";
import { SponsorsSection } from "@/components/sections";
import { generateMetadata } from "@/lib/seo";
import { RiQuestionLine, RiGithubFill, RiMailLine, RiMessage2Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = generateMetadata({
	title: "Support - OpenFields",
	description: "Get help with OpenFields. Find documentation, report issues, or contribute to the project.",
	path: "/support",
});

export default function SupportPage() {
	return (
		<div className="space-y-16">
			{/* Hero Section */}
			<section className="text-center py-16">
				<div className="mx-auto max-w-3xl px-4 sm:px-6">
					<div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/10 dark:bg-primary/20 mb-6">
						<RiQuestionLine className="size-8 text-primary" />
					</div>
					<h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
						Need Help?
					</h1>
					<p className="text-xl text-muted-foreground leading-relaxed">
						We&apos;re here to support you. Whether you&apos;re just getting started or need advanced help,
						find the resources you need below.
					</p>
				</div>
			</section>

			{/* Support Options */}
			<section className="mx-auto max-w-5xl px-4 sm:px-6">
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					<Card className="text-center">
						<CardHeader>
							<div className="mx-auto size-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
								<RiMessage2Line className="size-6 text-blue-600" />
							</div>
							<CardTitle>Documentation</CardTitle>
							<CardDescription>
								Comprehensive guides and API reference
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button variant="outline" asChild className="w-full">
								<a href="/docs" className="inline-flex items-center gap-2">
									Read Docs
								</a>
							</Button>
						</CardContent>
					</Card>

					<Card className="text-center">
						<CardHeader>
							<div className="mx-auto size-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
								<RiGithubFill className="size-6 text-green-600" />
							</div>
							<CardTitle>GitHub Issues</CardTitle>
							<CardDescription>
								Report bugs or request features
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button variant="outline" asChild className="w-full">
								<a href="https://github.com/novincode/openfields/issues" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
									<RiGithubFill className="size-4" />
									Open Issue
								</a>
							</Button>
						</CardContent>
					</Card>

					<Card className="text-center">
						<CardHeader>
							<div className="mx-auto size-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
								<RiMailLine className="size-6 text-purple-600" />
							</div>
							<CardTitle>Contact</CardTitle>
							<CardDescription>
								Direct support and inquiries
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button variant="outline" asChild className="w-full">
								<a href="mailto:support@openfields.dev" className="inline-flex items-center gap-2">
									<RiMailLine className="size-4" />
									Email Us
								</a>
							</Button>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Community Section */}
			<section className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
				<h2 className="text-3xl font-bold text-foreground mb-4">
					Join the Community
				</h2>
				<p className="text-lg text-muted-foreground mb-8">
					Connect with other developers using OpenFields. Share your experiences,
					learn from others, and contribute back to the project.
				</p>
				<div className="flex flex-col sm:flex-row gap-4 justify-center">
					<Button asChild>
						<a href="https://github.com/novincode/openfields/discussions" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
							<RiGithubFill className="size-4" />
							GitHub Discussions
						</a>
					</Button>
					<Button variant="outline" asChild>
						<a href="https://github.com/novincode/openfields" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
							<RiGithubFill className="size-4" />
							Contribute on GitHub
						</a>
					</Button>
				</div>
			</section>

			{/* Sponsors Section */}
			<SponsorsSection />
		</div>
	);
}