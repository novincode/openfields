/**
 * Main App Component
 *
 * @package OpenFields
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import FieldsetList from './pages/FieldsetList';
import { FieldsetEditor } from '@/pages/FieldsetEditor';
import Tools from './pages/Tools';

// Create a query client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 1,
		},
	},
});

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<div className="openfields-admin">
				<OpenFieldsRouter />
			</div>
			<Toaster />
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

	// Only handle openfields pages
	if (!page?.startsWith('openfields')) {
		return null;
	}

	// Route based on page and action
	if (page === 'openfields') {
		if (action === 'edit' && id) {
			return <FieldsetEditor fieldsetId={parseInt(id, 10)} />;
		}
		if (action === 'new') {
			return <FieldsetEditor isNew />;
		}
		return <FieldsetList />;
	}

	if (page === 'openfields-tools') {
		return <Tools />;
	}

	return <FieldsetList />;
}

export default App;
