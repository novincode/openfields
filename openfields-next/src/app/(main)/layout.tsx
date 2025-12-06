import { Header, Footer } from "@/components/layout";

export default function MainLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1">
				{children}
			</main>
			<Footer />
		</div>
	);
}