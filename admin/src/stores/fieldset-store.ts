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
	// Change tracking
	unsavedChanges: boolean;
	pendingFieldChanges: Map<number, Partial<Field>>;
	// Actions
	setUnsavedChanges: (value: boolean) => void;
	markFieldChanged: (fieldId: number, changes: Partial<Field>) => void;
	fetchFields: (fieldsetId: number) => Promise<void>;
	addField: (fieldsetId: number, field: Partial<Field>) => Promise<Field>;
	updateField: (id: number, data: Partial<Field>) => Promise<void>;
	updateFieldLocal: (id: number, data: Partial<Field>) => void;
	deleteField: (id: number) => Promise<void>;
	reorderFields: (fieldsetId: number, fields: { id: number; menu_order: number }[]) => Promise<void>;
	saveAllPendingChanges: () => Promise<void>;
}

export const useFieldsetStore = create<ExtendedFieldsetStore>()(
	devtools(
		(set, get) => ({
			fieldsets: [],
			currentFieldset: null,
			fields: [],
			isLoading: false,
			error: null,
			// Change tracking
			unsavedChanges: false,
			pendingFieldChanges: new Map(),

			setUnsavedChanges: (value: boolean) => {
				set({ unsavedChanges: value });
			},

			markFieldChanged: (fieldId: number, changes: Partial<Field>) => {
				const pending = new Map(get().pendingFieldChanges);
				const existing = pending.get(fieldId) || {};
				pending.set(fieldId, { ...existing, ...changes });
				set({ pendingFieldChanges: pending, unsavedChanges: true });
			},

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
				// Clear pending changes for this field after successful save
				const pending = new Map(get().pendingFieldChanges);
				pending.delete(id);
				set((state) => ({
					fields: state.fields.map((f) => (f.id === id ? updatedField : f)),
					pendingFieldChanges: pending,
				}));
			},

			// Update field locally without saving to API (for tracking changes)
			updateFieldLocal: (id: number, data: Partial<Field>) => {
				set((state) => ({
					fields: state.fields.map((f) => 
						f.id === id 
							? { ...f, ...data, settings: { ...f.settings, ...data.settings } } 
							: f
					),
					unsavedChanges: true,
				}));
				// Track this change
				get().markFieldChanged(id, data);
			},

			deleteField: async (id: number) => {
				await fieldApi.delete(id);
				const pending = new Map(get().pendingFieldChanges);
				pending.delete(id);
				set((state) => ({
					fields: state.fields.filter((f) => f.id !== id),
					pendingFieldChanges: pending,
				}));
			},

			reorderFields: async (
				fieldsetId: number,
				fields: { id: number; menu_order: number }[]
			) => {
				set({ unsavedChanges: true });
				await fieldApi.bulkUpdate(fieldsetId, fields);
				// Refetch to ensure correct order
				await get().fetchFields(fieldsetId);
			},

			// Save all pending field changes to API
			saveAllPendingChanges: async () => {
				const { pendingFieldChanges, fields } = get();
				const promises: Promise<void>[] = [];
				
				pendingFieldChanges.forEach((changes, fieldId) => {
					const field = fields.find((f) => f.id === fieldId);
					if (field) {
						// Merge current field with pending changes
						const mergedData = {
							...changes,
							settings: {
								...field.settings,
								...changes.settings,
							},
						};
						promises.push(
							fieldApi.update(fieldId, mergedData).then((updatedField) => {
								set((state) => ({
									fields: state.fields.map((f) => (f.id === fieldId ? updatedField : f)),
								}));
							})
						);
					}
				});
				
				await Promise.all(promises);
				set({ pendingFieldChanges: new Map(), unsavedChanges: false });
			},
		}),
		{ name: 'openfields-fieldset-store' }
	)
);
