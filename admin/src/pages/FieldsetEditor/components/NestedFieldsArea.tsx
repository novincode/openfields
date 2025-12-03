/**
 * Nested Fields Area Component
 * 
 * Renders a scoped drag-and-drop area for child fields within a parent field.
 * Each nested area has its own DndContext to prevent cross-context conflicts.
 *
 * @package OpenFields
 */

import { useState } from 'react';
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Copy } from 'lucide-react';

import { useFieldsetStore } from '../../../stores/fieldset-store';
import { useUIStore } from '../../../stores/ui-store';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Button } from '../../../components/ui/button';
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from '../../../components/ui/drawer';
import { fieldRegistry } from '../../../lib/field-registry';
import { CopyFieldDialog } from './CopyFieldDialog';
import type { Field, FieldType } from '../../../types';

// Import FieldItem type for the render prop pattern
import type { ComponentType } from 'react';

interface NestedFieldsAreaProps {
	/** The parent field that contains these nested fields */
	parentField: Field;
	/** All fields in the fieldset (flat) */
	allFields: Field[];
	/** Current nesting depth (for visual indentation limits) */
	depth: number;
	/** Maximum allowed nesting depth */
	maxDepth?: number;
	/** Field item renderer component (passed to avoid circular imports) */
	FieldItemComponent: ComponentType<{
		field: Field;
		allFields: Field[];
		depth: number;
		maxDepth: number;
	}>;
}

export function NestedFieldsArea({ 
	parentField, 
	allFields, 
	depth, 
	maxDepth = 3,
	FieldItemComponent,
}: NestedFieldsAreaProps) {
	const addFieldLocal = useFieldsetStore((state) => state.addFieldLocal);
	const reorderFieldsLocal = useFieldsetStore((state) => state.reorderFieldsLocal);
	const getChildFields = useFieldsetStore((state) => state.getChildFields);
	const currentFieldset = useFieldsetStore((state) => state.currentFieldset);
	const { showToast } = useUIStore();
	
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [copyDialogOpen, setCopyDialogOpen] = useState(false);
	
	// Get child fields for this parent
	const childFields = getChildFields(parentField.id);
	
	// Get grouped field types for the drawer
	const groupedFieldTypes = fieldRegistry.getGroupedByCategory();
	
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);
	
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over) return;
		
		if (active.id !== over.id) {
			const oldIndex = childFields.findIndex((f) => f.id === active.id);
			const newIndex = childFields.findIndex((f) => f.id === over.id);
			const newOrder = arrayMove(childFields, oldIndex, newIndex);
			
			// Update with parent context
			reorderFieldsLocal(newOrder, parentField.id);
		}
	};
	
	/**
	 * Generate auto-incremented field name and label
	 */
	const generateAutoFieldName = () => {
		let counter = 1;
		let fieldName = `${parentField.name}_field_${counter}`;
		let fieldLabel = `Field ${counter}`;
		
		// Check if field name already exists across ALL fields
		while (allFields.some((f) => f.name === fieldName)) {
			counter++;
			fieldName = `${parentField.name}_field_${counter}`;
			fieldLabel = `Field ${counter}`;
		}
		
		return { fieldName, fieldLabel };
	};
	
	const handleFieldTypeSelect = (type: FieldType) => {
		const { fieldName, fieldLabel } = generateAutoFieldName();
		
		// Check depth limit for nested layout fields
		const fieldDef = fieldRegistry.get(type);
		if (fieldDef?.hasSubFields && depth >= maxDepth) {
			showToast('error', `Cannot add ${fieldDef.label} - maximum nesting depth (${maxDepth}) reached`);
			setDrawerOpen(false);
			return;
		}
		
		// Add field with this parent
		addFieldLocal({
			type,
			label: fieldLabel,
			name: fieldName,
		}, parentField.id);
		
		setDrawerOpen(false);
		showToast('success', `${fieldLabel} added to ${parentField.label}`);
	};
	
	// Handle copying a field from another location
	const handleCopyField = (copiedField: Field) => {
		// The copied field already has parent_id set to this parent
		// Just add it to the store
		addFieldLocal({
			...copiedField,
			// Ensure parent_id is set (should already be from CopyFieldDialog)
			parent_id: parentField.id,
		}, parentField.id);
		showToast('success', `${copiedField.label} copied to ${parentField.label}`);
	};
	
	return (
		<div className="mt-3 ml-4 pl-4 border-l-2 border-dashed border-gray-300">
			<div className="text-xs text-gray-500 mb-2 font-medium">
				Sub-fields of {parentField.label}
			</div>
			
			{/* Scoped drag context for this level */}
			<DndContext
				id={`nested-${parentField.id}`}
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={childFields.map((f) => f.id)}
					strategy={verticalListSortingStrategy}
				>
					{childFields.map((field) => (
						<FieldItemComponent
							key={field.id}
							field={field}
							allFields={allFields}
							depth={depth}
							maxDepth={maxDepth}
						/>
					))}
				</SortableContext>
			</DndContext>
			
			{/* Empty state */}
			{childFields.length === 0 && (
				<div className="text-sm text-gray-400 italic py-2">
					No sub-fields yet
				</div>
			)}
			
			{/* Add Field Button & Drawer */}
			<Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
				<DrawerTrigger asChild>
					<button className="w-full mt-2 p-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-gray-500 text-sm">
						<Plus className="h-4 w-4" />
						<span>Add Sub-field</span>
					</button>
				</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Add Sub-field to {parentField.label}</DrawerTitle>
						<DrawerDescription>
							Choose the type of field you want to add
						</DrawerDescription>
					</DrawerHeader>
					<ScrollArea className="h-96 px-6">
						{Object.entries(groupedFieldTypes).map(([category, types]) => (
							<div key={category} className="mb-6">
								<h3 className="text-sm font-semibold text-gray-700 mb-2 capitalize">
									{category}
								</h3>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
									{types.map((ft) => {
										// Disable layout fields at max depth
										const isDisabled = ft.hasSubFields && depth >= maxDepth;
										
										return (
											<button
												key={ft.type}
												onClick={() => handleFieldTypeSelect(ft.type)}
												disabled={isDisabled}
												className={`p-3 border rounded-lg text-left transition-colors ${
													isDisabled 
														? 'opacity-50 cursor-not-allowed bg-gray-50'
														: 'hover:border-blue-500 hover:bg-blue-50'
												}`}
											>
												<div className="font-medium text-sm">{ft.label}</div>
												{ft.description && (
													<div className="text-xs text-gray-500 mt-1">
														{ft.description}
													</div>
												)}
												{isDisabled && (
													<div className="text-xs text-red-500 mt-1">
														Max depth reached
													</div>
												)}
											</button>
										);
									})}
								</div>
							</div>
						))}
					</ScrollArea>
					<DrawerFooter>
						<DrawerClose asChild>
							<Button variant="outline">Cancel</Button>
						</DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
			
			{/* Copy Field Button & Dialog */}
			<button 
				onClick={() => setCopyDialogOpen(true)}
				className="w-full mt-2 p-2 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-500 text-sm"
			>
				<Copy className="h-4 w-4" />
				<span>Copy from other field</span>
			</button>
			
			{currentFieldset && (
				<CopyFieldDialog
					open={copyDialogOpen}
					onOpenChange={setCopyDialogOpen}
					targetParentId={parentField.id}
					currentFieldsetId={currentFieldset.id}
					onCopy={handleCopyField}
				/>
			)}
		</div>
	);
}
