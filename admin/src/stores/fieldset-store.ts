/**
 * Fieldset Store
 *
 * @package OpenFields
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Fieldset, Field, FieldsetStore } from '../types';
import { fieldsetApi, fieldApi } from '../api';

interface ExtendedFieldsetStore extends FieldsetStore {
	fields: Field[];
	fetchFields: (fieldsetId: number) => Promise<void>;
	addField: (fieldsetId: number, field: Partial<Field>) => Promise<Field>;
	updateField: (id: number, data: Partial<Field>) => Promise<void>;
	deleteField: (id: number) => Promise<void>;
	reorderFields: (fieldsetId: number, fields: { id: number; menu_order: number }[]) => Promise<void>;
}

export const useFieldsetStore = create<ExtendedFieldsetStore>()(
	devtools(
		(set, get) => ({
			fieldsets: [],
			currentFieldset: null,
			fields: [],
			isLoading: false,
			error: null,

			fetchFieldsets: async () => {
				set({ isLoading: true, error: null });
				try {
					const fieldsets = await fieldsetApi.getAll();
					set({ fieldsets, isLoading: false });
				} catch (error) {
					set({
						error: error instanceof Error ? error.message : 'Failed to fetch fieldsets',
						isLoading: false,
					});
				}
			},

			fetchFieldset: async (id: number) => {
				set({ isLoading: true, error: null });
				try {
					const fieldset = await fieldsetApi.get(id);
					set({ currentFieldset: fieldset, isLoading: false });
					// Also fetch fields
					await get().fetchFields(id);
				} catch (error) {
					set({
						error: error instanceof Error ? error.message : 'Failed to fetch fieldset',
						isLoading: false,
					});
				}
			},

			createFieldset: async (data: Partial<Fieldset>) => {
				set({ isLoading: true, error: null });
				try {
					const fieldset = await fieldsetApi.create(data);
					set((state) => ({
						fieldsets: [...state.fieldsets, fieldset],
						isLoading: false,
					}));
					return fieldset;
				} catch (error) {
					set({
						error: error instanceof Error ? error.message : 'Failed to create fieldset',
						isLoading: false,
					});
					throw error;
				}
			},

			updateFieldset: async (id: number, data: Partial<Fieldset>) => {
				set({ isLoading: true, error: null });
				try {
					const updatedFieldset = await fieldsetApi.update(id, data);
					set((state) => ({
						fieldsets: state.fieldsets.map((fs) =>
							fs.id === id ? updatedFieldset : fs
						),
						currentFieldset:
							state.currentFieldset?.id === id
								? updatedFieldset
								: state.currentFieldset,
						isLoading: false,
					}));
				} catch (error) {
					set({
						error: error instanceof Error ? error.message : 'Failed to update fieldset',
						isLoading: false,
					});
					throw error;
				}
			},

			deleteFieldset: async (id: number) => {
				set({ isLoading: true, error: null });
				try {
					await fieldsetApi.delete(id);
					set((state) => ({
						fieldsets: state.fieldsets.filter((fs) => fs.id !== id),
						currentFieldset:
							state.currentFieldset?.id === id ? null : state.currentFieldset,
						isLoading: false,
					}));
				} catch (error) {
					set({
						error: error instanceof Error ? error.message : 'Failed to delete fieldset',
						isLoading: false,
					});
					throw error;
				}
			},

			duplicateFieldset: async (id: number) => {
				set({ isLoading: true, error: null });
				try {
					const fieldset = await fieldsetApi.duplicate(id);
					set((state) => ({
						fieldsets: [...state.fieldsets, fieldset],
						isLoading: false,
					}));
					return fieldset;
				} catch (error) {
					set({
						error: error instanceof Error ? error.message : 'Failed to duplicate fieldset',
						isLoading: false,
					});
					throw error;
				}
			},

			setCurrentFieldset: (fieldset: Fieldset | null) => {
				set({ currentFieldset: fieldset });
			},

			// Field operations
			fetchFields: async (fieldsetId: number) => {
				try {
					const fields = await fieldApi.getByFieldset(fieldsetId);
					set({ fields });
				} catch (error) {
					console.error('Failed to fetch fields:', error);
				}
			},

			addField: async (fieldsetId: number, field: Partial<Field>) => {
				const newField = await fieldApi.create(fieldsetId, field);
				set((state) => ({
					fields: [...state.fields, newField],
				}));
				return newField;
			},

			updateField: async (id: number, data: Partial<Field>) => {
				const updatedField = await fieldApi.update(id, data);
				set((state) => ({
					fields: state.fields.map((f) => (f.id === id ? updatedField : f)),
				}));
			},

			deleteField: async (id: number) => {
				await fieldApi.delete(id);
				set((state) => ({
					fields: state.fields.filter((f) => f.id !== id),
				}));
			},

			reorderFields: async (
				fieldsetId: number,
				fields: { id: number; menu_order: number }[]
			) => {
				await fieldApi.bulkUpdate(fieldsetId, fields);
				// Refetch to ensure correct order
				await get().fetchFields(fieldsetId);
			},
		}),
		{ name: 'openfields-fieldset-store' }
	)
);
