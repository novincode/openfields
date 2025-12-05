'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { RiMoonLine, RiSunLine } from 'react-icons/ri';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// Avoid hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<Button
				variant="ghost"
				size="icon"
				className="size-9"
				aria-label="Toggle theme"
				disabled
			>
				<RiSunLine className="size-4" />
			</Button>
		);
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			className="size-9"
			onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
			aria-label="Toggle theme"
		>
			{theme === 'dark' ? (
				<RiSunLine className="size-4" />
			) : (
				<RiMoonLine className="size-4" />
			)}
		</Button>
	);
}
