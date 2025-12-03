/**
 * Fieldset Store
 *
 * @package OpenFields
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Fieldset, Field, FieldsetStore } from '../types';
import { fieldsetApi, fieldApi } from '../api';
import { fieldRegistry } from '../lib/field-registry';

// ============================================================================
// HELPER FUNCTIONS FOR NESTED FIELDS
// ============================================================================

/**
 * Check if a field can have children based on field registry
 */
export function canHaveChildren(field: Field): boolean {
	const definition = fieldRegistry.get(field.type);
	return definition?.hasSubFields ?? false;
}

/**
 * Get root-level fields (no parent)
 */
export function getRootFields(fields: Field[]): Field[] {
	return fields.filter(f => !f.parent_id);
}

/**
 * Get children of a specific field
 */
export function getChildFields(fields: Field[], parentId: number | string): Field[] {
	return fields.filter(f => String(f.parent_id) === String(parentId))
		.sort((a, b) => a.menu_order - b.menu_order);
}

/**
 * Get all descendant IDs of a field (for cascading delete)
 */
export function getDescendantIds(fields: Field[], parentId: number | string): (number | string)[] {
	const descendants: (number | string)[] = [];
	const children = getChildFields(fields, parentId);
	
	for (const child of children) {
		descendants.push(child.id);
		descendants.push(...getDescendantIds(fields, child.id));
	}
	
	return descendants;
}

/**
 * Validate a move operation - prevent circular references
 */
export function validateMove(
	fields: Field[], 
	fieldId: number | string, 
	newParentId: number | string | null
): boolean {
	// Moving to root is always valid
	if (!newParentId) return true;
	
	// Can't move to itself
	if (String(fieldId) === String(newParentId)) return false;
	
	// Can't move to own descendant (would create circular reference)
	const descendants = getDescendantIds(fields, fieldId);
	if (descendants.some(id => String(id) === String(newParentId))) return false;
	
	// Target parent must support children
	const targetParent = fields.find(f => String(f.id) === String(newParentId));
	if (!targetParent || !canHaveChildren(targetParent)) return false;
	
	return true;
}

/**
 * Calculate the next menu_order for a new field within a parent context
 */
export function getNextMenuOrder(fields: Field[], parentId: number | string | null): number {
	const siblings = parentId 
		? getChildFields(fields, parentId) 
		: getRootFields(fields);
	
	if (siblings.length === 0) return 0;
	return Math.max(...siblings.map(f => f.menu_order)) + 1;
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

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
	addFieldLocal: (field: Partial<Field>, parentId?: number | string | null) => void;
	updateFieldLocal: (id: string, data: Partial<Field>) => void;
	deleteFieldLocal: (id: string) => void;
	reorderFieldsLocal: (fields: Field[], parentId?: number | string | null) => void;
	moveFieldToParent: (fieldId: string, newParentId: number | string | null) => void;
	copyFieldToParent: (fieldId: string, newParentId: number | string | null) => void;
	saveAllChanges: () => Promise<void>;
	
	// Selectors for nested fields
	getRootFields: () => Field[];
	getChildFields: (parentId: number | string) => Field[];
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

			// ================================================================
			// SELECTORS FOR NESTED FIELDS
			// ================================================================
			
			getRootFields: () => {
				return getRootFields(get().fields);
			},
			
			getChildFields: (parentId: number | string) => {
				return getChildFields(get().fields, parentId);
			},

			// ================================================================
			// BASIC ACTIONS
			// ================================================================

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
					// Refresh the list immediately
					const fieldsets = await fieldsetApi.getAll();
					set({
						fieldsets,
						currentFieldset: null,
						isLoading: false,
					});
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : 'Failed to delete fieldset';
					console.error('Delete fieldset error:', errorMsg, error);
					set({
						error: errorMsg,
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
			addFieldLocal: (field: Partial<Field>, parentId?: number | string | null) => {
				const state = get();
				const menuOrder = getNextMenuOrder(state.fields, parentId ?? null);
				
				const newField: Field = {
					id: `temp-${Date.now()}-${Math.random()}`,
					label: field.label || 'New Field',
					name: field.name || `field_${Date.now()}`,
					type: field.type || 'text',
					settings: field.settings || {},
					menu_order: menuOrder,
					parent_id: parentId ?? null,
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

		// Delete field locally (don't save to API yet) - cascades to children
		deleteFieldLocal: (id: string) => {
			set((state) => {
				const fieldIdStr = String(id);
				
				// Get all descendant IDs to cascade delete
				const descendantIds = getDescendantIds(state.fields, fieldIdStr);
				const allIdsToDelete = [fieldIdStr, ...descendantIds.map(String)];
				
				return {
					fields: state.fields.filter((f) => !allIdsToDelete.includes(String(f.id))),
					pendingFieldDeletions: [
						...state.pendingFieldDeletions, 
						...allIdsToDelete.filter(id => !id.startsWith('temp-'))
					],
					pendingFieldAdditions: state.pendingFieldAdditions.filter(
						(f) => !allIdsToDelete.includes(String(f.id))
					),
					unsavedChanges: true,
				};
			});
		},

			// Reorder fields locally (within a specific parent context)
			// parentId is used for documentation/API consistency - reorder operates on the fields array directly
			reorderFieldsLocal: (reorderedFields: Field[], _parentId?: number | string | null) => {
				set((state) => {
					// Update menu_order for reordered fields
					const reorderedWithOrder = reorderedFields.map((f, index) => ({
						...f,
						menu_order: index,
					}));
					
					// Get IDs of reordered fields
					const reorderedIds = new Set(reorderedWithOrder.map(f => String(f.id)));
					
					// Keep fields not in this reorder operation, replace those that are
					const newFields = state.fields.map(f => {
						if (reorderedIds.has(String(f.id))) {
							return reorderedWithOrder.find(rf => String(rf.id) === String(f.id))!;
						}
						return f;
					});
					
					return {
						fields: newFields,
						unsavedChanges: true,
					};
				});
			},

			// Move a field to a new parent (or to root if parentId is null)
			moveFieldToParent: (fieldId: string, newParentId: number | string | null) => {
				const state = get();
				
				// Validate the move
				if (!validateMove(state.fields, fieldId, newParentId)) {
					console.error('Invalid move: circular reference or invalid parent');
					return;
				}
				
				// Calculate new menu_order in target context
				const newMenuOrder = getNextMenuOrder(state.fields, newParentId);
				
				set((state) => {
					const pending = new Map(state.pendingFieldChanges);
					const existing = pending.get(fieldId) || {};
					
					pending.set(fieldId, {
						...existing,
						parent_id: newParentId,
						menu_order: newMenuOrder,
					});
					
					return {
						fields: state.fields.map(f => 
							String(f.id) === fieldId 
								? { ...f, parent_id: newParentId, menu_order: newMenuOrder }
								: f
						),
						pendingFieldChanges: pending,
						unsavedChanges: true,
					};
				});
			},

			// Copy a field (and its children) to a new parent
			copyFieldToParent: (fieldId: string, newParentId: number | string | null) => {
				const state = get();
				const sourceField = state.fields.find(f => String(f.id) === fieldId);
				
				if (!sourceField) return;
				
				// Validate the target
				if (newParentId) {
					const targetParent = state.fields.find(f => String(f.id) === String(newParentId));
					if (!targetParent || !canHaveChildren(targetParent)) {
						console.error('Invalid copy target: parent cannot have children');
						return;
					}
				}
				
				// Generate unique name
				let baseName = sourceField.name;
				let counter = 1;
				let newName = `${baseName}_copy`;
				while (state.fields.some(f => f.name === newName)) {
					counter++;
					newName = `${baseName}_copy_${counter}`;
				}
				
				const newMenuOrder = getNextMenuOrder(state.fields, newParentId);
				
				// Create copy of the field
				const copiedField: Field = {
					...sourceField,
					id: `temp-${Date.now()}-${Math.random()}`,
					name: newName,
					label: `${sourceField.label} (Copy)`,
					parent_id: newParentId,
					menu_order: newMenuOrder,
				};
				
				// TODO: Deep copy children recursively if needed
				// For now, just copy the field itself
				
				set((state) => ({
					fields: [...state.fields, copiedField],
					pendingFieldAdditions: [...state.pendingFieldAdditions, copiedField],
					unsavedChanges: true,
				}));
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
				
				// Step 1: Delete fields marked for deletion
				const deletePromises: Promise<any>[] = [];
				for (const fieldId of pendingFieldDeletions) {
					// Only delete if it's not a new field (temp ID)
					if (!fieldId.startsWith('temp-')) {
						deletePromises.push(fieldApi.delete(Number(fieldId)));
					}
				}
				await Promise.all(deletePromises);

				// Step 2: Create new fields IN ORDER - parents first, then children
				// Build a map to track temp ID -> real ID mappings
				const tempIdToRealId = new Map<string, number>();
				
				// Sort additions: root level first, then by depth
				const sortedAdditions = [...pendingFieldAdditions].sort((a, b) => {
					const getDepth = (f: Field): number => {
						if (!f.parent_id) return 0;
						const parent = fields.find(p => String(p.id) === String(f.parent_id));
						return parent ? 1 + getDepth(parent) : 0;
					};
					return getDepth(a) - getDepth(b);
				});
				
				// Create fields sequentially to ensure parents exist before children
				for (const newField of sortedAdditions) {
					const fieldIdStr = String(newField.id);
					const changes = pendingFieldChanges.get(fieldIdStr);
					
					// Get the latest version from fields state
					const latestField = fields.find((f) => String(f.id) === fieldIdStr) || newField;
					
					// Resolve parent_id: if it's a temp ID, use the real ID we got from creating it
					let resolvedParentId: number | null = null;
					if (latestField.parent_id) {
						const parentIdStr = String(latestField.parent_id);
						if (parentIdStr.startsWith('temp-')) {
							// Parent was also new - use the real ID we mapped
							resolvedParentId = tempIdToRealId.get(parentIdStr) ?? null;
						} else {
							resolvedParentId = Number(latestField.parent_id);
						}
					}
					
					// Calculate proper menu_order based on position within parent context
					const siblings = resolvedParentId 
						? fields.filter(f => {
							const pid = String(f.parent_id);
							return pid === String(latestField.parent_id) || 
								(pid.startsWith('temp-') && tempIdToRealId.get(pid) === resolvedParentId);
						})
						: getRootFields(fields);
					const menuOrder = siblings.findIndex(f => String(f.id) === fieldIdStr);
					
					const fieldData = {
						label: changes?.label || latestField.label || newField.label,
						name: changes?.name || latestField.name || newField.name,
						type: changes?.type || latestField.type || newField.type,
						settings: latestField.settings || newField.settings || {},
						menu_order: menuOrder >= 0 ? menuOrder : latestField.menu_order,
						parent_id: resolvedParentId,
					};
					
					// Create and wait for the result
					const createdField = await fieldApi.create(currentFieldset.id, fieldData);
					
					// Map temp ID to real ID
					tempIdToRealId.set(fieldIdStr, createdField.id as number);
					
					// Update local state with real ID
					set((state) => ({
						fields: state.fields.map((f) => {
							if (String(f.id) === fieldIdStr) {
								return { ...createdField, parent_id: createdField.parent_id ?? null };
							}
							return f;
						}),
					}));
				}
				
				// Step 3: Update children's parent_id references in local state
				// (for any children that referenced temp IDs)
				set((state) => ({
					fields: state.fields.map((f) => {
						if (f.parent_id && String(f.parent_id).startsWith('temp-')) {
							const realParentId = tempIdToRealId.get(String(f.parent_id));
							if (realParentId) {
								return { ...f, parent_id: realParentId };
							}
						}
						return f;
					}),
				}));
				
				// Step 4: Update modified existing fields
				// Get fresh fields state after all the creates
				const currentFields = get().fields;
				const updatePromises: Promise<any>[] = [];
				pendingFieldChanges.forEach((changes, fieldId) => {
					// Only update if it's not a new field (those were already created above)
					if (!fieldId.startsWith('temp-')) {
						const numericId = Number(fieldId);
						const field = currentFields.find((f) => String(f.id) === fieldId);
						if (field) {
							// Merge settings
							const mergedSettings = { ...field.settings, ...changes.settings };
							
							// Use the field's current parent_id (which reflects any moves)
							// Resolve if it's a temp ID
							let resolvedParentId: number | null = null;
							if (field.parent_id) {
								const parentIdStr = String(field.parent_id);
								if (parentIdStr.startsWith('temp-')) {
									resolvedParentId = tempIdToRealId.get(parentIdStr) ?? null;
								} else {
									resolvedParentId = Number(field.parent_id);
								}
							}
							
							// Calculate proper menu_order
							const siblings = resolvedParentId 
								? getChildFields(currentFields, resolvedParentId)
								: getRootFields(currentFields);
							const menuOrder = siblings.findIndex(f => String(f.id) === fieldId);
							
							const mergedData = {
								label: changes.label || field.label,
								name: changes.name || field.name,
								type: changes.type || field.type,
								settings: mergedSettings,
								menu_order: menuOrder >= 0 ? menuOrder : field.menu_order,
								parent_id: resolvedParentId,
							};
							updatePromises.push(fieldApi.update(numericId, mergedData));
						}
					}
				});
				
				await Promise.all(updatePromises);

				// Clear pending changes
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
