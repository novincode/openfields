/**
 * Fields Section Component
 * 
 * Handles the drag-and-drop field list and field addition.
 * Only renders root-level fields; nested fields are rendered within FieldItem.
 *
 * @package OpenFields
 */

import { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { useFieldsetStore } from '../../../stores/fieldset-store';
import { useUIStore } from '../../../stores/ui-store';
import { Button } from '../../../components/ui/button';

import { ScrollArea } from '../../../components/ui/scroll-area';
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

import { FieldItem } from './FieldItem';
import { CopyFieldDialog } from './CopyFieldDialog';
import { fieldRegistry } from '../../../lib/field-registry';
import type { Field, FieldType } from '../../../types';

export function FieldsSection() {
	// Use selectors for proper subscription
	const currentFieldset = useFieldsetStore((state) => state.currentFieldset);
	const fields = useFieldsetStore((state) => state.fields);
	const fetchFields = useFieldsetStore((state) => state.fetchFields);
	const addFieldLocal = useFieldsetStore((state) => state.addFieldLocal);
	const reorderFieldsLocal = useFieldsetStore((state) => state.reorderFieldsLocal);
	const getRootFields = useFieldsetStore((state) => state.getRootFields);
	
	const { showToast } = useUIStore();
	// Direct call to singleton registry instead of hook
	const groupedFieldTypes = fieldRegistry.getGroupedByCategory();

	const [drawerOpen, setDrawerOpen] = useState(false);
	const [copyDialogOpen, setCopyDialogOpen] = useState(false);
	
	// Get only root-level fields (no parent)
	const rootFields = getRootFields();

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Fetch fields when fieldset changes
	useEffect(() => {
		if (currentFieldset?.id) {
			fetchFields(currentFieldset.id);
		}
	}, [currentFieldset?.id, fetchFields]);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over) return;

		if (active.id !== over.id) {
			const oldIndex = rootFields.findIndex((f) => f.id === active.id);
			const newIndex = rootFields.findIndex((f) => f.id === over.id);
			const newOrder = arrayMove(rootFields, oldIndex, newIndex);
			
			// Update locally with root context (null parent)
			reorderFieldsLocal(newOrder, null);
		}
	};

	/**
	 * Generate auto-incremented field name and label
	 */
	const generateAutoFieldName = () => {
		let counter = 1;
		let fieldName = `field_${counter}`;
		let fieldLabel = `Field ${counter}`;
		
		// Check if field name already exists across ALL fields (not just root)
		while (fields.some((f) => f.name === fieldName)) {
			counter++;
			fieldName = `field_${counter}`;
			fieldLabel = `Field ${counter}`;
		}
		
		return { fieldName, fieldLabel, counter };
	};

	const handleFieldTypeSelect = (type: FieldType) => {
		const { fieldName, fieldLabel } = generateAutoFieldName();
		
		// Auto-add field at root level (no parent)
		addFieldLocal({
			type,
			label: fieldLabel,
			name: fieldName,
		}, null);

		setDrawerOpen(false);
		showToast('success', `${fieldLabel} ${__('added (will be saved when you click Save Changes)', 'codeideal-open-fields')}`);
	};

	// Handle copying a field from another location
	const handleCopyField = (copiedField: Field) => {
		// The copied field already has parent_id set to null (root level)
		addFieldLocal({
			...copiedField,
			parent_id: null, // Ensure it goes to root
		}, null);
		showToast('success', `${copiedField.label} ${__('copied to root level', 'codeideal-open-fields')}`);
	};

	return (
		<div className="mb-8">
			<h2 className="text-lg font-semibold mb-4">{__('Fields', 'codeideal-open-fields')}</h2>

			{/* Field List with DnD - ROOT LEVEL ONLY */}
			<DndContext
				id="root-fields"
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={rootFields.map((f) => f.id)}
					strategy={verticalListSortingStrategy}
				>
					{rootFields.map((field) => (
						<FieldItem
							key={field.id}
							field={field}
							allFields={fields}
							depth={0}
							maxDepth={3}
						/>
					))}
				</SortableContext>
			</DndContext>

			{/* Add Field Button & Drawer */}
			<Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
				<DrawerTrigger asChild>
					<button className="w-full mt-4 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-gray-600">
						<Plus className="h-5 w-5" />
						<span>{__('Add Field', 'codeideal-open-fields')}</span>
					</button>
				</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>{__('Select Field Type', 'codeideal-open-fields')}</DrawerTitle>
						<DrawerDescription>
							{__('Choose the type of field you want to add', 'codeideal-open-fields')}
						</DrawerDescription>
					</DrawerHeader>
					<ScrollArea className="h-96 px-6">
						{Object.entries(groupedFieldTypes).map(([category, types]) => (
							<div key={category} className="mb-6">
								<h3 className="text-sm font-semibold text-gray-700 mb-2 capitalize">
									{category}
								</h3>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
									{types.map((ft) => (
										<button
											key={ft.type}
											onClick={() => handleFieldTypeSelect(ft.type)}
											className="p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
										>
											<div className="font-medium text-sm">{ft.label}</div>
											{ft.description && (
												<div className="text-xs text-gray-500 mt-1">
													{ft.description}
												</div>
											)}
										</button>
									))}
								</div>
							</div>
						))}
					</ScrollArea>
					<DrawerFooter>
						<DrawerClose asChild>
							<Button variant="outline">{__('Cancel', 'codeideal-open-fields')}</Button>
						</DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
			
			{/* Copy Field Button & Dialog */}
			<button 
				onClick={() => setCopyDialogOpen(true)}
				className="w-full mt-2 p-3 border border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600"
			>
				<Copy className="h-4 w-4" />
				<span>{__('Copy from other field', 'codeideal-open-fields')}</span>
			</button>
			
			{currentFieldset && (
				<CopyFieldDialog
					open={copyDialogOpen}
					onOpenChange={setCopyDialogOpen}
					targetParentId={null}
					currentFieldsetId={currentFieldset.id}
					onCopy={handleCopyField}
				/>
			)}
		</div>
	);
}
