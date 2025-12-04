/**
 * Main App Component
 *
 * @package OpenFields
 */

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Heart, ExternalLink, List, Settings as SettingsIcon, Download } from 'lucide-react';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from './components/ui/sonner';
import FieldsetList from './pages/FieldsetList';
import FieldsetEditor from './pages/FieldsetEditor/index';
import Tools from './pages/Tools';
import Settings from './pages/Settings';

// Register all field type settings components
import './fields';
import { cn } from './lib/utils';

// Create a query client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 1,
		},
	},
});

type TabType = 'fieldsets' | 'settings' | 'tools';

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<div className={cn(
				'openfields-admin',
				''
			)}>
				<OpenFieldsRouter />
			</div>
			<Toaster />
			<SonnerToaster position="bottom-right" />
		</QueryClientProvider>
	);
}

/**
 * Handle WordPress admin query string routing
 */
function OpenFieldsRouter() {
	const params = new URLSearchParams(window.location.search);
	const page = params.get('page');
	const action = params.get('action');
	const id = params.get('id');
	const tab = params.get('tab') as TabType | null;

	// Only handle openfields pages
	if (!page?.startsWith('openfields')) {
		return null;
	}

	// If editing a fieldset, show the editor directly
	if (page === 'openfields' && action === 'edit' && id) {
		return <FieldsetEditor fieldsetId={parseInt(id, 10)} />;
	}

	if (page === 'openfields' && action === 'new') {
		return <FieldsetEditor isNew />;
	}

	// Otherwise show the main tabbed layout
	return <MainLayout initialTab={tab || 'fieldsets'} />;
}

interface MainLayoutProps {
	initialTab: TabType;
}

function MainLayout({ initialTab }: MainLayoutProps) {
	const [activeTab, setActiveTab] = useState<TabType>(initialTab);

	// Update URL when tab changes
	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab);
		const url = new URL(window.location.href);
		if (tab === 'fieldsets') {
			url.searchParams.delete('tab');
		} else {
			url.searchParams.set('tab', tab);
		}
		window.history.pushState({}, '', url.toString());
	};

	// Handle browser back/forward
	useEffect(() => {
		const handlePopState = () => {
			const params = new URLSearchParams(window.location.search);
			const tab = params.get('tab') as TabType | null;
			setActiveTab(tab || 'fieldsets');
		};
		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, []);

	const tabs = [
		{ id: 'fieldsets' as const, label: 'Field Groups', icon: List },
		{ id: 'settings' as const, label: 'Settings', icon: SettingsIcon },
		{ id: 'tools' as const, label: 'Import / Export', icon: Download },
	];

	return (
		<div className="openfields-main-layout -ml-5">
			{/* Header */}
			<header className="bg-white border-b border-gray-200 px-6 py-4">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-xl font-bold text-gray-900">
							OpenFields
						</h1>
						<p className="text-sm text-gray-500 mt-0.5">
							Open Source Custom Fields Management
						</p>
					</div>
					<a
						href="https://openfields.dev/support"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
					>
						<Heart className="h-4 w-4" />
						<span>Support this project</span>
						<ExternalLink className="h-3 w-3" />
					</a>
				</div>
				<p className="text-xs text-gray-400 mt-2">
					This plugin is free and will be free, your support will keep it going.
				</p>
			</header>

			{/* Tabs */}
			<nav className="bg-white border-b border-gray-200 px-6">
				<div className="flex gap-1">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => handleTabChange(tab.id)}
							className={cn(
								'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
								activeTab === tab.id
									? 'border-primary text-primary'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							)}
						>
							<tab.icon className="h-4 w-4" />
							{tab.label}
						</button>
					))}
				</div>
			</nav>

			{/* Tab Content */}
			<main className="p-6 bg-gray-50 min-h-[calc(100vh-200px)]">
				{activeTab === 'fieldsets' && <FieldsetList />}
				{activeTab === 'settings' && <Settings />}
				{activeTab === 'tools' && <Tools />}
			</main>
		</div>
	);
}

export default App;
