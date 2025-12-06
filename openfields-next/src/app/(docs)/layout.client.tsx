"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RiMenuLine } from "react-icons/ri";
import { DocsSidebar } from "./components/docs-sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

interface DocsLayoutClientProps {
	children: React.ReactNode;
}

export function DocsLayoutClient({ children }: DocsLayoutClientProps) {
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

	return (
		<div className="flex flex-col min-h-screen">
			{/* Header with sidebar toggle */}
			<header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<div className="flex h-14 items-center justify-between">
						<div className="flex items-center gap-4">
							<Button
								variant="ghost"
								size="icon-sm"
								className="lg:hidden"
								onClick={() => setIsMobileSidebarOpen(true)}
								aria-label="Open documentation navigation"
							>
								<RiMenuLine className="size-5" />
							</Button>
							<Link href="/" className="font-semibold text-lg">
								OpenFields
							</Link>
							<span className="text-muted-foreground">/</span>
							<Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
								Docs
							</Link>
						</div>
					</div>
				</div>
			</header>

			<div className="flex flex-1 mx-auto w-full max-w-6xl">
				{/* Desktop Sidebar */}
				<aside className="hidden lg:block lg:w-56 shrink-0 border-r border-border">
					<div className="sticky top-14 h-[calc(100vh-3.5rem)]">
						<DocsSidebar />
					</div>
				</aside>

				{/* Mobile Sidebar */}
				<DocsSidebar
					className="lg:hidden"
					isMobile={true}
					isOpen={isMobileSidebarOpen}
					onClose={() => setIsMobileSidebarOpen(false)}
				/>

				{/* Main Content */}
				<main className="flex-1 min-w-0">
					<article className="px-6 py-8 md:px-10 lg:px-12">
						{children}
					</article>
				</main>
			</div>

			<Footer />
		</div>
	);
}
