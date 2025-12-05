"use client";

import Link from "next/link";
import { useState } from "react";
import { RiMenu3Line, RiCloseLine, RiGithubFill, RiHeartLine, RiMoonLine, RiSunLine } from "react-icons/ri";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, SOCIAL_LINKS, SITE_CONFIG } from "@/lib/data";
import { cn } from "@/lib/utils";

type NavLink = (typeof NAV_LINKS)[number];

export function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const { theme, setTheme } = useTheme();

	const isExternalLink = (link: NavLink): link is NavLink & { external: true } => {
		return "external" in link && link.external === true;
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="mx-auto max-w-5xl px-4 sm:px-6">
				<div className="flex h-14 items-center justify-between">
					{/* Logo */}
					<Link href="/" className="flex items-center gap-2 font-semibold">
						<div className="flex size-7 items-center justify-center rounded-md bg-brand text-brand-foreground text-sm font-bold">
							OF
						</div>
						<span className="hidden sm:inline">{SITE_CONFIG.name}</span>
					</Link>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex items-center gap-6">
						{NAV_LINKS.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								{...(isExternalLink(link) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
							>
								{link.label}
							</Link>
						))}
					</nav>

					{/* Desktop Actions */}
					<div className="hidden md:flex items-center gap-3">
						{/* Theme Toggle */}
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							aria-label="Toggle theme"
						>
							{theme === "dark" ? (
								<RiSunLine className="size-5" />
							) : (
								<RiMoonLine className="size-5" />
							)}
						</Button>

						<Button variant="ghost" size="icon-sm" asChild>
							<a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
								<RiGithubFill className="size-5" />
							</a>
						</Button>
						<Button variant="outline" size="sm" asChild>
							<a href={SOCIAL_LINKS.sponsor} target="_blank" rel="noopener noreferrer">
								<RiHeartLine className="size-4 text-destructive" />
								<span>Sponsor</span>
							</a>
						</Button>
					</div>

					{/* Mobile Menu Button + Theme Toggle */}
					<div className="md:hidden flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							aria-label="Toggle theme"
						>
							{theme === "dark" ? (
								<RiSunLine className="size-5" />
							) : (
								<RiMoonLine className="size-5" />
							)}
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
						>
							{mobileMenuOpen ? <RiCloseLine className="size-5" /> : <RiMenu3Line className="size-5" />}
						</Button>
					</div>
				</div>
			</div>

			{/* Mobile Menu */}
			<div
				className={cn(
					"md:hidden border-t border-border bg-background overflow-hidden transition-all duration-200",
					mobileMenuOpen ? "max-h-80" : "max-h-0"
				)}
			>
				<nav className="flex flex-col px-4 py-3 gap-1">
					{NAV_LINKS.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
							onClick={() => setMobileMenuOpen(false)}
							{...(isExternalLink(link) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
						>
							{link.label}
						</Link>
					))}
					<div className="flex items-center gap-2 px-3 pt-2 mt-2 border-t border-border">
						<Button variant="ghost" size="icon-sm" asChild>
							<a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
								<RiGithubFill className="size-5" />
							</a>
						</Button>
						<Button variant="outline" size="sm" asChild>
							<a href={SOCIAL_LINKS.sponsor} target="_blank" rel="noopener noreferrer">
								<RiHeartLine className="size-4 text-destructive" />
								<span>Sponsor</span>
							</a>
						</Button>
					</div>
				</nav>
			</div>
		</header>
	);
}
