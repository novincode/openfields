"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

interface ProvidersProps {
	children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
	return (
		<ThemeProvider attribute="class" defaultTheme="light" enableSystem>
			{children}
		</ThemeProvider>
	);
}
