"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	RiArrowRightLine,
	RiGithubFill,
	RiCodeSSlashLine,
	RiStackLine,
	RiShieldCheckLine,
	RiSpeedLine,
	RiOpenSourceLine,
} from "react-icons/ri";
import Link from "next/link";
import { FIELD_TYPES, FIELD_CATEGORIES } from "@/lib/data";

export default function IntroductionPageClient() {
	return (
		<div className="space-y-12 max-w-3xl">
			{/* Hero */}
			<header className="space-y-4">
				<div className="flex items-center gap-2">
					<Badge variant="outline">v1.0</Badge>
					<Badge variant="secondary">Open Source</Badge>
				</div>
				<h1 className="text-3xl font-bold tracking-tight">OpenFields</h1>
				<p className="text-lg text-muted-foreground">
					A modern, open-source custom fields plugin for WordPress. Create powerful field configurations
					with a beautiful React admin interface.
				</p>
				<div className="flex flex-wrap gap-3 pt-2">
					<Button asChild>
						<Link href="/docs/installation">
							Get Started
							<RiArrowRightLine className="ml-2 size-4" />
						</Link>
					</Button>
					<Button variant="outline" asChild>
						<a href="https://github.com/novincode/openfields" target="_blank" rel="noopener noreferrer">
							<RiGithubFill className="mr-2 size-4" />
							View on GitHub
						</a>
					</Button>
				</div>
			</header>

			<Separator />

			{/* Why OpenFields */}
			<section className="space-y-6">
				<h2 className="text-xl font-semibold">Why OpenFields?</h2>
				<div className="grid sm:grid-cols-2 gap-4">
					<Card>
						<CardHeader className="pb-2">
							<RiOpenSourceLine className="size-5 text-primary mb-2" />
							<CardTitle className="text-base">100% Open Source</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							No premium tiers, no feature locks. Everything is free and GPL licensed.
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<RiCodeSSlashLine className="size-5 text-primary mb-2" />
							<CardTitle className="text-base">ACF Compatible</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							Same template functions. Drop-in replacement for existing ACF projects.
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<RiStackLine className="size-5 text-primary mb-2" />
							<CardTitle className="text-base">Modern Stack</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							React admin UI, TypeScript, REST API. Built with modern tools.
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<RiSpeedLine className="size-5 text-primary mb-2" />
							<CardTitle className="text-base">Lightweight</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							No bloat. Clean codebase that follows WordPress best practices.
						</CardContent>
					</Card>
				</div>
			</section>

			<Separator />

			{/* Field Types */}
			<section className="space-y-6">
				<h2 className="text-xl font-semibold">Available Field Types</h2>
				<p className="text-muted-foreground">
					OpenFields supports {FIELD_TYPES.length} field types across {FIELD_CATEGORIES.length} categories.
				</p>
				<div className="space-y-4">
					{FIELD_CATEGORIES.map((category) => (
						<div key={category.key}>
							<h3 className="text-sm font-medium text-muted-foreground mb-2">{category.label}</h3>
							<div className="flex flex-wrap gap-2">
								{FIELD_TYPES.filter((f) => f.category === category.key).map((field) => (
									<Badge key={field.type} variant="secondary" className="font-normal">
										{field.label}
									</Badge>
								))}
							</div>
						</div>
					))}
				</div>
			</section>

			<Separator />

			{/* Quick Links */}
			<section className="space-y-4">
				<h2 className="text-xl font-semibold">Quick Links</h2>
				<div className="grid sm:grid-cols-2 gap-3">
					<Link
						href="/docs/installation"
						className="block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
					>
						<div className="font-medium">Installation</div>
						<div className="text-sm text-muted-foreground">Get up and running in minutes</div>
					</Link>
					<Link
						href="/docs/api"
						className="block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
					>
						<div className="font-medium">API Reference</div>
						<div className="text-sm text-muted-foreground">Template functions for your themes</div>
					</Link>
					<Link
						href="/docs/field-types"
						className="block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
					>
						<div className="font-medium">Field Types</div>
						<div className="text-sm text-muted-foreground">All available field configurations</div>
					</Link>
					<Link
						href="/docs/architecture"
						className="block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
					>
						<div className="font-medium">Architecture</div>
						<div className="text-sm text-muted-foreground">How OpenFields works under the hood</div>
					</Link>
				</div>
			</section>
		</div>
	);
}
