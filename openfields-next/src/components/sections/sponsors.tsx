import { RiHeartLine, RiArrowRightLine, RiUserHeartLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { SPONSORS, SOCIAL_LINKS } from "@/lib/data";

function SponsorAvatar({ name }: { name: string }) {
	const initials = name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	const colors = ["bg-primary", "bg-destructive", "bg-accent", "bg-secondary"];
	const colorIndex = name.length % colors.length;

	return (
		<div
			className={`flex size-12 items-center justify-center rounded-full ${colors[colorIndex]} text-white font-semibold text-sm`}
			title={name}
		>
			{initials}
		</div>
	);
}

export function SponsorsSection() {
	const foundingSponsors = SPONSORS.filter((s) => s.tier === "founding");

	return (
		<section className="border-t border-border">
			<div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20">
				{/* Header */}
				<div className="text-center mb-10">
					<div className="inline-flex items-center justify-center size-12 rounded-full bg-destructive/20 mb-4">
						<RiHeartLine className="size-6 text-destructive" />
					</div>
					<h2 className="text-2xl sm:text-3xl font-bold text-foreground">Sponsors</h2>
					<p className="mt-2 text-muted-foreground max-w-md mx-auto">
						Your support makes open source projects like this possible.
					</p>
				</div>

				{/* Founding Sponsors */}
				{foundingSponsors.length > 0 && (
					<div className="mb-10">
						<p className="text-xs text-muted-foreground text-center mb-4 uppercase tracking-wider">
							Founding Sponsors
						</p>
						<div className="flex justify-center gap-4">
							{foundingSponsors.map((sponsor) => (
								<div key={sponsor.name} className="flex flex-col items-center gap-2">
									<SponsorAvatar name={sponsor.name} />
									<span className="text-xs text-muted-foreground">{sponsor.name}</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Become a Sponsor */}
				<div className="flex flex-col items-center gap-4 p-6 rounded-lg border border-dashed border-border bg-secondary/30 max-w-md mx-auto">
					<RiUserHeartLine className="size-8 text-muted-foreground" />
					<div className="text-center">
						<p className="font-medium text-foreground">Become a Sponsor</p>
						<p className="text-sm text-muted-foreground mt-1">
							Support the development and get your name here.
						</p>
					</div>
					<Button variant="outline" asChild>
						<a href={SOCIAL_LINKS.sponsor} target="_blank" rel="noopener noreferrer">
							<RiHeartLine className="size-4 text-destructive" />
							<span>Sponsor on GitHub</span>
							<RiArrowRightLine className="size-4" />
						</a>
					</Button>
				</div>
			</div>
		</section>
	);
}
