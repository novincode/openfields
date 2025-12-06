"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { CodeBlockClient } from "./code-block-client";

interface CodeBlockRegistryProps {
	code: string;
	lang?: string;
	id?: string;
	maxHeight?: string;
	className?: string;
}

/**
 * Normalize code for consistent matching with the generator
 */
function normalizeCode(code: string): string {
	return code
		.replace(/\r\n/g, "\n")
		.replace(/\\`/g, "`")
		.replace(/\\\$/g, "$")
		.replace(/\\\\/g, "\\")
		.split("\n")
		.map((line) => line.trimEnd())
		.join("\n")
		.trim();
}

export function CodeBlockRegistry({
	code,
	lang = "typescript",
	id,
	maxHeight = "none",
	className = "",
}: CodeBlockRegistryProps) {
	const [block, setBlock] = useState<{ lightHtml: string; darkHtml: string } | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadBlock = async () => {
			try {
				const normalizedCode = normalizeCode(code);

				// Load registry lazily
				const registry = await import("@/generated/codes");
				const blockData = registry.getCodeBlockByContent(normalizedCode, lang, id);

				if (!blockData) {
					throw new Error(`Code block not found. Run: pnpm run generate:codes`);
				}

				setBlock(blockData);
			} catch (err) {
				console.error("Failed to load code block:", err);
				setError(err instanceof Error ? err.message : "Unknown error");
			}
		};

		loadBlock();
	}, [code, lang, id]);

	if (error) {
		return (
			<div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
				<p className="text-destructive text-sm font-medium">Error loading code block</p>
				<p className="text-destructive/80 text-xs mt-1">{error}</p>
				<pre className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto max-h-40">
					{code}
				</pre>
			</div>
		);
	}

	if (!block) {
		return (
			<div className="p-4 border border-border bg-muted/30 rounded-lg animate-pulse">
				<div className="h-4 bg-muted rounded w-3/4 mb-2" />
				<div className="h-4 bg-muted rounded w-1/2" />
			</div>
		);
	}

	return (
		<CodeBlockClient
			code={code}
			lightHtml={block.lightHtml}
			darkHtml={block.darkHtml}
			maxHeight={maxHeight}
			className={className}
		/>
	);
}
