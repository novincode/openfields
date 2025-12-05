"use client";

import { useState } from "react";
import {
	RiInputField,
	RiTextWrap,
	RiHashtag,
	RiMailLine,
	RiLink,
	RiFileTextLine,
	RiImageLine,
	RiGalleryLine,
	RiFileLine,
	RiArrowDownSLine,
	RiRadioButtonLine,
	RiCheckboxLine,
	RiToggleLine,
	RiCalendarLine,
	RiTimeLine,
	RiPaletteLine,
	RiExternalLinkLine,
	RiArticleLine,
	RiPriceTag3Line,
	RiUserLine,
	RiRepeatLine,
	RiFolderOpenLine,
} from "react-icons/ri";
import { FIELD_TYPES, FIELD_CATEGORIES, type FieldCategory } from "@/lib/data";
import { cn } from "@/lib/utils";

// Map icon strings to actual components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
	Type: RiInputField,
	AlignLeft: RiTextWrap,
	Hash: RiHashtag,
	Mail: RiMailLine,
	Link: RiLink,
	FileText: RiFileTextLine,
	Image: RiImageLine,
	Images: RiGalleryLine,
	File: RiFileLine,
	ChevronDown: RiArrowDownSLine,
	Circle: RiRadioButtonLine,
	CheckSquare: RiCheckboxLine,
	ToggleLeft: RiToggleLine,
	Calendar: RiCalendarLine,
	CalendarClock: RiCalendarLine,
	Clock: RiTimeLine,
	Palette: RiPaletteLine,
	ExternalLink: RiExternalLinkLine,
	Tags: RiPriceTag3Line,
	User: RiUserLine,
	Repeat: RiRepeatLine,
	FolderOpen: RiFolderOpenLine,
};

function FieldCard({ type, label, icon, description }: { type: string; label: string; icon: string; description: string }) {
	const IconComponent = ICON_MAP[icon] || RiArticleLine;

	return (
		<div className="group flex items-start gap-3 p-3 rounded-lg border border-transparent hover:border-border hover:bg-secondary/50 transition-colors cursor-default">
			<div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary border border-border text-muted-foreground group-hover:text-foreground group-hover:border-primary/30 transition-colors">
				<IconComponent className="size-4" />
			</div>
			<div className="min-w-0">
				<p className="font-medium text-sm text-foreground">{label}</p>
				<p className="text-xs text-muted-foreground truncate">{description}</p>
			</div>
		</div>
	);
}

export function FieldsSection() {
	const [activeCategory, setActiveCategory] = useState<FieldCategory | "all">("all");

	const filteredFields = activeCategory === "all" 
		? FIELD_TYPES 
		: FIELD_TYPES.filter((f) => f.category === activeCategory);

	return (
		<section className="border-t border-border">
			<div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20">
				{/* Header */}
				<div className="text-center mb-10">
					<h2 className="text-2xl sm:text-3xl font-bold text-foreground">
						{FIELD_TYPES.length} Field Types
					</h2>
					<p className="mt-2 text-muted-foreground">
						Everything you need. All free. Forever.
					</p>
				</div>

				{/* Category Filter */}
				<div className="flex flex-wrap justify-center gap-2 mb-8">
					<button
						onClick={() => setActiveCategory("all")}
						className={cn(
							"px-3 py-1.5 text-sm rounded-md border transition-colors",
							activeCategory === "all"
								? "bg-foreground text-background border-foreground"
								: "bg-background text-muted-foreground border-border hover:border-foreground/30"
						)}
					>
						All
					</button>
					{FIELD_CATEGORIES.map((cat) => (
						<button
							key={cat.key}
							onClick={() => setActiveCategory(cat.key)}
							className={cn(
								"px-3 py-1.5 text-sm rounded-md border transition-colors",
								activeCategory === cat.key
									? "bg-foreground text-background border-foreground"
									: "bg-background text-muted-foreground border-border hover:border-foreground/30"
							)}
						>
							{cat.label}
						</button>
					))}
				</div>

				{/* Fields Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
					{filteredFields.map((field) => (
						<FieldCard
							key={field.type}
							type={field.type}
							label={field.label}
							icon={field.icon}
							description={field.description}
						/>
					))}
				</div>

				{/* Note */}
				<p className="mt-8 text-center text-sm text-muted-foreground">
					More field types coming soon. All included in the free version.
				</p>
			</div>
		</section>
	);
}
