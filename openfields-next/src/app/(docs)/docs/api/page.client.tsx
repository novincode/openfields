"use client";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlockRegistry } from "../../components/code-block-registry";

export default function APIPageClient() {
	return (
		<div className="space-y-8 max-w-3xl">
			<header className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">API Reference</h1>
				<p className="text-lg text-muted-foreground">
					Template functions for retrieving and working with field values.
				</p>
				<div className="flex items-center gap-2 pt-2">
					<Badge variant="outline">ACF Compatible</Badge>
				</div>
			</header>

			<Separator />

			{/* get_field */}
			<section className="space-y-4" id="get_field">
				<h2 className="text-xl font-semibold">get_field()</h2>
				<p className="text-muted-foreground">
					Returns the value of a field. This is the most commonly used function.
				</p>
				<CodeBlockRegistry
					id="api-get-field-signature"
					lang="php"
					code={`get_field( string \$field_name, int|null \$post_id = null, bool \$format = true )`}
				/>
				<div className="space-y-2 text-sm">
					<h4 className="font-medium">Parameters</h4>
					<ul className="list-disc list-inside text-muted-foreground space-y-1">
						<li><code className="bg-muted px-1 rounded">$field_name</code> — The field name/key</li>
						<li><code className="bg-muted px-1 rounded">$post_id</code> — Post ID (defaults to current post)</li>
						<li><code className="bg-muted px-1 rounded">$format</code> — Whether to format the value</li>
					</ul>
				</div>
				<CodeBlockRegistry
					id="api-get-field-example"
					lang="php"
					code={`<?php
// Get field from current post
\$subtitle = get_field('subtitle');

// Get field from specific post
\$subtitle = get_field('subtitle', 123);

// Get field from user
\$bio = get_field('bio', 'user_5');

// Get field from term
\$color = get_field('color', 'term_42');`}
				/>
			</section>

			<Separator />

			{/* the_field */}
			<section className="space-y-4" id="the_field">
				<h2 className="text-xl font-semibold">the_field()</h2>
				<p className="text-muted-foreground">
					Outputs the value of a field (escaped). Shorthand for <code className="bg-muted px-1 rounded">echo esc_html(get_field())</code>.
				</p>
				<CodeBlockRegistry
					id="api-the-field-signature"
					lang="php"
					code={`the_field( string \$field_name, int|null \$post_id = null )`}
				/>
				<CodeBlockRegistry
					id="api-the-field-example"
					lang="php"
					code={`<h2><?php the_field('subtitle'); ?></h2>
<p><?php the_field('author_bio'); ?></p>`}
				/>
			</section>

			<Separator />

			{/* get_fields */}
			<section className="space-y-4" id="get_fields">
				<h2 className="text-xl font-semibold">get_fields()</h2>
				<p className="text-muted-foreground">
					Returns an array of all field values for the given post.
				</p>
				<CodeBlockRegistry
					id="api-get-fields-signature"
					lang="php"
					code={`get_fields( int|null \$post_id = null )`}
				/>
				<CodeBlockRegistry
					id="api-get-fields-example"
					lang="php"
					code={`<?php
\$fields = get_fields();

if (\$fields) {
    foreach (\$fields as \$name => \$value) {
        echo '<p><strong>' . esc_html(\$name) . ':</strong> ' . esc_html(\$value) . '</p>';
    }
}`}
				/>
			</section>

			<Separator />

			{/* update_field */}
			<section className="space-y-4" id="update_field">
				<h2 className="text-xl font-semibold">update_field()</h2>
				<p className="text-muted-foreground">
					Updates the value of a field programmatically.
				</p>
				<CodeBlockRegistry
					id="api-update-field-signature"
					lang="php"
					code={`update_field( string \$field_name, mixed \$value, int|null \$post_id = null )`}
				/>
				<CodeBlockRegistry
					id="api-update-field-example"
					lang="php"
					code={`<?php
// Update a text field
update_field('subtitle', 'New Subtitle', \$post_id);

// Update a number field
update_field('view_count', 150, \$post_id);

// Update user meta
update_field('company', 'Acme Inc', 'user_5');`}
				/>
			</section>

			<Separator />

			{/* delete_field */}
			<section className="space-y-4" id="delete_field">
				<h2 className="text-xl font-semibold">delete_field()</h2>
				<p className="text-muted-foreground">
					Deletes a field value.
				</p>
				<CodeBlockRegistry
					id="api-delete-field-signature"
					lang="php"
					code={`delete_field( string \$field_name, int|null \$post_id = null )`}
				/>
				<CodeBlockRegistry
					id="api-delete-field-example"
					lang="php"
					code={`<?php
delete_field('temporary_data', \$post_id);`}
				/>
			</section>

			<Separator />

			{/* Repeater Functions */}
			<section className="space-y-4" id="repeaters">
				<h2 className="text-xl font-semibold">Repeater Fields</h2>
				<p className="text-muted-foreground">
					Functions for working with repeater fields.
				</p>
				
				<h3 className="text-lg font-medium pt-4">have_rows() / the_row()</h3>
				<p className="text-muted-foreground">
					Loop through repeater rows using the WordPress-style while loop.
				</p>
				<CodeBlockRegistry
					id="api-repeater-loop"
					lang="php"
					code={`<?php
if (have_rows('team_members')) {
    echo '<ul class="team">';
    
    while (have_rows('team_members')) {
        the_row();
        
        \$name = get_sub_field('name');
        \$role = get_sub_field('role');
        \$photo = get_sub_field('photo');
        
        echo '<li>';
        echo '<img src="' . esc_url(\$photo) . '" alt="">';
        echo '<h3>' . esc_html(\$name) . '</h3>';
        echo '<p>' . esc_html(\$role) . '</p>';
        echo '</li>';
    }
    
    echo '</ul>';
}`}
				/>

				<h3 className="text-lg font-medium pt-4">get_sub_field()</h3>
				<p className="text-muted-foreground">
					Get a sub-field value from within a repeater loop.
				</p>
				<CodeBlockRegistry
					id="api-get-sub-field"
					lang="php"
					code={`<?php
// Inside a repeater loop
\$value = get_sub_field('sub_field_name');

// Output directly
the_sub_field('sub_field_name');`}
				/>

				<h3 className="text-lg font-medium pt-4">get_rows()</h3>
				<p className="text-muted-foreground">
					Get all repeater rows as an array (useful for programmatic access).
				</p>
				<CodeBlockRegistry
					id="api-get-rows"
					lang="php"
					code={`<?php
\$rows = get_rows('team_members');

if (\$rows) {
    foreach (\$rows as \$row) {
        echo esc_html(\$row['name']);
    }
}`}
				/>
			</section>

			<Separator />

			{/* Object IDs */}
			<section className="space-y-4" id="object-ids">
				<h2 className="text-xl font-semibold">Object ID Formats</h2>
				<p className="text-muted-foreground">
					The <code className="bg-muted px-1 rounded">$post_id</code> parameter accepts different formats for various object types.
				</p>
				<CodeBlockRegistry
					id="api-object-ids"
					lang="php"
					code={`<?php
// Post/Page (numeric ID)
get_field('field_name', 123);

// User (prefix with 'user_')
get_field('field_name', 'user_5');

// Term (prefix with 'term_')
get_field('field_name', 'term_42');

// Current object (null or omit)
get_field('field_name');`}
				/>
			</section>
		</div>
	);
}
