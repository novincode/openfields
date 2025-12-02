/**
 * UI Store
 *
 * @package OpenFields
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { UIStore, Notification } from '../types';

interface ExtendedUIStore extends UIStore {
	theme: 'light' | 'dark' | 'system';
	setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<ExtendedUIStore>()(
	devtools(
		persist(
			(set) => ({
				sidebarOpen: true,
				activePanel: 'fields',
				notifications: [],
				theme: 'system',

				toggleSidebar: () => {
					set((state) => ({ sidebarOpen: !state.sidebarOpen }));
				},

				setActivePanel: (panel) => {
					set({ activePanel: panel });
				},

				addNotification: (notification) => {
					const id = crypto.randomUUID();
					const newNotification: Notification = {
						...notification,
						id,
						duration: notification.duration ?? 5000,
					};

					set((state) => ({
						notifications: [...state.notifications, newNotification],
					}));

					// Auto-remove after duration
					if (newNotification.duration && newNotification.duration > 0) {
						setTimeout(() => {
							set((state) => ({
								notifications: state.notifications.filter((n) => n.id !== id),
							}));
						}, newNotification.duration);
					}
				},

				removeNotification: (id) => {
					set((state) => ({
						notifications: state.notifications.filter((n) => n.id !== id),
					}));
				},

				setTheme: (theme) => {
					set({ theme });
				},
			}),
			{
				name: 'openfields-ui-store',
				partialize: (state) => ({
					sidebarOpen: state.sidebarOpen,
					theme: state.theme,
				}),
			}
		),
		{ name: 'openfields-ui-store' }
	)
);
