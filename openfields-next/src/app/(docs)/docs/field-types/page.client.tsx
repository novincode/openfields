"use client";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FIELD_TYPES, FIELD_CATEGORIES, type FieldType, type FieldCategory } from "@/lib/data";

function FieldCard({ field }: { field: FieldType }) {
	return (
		<Card className="h-full">
			<CardHeader className="pb-2">
				<CardTitle className="text-base flex items-center justify-between">
					{field.label}
					<Badge variant="outline" className="font-normal text-xs">
						{field.type}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-muted-foreground">{field.description}</p>
			</CardContent>
		</Card>
	);
}

function FieldCategory({ category, fields }: { category: string; fields: FieldType[] }) {
	return (
		<section className="space-y-4">
			<h2 className="text-xl font-semibold">{category}</h2>
			<div className="grid sm:grid-cols-2 gap-4">
				{fields.map((field) => (
					<FieldCard key={field.type} field={field} />
				))}
			</div>
		</section>
	);
}

export default function FieldTypesPageClient() {
	return (
		<div className="space-y-8 max-w-3xl">
			<header className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">Field Types</h1>
				<p className="text-lg text-muted-foreground">
					OpenFields supports {FIELD_TYPES.length} field types to cover all your content needs.
				</p>
			</header>

			<Separator />

			{FIELD_CATEGORIES.map((category) => {
				const fields = FIELD_TYPES.filter((f) => f.category === category.key);
				if (fields.length === 0) return null;
				return (
					<div key={category.key}>
						<FieldCategory category={category.label} fields={fields} />
						<Separator className="mt-8" />
					</div>
				);
			})}

			{/* Usage Tip */}
			<section className="space-y-4 pb-8">
				<h2 className="text-xl font-semibold">Using Fields</h2>
				<p className="text-muted-foreground">
					All fields are configured in the OpenFields admin interface. Once saved, retrieve values 
					using the <a href="/docs/api" className="text-primary hover:underline">API functions</a>.
				</p>
				<p className="text-muted-foreground">
					Each field type has its own settings like placeholder text, default values, validation rules, 
					and display options. Configure these when adding a field to your field group.
				</p>
			</section>
		</div>
	);
}
