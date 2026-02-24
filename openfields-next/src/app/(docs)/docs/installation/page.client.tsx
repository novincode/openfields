"use client";

import { Separator } from "@/components/ui/separator";
import { CodeBlockRegistry } from "../../components/code-block-registry";

export default function InstallationPageClient() {
	return (
		<div className="space-y-8 max-w-3xl">
			<header className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">Installation</h1>
				<p className="text-lg text-muted-foreground">
					Get OpenFields up and running on your WordPress site.
				</p>
			</header>

			<Separator />

			{/* Requirements */}
			<section className="space-y-4">
				<h2 className="text-xl font-semibold">Requirements</h2>
				<ul className="list-disc list-inside space-y-1 text-muted-foreground">
					<li>WordPress 6.0 or higher</li>
					<li>PHP 7.4 or higher</li>
				</ul>
			</section>

			<Separator />

			{/* Install via WordPress */}
			<section className="space-y-4">
				<h2 className="text-xl font-semibold">Install from WordPress.org</h2>
				<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
					<li>Go to <strong>Plugins → Add New</strong> in your WordPress admin</li>
					<li>Search for &quot;OpenFields&quot;</li>
					<li>Click <strong>Install Now</strong></li>
					<li>Click <strong>Activate</strong></li>
				</ol>
			</section>

			<Separator />

			{/* Manual Install */}
			<section className="space-y-4">
				<h2 className="text-xl font-semibold">Manual Installation</h2>
				<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
					<li>Download the plugin from <a href="https://wordpress.org/plugins/codeideal-open-fields/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">WordPress.org</a> or <a href="https://github.com/novincode/openfields/releases" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">GitHub Releases</a></li>
					<li>Upload the <code className="bg-muted px-1.5 py-0.5 rounded text-sm">openfields</code> folder to <code className="bg-muted px-1.5 py-0.5 rounded text-sm">/wp-content/plugins/</code></li>
					<li>Activate through the Plugins menu in WordPress</li>
				</ol>
			</section>

			<Separator />

			{/* First Steps */}
			<section className="space-y-4">
				<h2 className="text-xl font-semibold">First Steps</h2>
				<p className="text-muted-foreground">
					After activation, go to <strong>Tools → OpenFields</strong> to create your first field group.
				</p>
				<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
					<li>Click <strong>Add Field Group</strong></li>
					<li>Name your field group (e.g., &quot;Page Settings&quot;)</li>
					<li>Add fields using the field selector</li>
					<li>Set location rules (e.g., show on all Pages)</li>
					<li>Save and edit a page to see your fields</li>
				</ol>
			</section>

			<Separator />

			{/* Using Fields */}
			<section className="space-y-4">
				<h2 className="text-xl font-semibold">Using Field Values in Templates</h2>
				<p className="text-muted-foreground">
					Once you&apos;ve saved field values on a post/page, retrieve them in your theme:
				</p>
				<CodeBlockRegistry
					id="install-basic-usage"
					lang="php"
					code={`<?php
// Get a field value
\$subtitle = get_field('subtitle');
if (\$subtitle) {
    echo '<p class="subtitle">' . esc_html(\$subtitle) . '</p>';
}

// Or output directly (auto-escaped)
the_field('author_bio');`}
				/>
				<p className="text-sm text-muted-foreground">
					See the <a href="/docs/api" className="text-primary hover:underline">API Reference</a> for all available functions.
				</p>
			</section>
		</div>
	);
}
