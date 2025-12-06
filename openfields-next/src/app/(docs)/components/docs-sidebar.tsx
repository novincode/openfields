"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DOCS_CONFIG } from "../lib/docs-config";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RiBookOpenLine } from "react-icons/ri";

interface DocsSidebarProps {
	className?: string;
	isMobile?: boolean;
	isOpen?: boolean;
	onClose?: () => void;
}

function SidebarContent() {
	const pathname = usePathname();

	return (
		<ScrollArea className="h-full py-6">
			<div className="px-4 space-y-6">
				{DOCS_CONFIG.map((section) => (
					<div key={section.title}>
						<h4 className="text-sm font-semibold text-foreground mb-2 px-2">
							{section.title}
						</h4>
						<nav className="space-y-1">
							{section.links.map((link) => {
								const isActive = pathname === link.href;
								return (
									<Link
										key={link.href}
										href={link.href}
										className={cn(
											"block px-2 py-1.5 text-sm rounded-md transition-colors",
											isActive
												? "bg-primary/10 text-primary font-medium"
												: "text-muted-foreground hover:text-foreground hover:bg-muted"
										)}
									>
										{link.title}
									</Link>
								);
							})}
						</nav>
					</div>
				))}
			</div>
		</ScrollArea>
	);
}

export function DocsSidebar({ className, isMobile, isOpen, onClose }: DocsSidebarProps) {
	if (isMobile) {
		return (
			<Sheet open={isOpen} onOpenChange={onClose}>
				<SheetContent side="left" className="w-64 p-0">
					<SheetHeader className="px-4 py-4 border-b">
						<SheetTitle className="flex items-center gap-2">
							<RiBookOpenLine className="size-5" />
							Documentation
						</SheetTitle>
					</SheetHeader>
					<SidebarContent />
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<aside className={cn("h-full", className)}>
			<SidebarContent />
		</aside>
	);
}
