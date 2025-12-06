"use client";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CodeBlockRegistry } from "../../components/code-block-registry";

export default function ArchitecturePageClient() {
	return (
		<div className="space-y-8 max-w-3xl">
			<header className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">Architecture</h1>
				<p className="text-lg text-muted-foreground">
					How OpenFields works under the hood.
				</p>
			</header>

			<Separator />

			{/* Overview */}
			<section className="space-y-4">
				<h2 className="text-xl font-semibold">Overview</h2>
				<p className="text-muted-foreground">
					OpenFields consists of two main parts:
				</p>
				<ul className="list-disc list-inside space-y-1 text-muted-foreground">
					<li><strong>PHP Plugin</strong> — Handles field storage, REST API, and meta box rendering</li>
					<li><strong>React Admin</strong> — Modern UI for managing field groups and fields</li>
				</ul>
			</section>

			<Separator />

			{/* Database */}
			<section className="space-y-4">
				<h2 className="text-xl font-semibold">Database Schema</h2>
				<p className="text-muted-foreground">
					OpenFields uses three custom tables:
				</p>
				
				<h3 className="text-lg font-medium pt-2">wp_openfields_fieldsets</h3>
				<p className="text-sm text-muted-foreground">Stores field group definitions.</p>
				<CodeBlockRegistry
					id="arch-table-fieldsets"
					lang="sql"
					code={`CREATE TABLE wp_openfields_fieldsets (
  id bigint PRIMARY KEY,
  title varchar(255),        -- Display name
  field_key varchar(100),    -- Unique slug
  status varchar(20),        -- 'active' or 'inactive'
  settings longtext,         -- JSON: position, priority
  menu_order int
);`}
				/>

				<h3 className="text-lg font-medium pt-4">wp_openfields_fields</h3>
				<p className="text-sm text-muted-foreground">Stores field definitions within groups.</p>
				<CodeBlockRegistry
					id="arch-table-fields"
					lang="sql"
					code={`CREATE TABLE wp_openfields_fields (
  id bigint PRIMARY KEY,
  fieldset_id bigint,        -- FK to fieldsets
  parent_id bigint,          -- For repeater sub-fields
  label varchar(255),        -- Display name
  name varchar(100),         -- Meta key
  type varchar(50),          -- text, select, etc.
  field_config longtext,     -- JSON: type-specific settings
  wrapper_config longtext,   -- JSON: width, class, id
  conditional_logic longtext,-- JSON: visibility rules
  menu_order int
);`}
				/>

				<h3 className="text-lg font-medium pt-4">wp_openfields_locations</h3>
				<p className="text-sm text-muted-foreground">Stores where field groups appear.</p>
				<CodeBlockRegistry
					id="arch-table-locations"
					lang="sql"
					code={`CREATE TABLE wp_openfields_locations (
  id bigint PRIMARY KEY,
  fieldset_id bigint,        -- FK to fieldsets
  param varchar(100),        -- post_type, taxonomy, etc.
  operator varchar(10),      -- '==' or '!='
  value varchar(255),        -- The match value
  group_id int               -- For AND/OR grouping
);`}
				/>
			</section>

			<Separator />

			{/* Meta Storage */}
			<section className="space-y-4">
				<h2 className="text-xl font-semibold">Meta Storage</h2>
				<p className="text-muted-foreground">
					Field values are stored in standard WordPress meta tables:
				</p>
				<ul className="list-disc list-inside space-y-1 text-muted-foreground">
					<li><code className="bg-muted px-1 rounded">wp_postmeta</code> — for posts/pages</li>
					<li><code className="bg-muted px-1 rounded">wp_usermeta</code> — for users</li>
					<li><code className="bg-muted px-1 rounded">wp_termmeta</code> — for taxonomy terms</li>
				</ul>
				<p className="text-sm text-muted-foreground mt-2">
					Values are stored directly under the field name (no prefix), making them ACF-compatible.
				</p>
			</section>

			<Separator />

			{/* REST API */}
			<section className="space-y-4">
				<h2 className="text-xl font-semibold">REST API</h2>
				<p className="text-muted-foreground">
					The React admin communicates with WordPress via REST API.
				</p>
				<CodeBlockRegistry
					id="arch-rest-endpoints"
					lang="text"
					code={`# Field Groups
GET    /wp-json/openfields/v1/fieldsets
POST   /wp-json/openfields/v1/fieldsets
GET    /wp-json/openfields/v1/fieldsets/:id
PUT    /wp-json/openfields/v1/fieldsets/:id
DELETE /wp-json/openfields/v1/fieldsets/:id

# Fields
GET    /wp-json/openfields/v1/fieldsets/:id/fields
POST   /wp-json/openfields/v1/fieldsets/:id/fields
PUT    /wp-json/openfields/v1/fields/:id
DELETE /wp-json/openfields/v1/fields/:id`}
				/>
			</section>

			<Separator />

			{/* Location Matching */}
			<section className="space-y-4">
				<h2 className="text-xl font-semibold">Location Matching</h2>
				<p className="text-muted-foreground">
					When WordPress loads a post edit screen, OpenFields determines which field groups to show:
				</p>
				<ol className="list-decimal list-inside space-y-1 text-muted-foreground">
					<li>Get the context (post type, template, etc.)</li>
					<li>Query all active field groups</li>
					<li>For each group, evaluate location rules</li>
					<li>Rules in the same group use AND logic</li>
					<li>Different groups use OR logic</li>
				</ol>
				<CodeBlockRegistry
					id="arch-location-example"
					lang="php"
					code={`// Example: Show on (Page AND Default Template) OR (Post)
// Group 0: post_type == page AND template == default
// Group 1: post_type == post`}
				/>
			</section>

			<Separator />

			{/* Tech Stack */}
			<section className="space-y-4 pb-8">
				<h2 className="text-xl font-semibold">Technology Stack</h2>
				<div className="flex flex-wrap gap-2">
					<Badge variant="secondary">PHP 7.4+</Badge>
					<Badge variant="secondary">WordPress 6.0+</Badge>
					<Badge variant="secondary">React 18</Badge>
					<Badge variant="secondary">TypeScript</Badge>
					<Badge variant="secondary">Zustand</Badge>
					<Badge variant="secondary">Tailwind CSS</Badge>
					<Badge variant="secondary">Vite</Badge>
					<Badge variant="secondary">shadcn/ui</Badge>
				</div>
			</section>
		</div>
	);
}
