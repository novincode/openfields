"use client";

import * as React from "react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { RiFileCopyLine, RiCheckLine } from "react-icons/ri";

interface CodeBlockClientProps {
	code: string;
	lightHtml: string;
	darkHtml: string;
	maxHeight?: string;
	className?: string;
}

export function CodeBlockClient({
	code,
	lightHtml,
	darkHtml,
	maxHeight = "none",
	className = "",
}: CodeBlockClientProps) {
	const [isCopied, setIsCopied] = useState(false);
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setIsCopied(true);
			toast.success("Copied to clipboard");
			setTimeout(() => setIsCopied(false), 2000);
		} catch {
			toast.error("Failed to copy");
		}
	};

	const html = mounted ? (resolvedTheme === "dark" ? darkHtml : lightHtml) : lightHtml;

	return (
		<TooltipProvider>
			<div
				className={`relative rounded-lg border border-border overflow-hidden bg-muted/30 ${className}`}
			>
				<ScrollArea
					className="w-full"
					style={{ maxHeight: maxHeight !== "none" ? maxHeight : undefined }}
				>
					<div
						className="p-4 text-sm [&_.shiki]:bg-transparent! [&_pre]:bg-transparent! [&_code]:bg-transparent! [&_.line]:block"
						dangerouslySetInnerHTML={{ __html: html }}
					/>
					<ScrollBar orientation="horizontal" />
					<ScrollBar orientation="vertical" />
				</ScrollArea>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							className="absolute top-2 right-2"
							onClick={handleCopy}
						>
							{isCopied ? (
								<RiCheckLine className="size-4 text-green-500" />
							) : (
								<RiFileCopyLine className="size-4" />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent side="left">Copy code</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	);
}
