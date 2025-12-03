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
	// Change tracking - only stage changes locally until save
	unsavedChanges: boolean;
	pendingFieldChanges: Map<string, Partial<Field>>;
	pendingFieldAdditions: Field[]; // New fields waiting to be saved
	pendingFieldDeletions: string[]; // Field IDs waiting to be deleted
	// Actions
	setUnsavedChanges: (value: boolean) => void;
	fetchFields: (fieldsetId: number) => Promise<void>;
	addFieldLocal: (field: Partial<Field>) => void;
	updateFieldLocal: (id: string, data: Partial<Field>) => void;
	deleteFieldLocal: (id: string) => void;
	reorderFieldsLocal: (fields: Field[]) => void;
	saveAllChanges: () => Promise<void>;
}

export const useFieldsetStore = create<ExtendedFieldsetStore>()(
	devtools(
		(set, get) => ({
			fieldsets: [],
			currentFieldset: null,
			fields: [],
			isLoading: false,
			error: null,
			// Change tracking - stage all changes locally
			unsavedChanges: false,
			pendingFieldChanges: new Map<string, Partial<Field>>(),
			pendingFieldAdditions: [],
			pendingFieldDeletions: [],

			setUnsavedChanges: (value: boolean) => {
				set({ unsavedChanges: value });
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

			// Add field locally (don't save to API yet)
			addFieldLocal: (field: Partial<Field>) => {
				const newField: Field = {
					id: `temp-${Date.now()}-${Math.random()}`,
					label: field.label || 'New Field',
					name: field.name || `field_${Date.now()}`,
					type: field.type || 'text',
					settings: field.settings || {},
					...field,
				} as Field;
				
				set((state) => ({
					fields: [...state.fields, newField],
					pendingFieldAdditions: [...state.pendingFieldAdditions, newField],
					unsavedChanges: true,
				}));
			},

		// Update field locally (don't save to API yet)
		updateFieldLocal: (id: string, data: Partial<Field>) => {
			set((state) => {
				const pending = new Map(state.pendingFieldChanges);
				const fieldIdStr = String(id);
				const existing = pending.get(fieldIdStr) || {};
				
				// Merge settings - keep ALL values including empty/null/undefined
				// The API transform will handle sending them correctly
				const mergedSettings = {
					...existing.settings,
					...data.settings,
				};
				
				pending.set(fieldIdStr, {
					...existing,
					...data,
					settings: mergedSettings,
				});

				// Update the field in state
				const updatedFields = state.fields.map((f) => 
					String(f.id) === fieldIdStr
						? { 
							...f, 
							...data, 
							settings: { ...f.settings, ...data.settings }
						}
						: f
				);

				return {
					fields: updatedFields,
					pendingFieldChanges: pending,
					unsavedChanges: true,
				};
			});
		},

		// Delete field locally (don't save to API yet)
		deleteFieldLocal: (id: string) => {
			set((state) => {
				const fieldIdStr = String(id);
				
				return {
					fields: state.fields.filter((f) => String(f.id) !== fieldIdStr),
					pendingFieldDeletions: [...state.pendingFieldDeletions, fieldIdStr],
					pendingFieldAdditions: state.pendingFieldAdditions.filter(
						(f) => String(f.id) !== fieldIdStr
					),
					unsavedChanges: true,
				};
			});
			},

			// Reorder fields locally
			reorderFieldsLocal: (reorderedFields: Field[]) => {
				set({
					fields: reorderedFields,
					unsavedChanges: true,
				});
			},

			// Save all changes to API
			saveAllChanges: async () => {
				const { 
					pendingFieldChanges, 
					pendingFieldAdditions, 
					pendingFieldDeletions,
					fields,
					currentFieldset,
				} = get();
				
			if (!currentFieldset) {
				throw new Error('No fieldset selected');
			}

			try {
				// Don't set isLoading - we don't want the whole page to re-render
				const promises: Promise<any>[] = [];					// Delete fields marked for deletion
					for (const fieldId of pendingFieldDeletions) {
						// Only delete if it's not a new field (temp ID)
						if (!fieldId.startsWith('temp-')) {
							promises.push(fieldApi.delete(Number(fieldId)));
						}
					}

				// Add new fields
				for (const newField of pendingFieldAdditions) {
					// Check if this new field has been modified - merge changes
					const fieldIdStr = String(newField.id);
					const changes = pendingFieldChanges.get(fieldIdStr);
					
					// Get the latest version from fields state (which has all updates applied)
					const latestField = fields.find((f) => String(f.id) === fieldIdStr) || newField;
					
					const fieldData = {
						label: changes?.label || latestField.label || newField.label,
						name: changes?.name || latestField.name || newField.name,
						type: changes?.type || latestField.type || newField.type,
						settings: latestField.settings || newField.settings || {},
						menu_order: fields.indexOf(latestField),
					};
					promises.push(
						fieldApi.create(currentFieldset.id, fieldData).then((createdField) => {
							// Update temp ID with real ID
							set((state) => ({
								fields: state.fields.map((f) => 
									f.id === newField.id ? createdField : f
								),
							}));
							return createdField;
						})
					);
				}				// Update modified fields
				pendingFieldChanges.forEach((changes, fieldId) => {
					// Only update if it's not a new field
					if (!fieldId.startsWith('temp-')) {
						const numericId = Number(fieldId);
						const field = fields.find((f) => String(f.id) === fieldId);
						if (field) {
							// Merge settings - keep all values including empty strings
							// The API transform will handle the conversion
							const mergedSettings = { ...field.settings, ...changes.settings };
							
							const mergedData = {
								label: changes.label || field.label,
								name: changes.name || field.name,
								type: changes.type || field.type,
								settings: mergedSettings,
								menu_order: fields.indexOf(field),
							};
							promises.push(fieldApi.update(numericId, mergedData));
						}
					}
				});

				// Wait for all operations
				await Promise.all(promises);

				// DO NOT refetch - keep UI state intact
				// Just clear pending changes since everything was saved
				set({
					pendingFieldChanges: new Map(),
					pendingFieldAdditions: [],
					pendingFieldDeletions: [],
					unsavedChanges: false,
				});
			} catch (error) {
				set({
					error: error instanceof Error ? error.message : 'Failed to save fields',
				});
				throw error;
			}
		},
	}),
		{ name: 'openfields-fieldset-store' }
	)
);
