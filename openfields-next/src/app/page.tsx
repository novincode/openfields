import { Header, Footer } from "@/components/layout";
import { HeroSection, FieldsSection, DownloadSection, SponsorsSection } from "@/components/sections";

export default function Home() {
	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1">
				<HeroSection />
				<FieldsSection />
				<DownloadSection />
				<SponsorsSection />
			</main>
			<Footer />
		</div>
	);
}
