/**
 * OpenFields Admin Entry Point
 *
 * @package OpenFields
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/main.css';

// Mount the app
const rootElement = document.getElementById('openfields-admin');

if (rootElement) {
	const root = createRoot(rootElement);
	root.render(
		<StrictMode>
			<App />
		</StrictMode>
	);
}
