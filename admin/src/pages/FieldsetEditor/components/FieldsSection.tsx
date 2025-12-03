/**
 * Fields Section Component
 * 
 * Handles the drag-and-drop field list and field addition.
 *
 * @package OpenFields
 */

import { useState, useEffect } from 'react';
import { useFieldsetStore } from '../../../stores/fieldset-store';
import { useUIStore } from '../../../stores/ui-store';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
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
import { Plus } from 'lucide-react';

import { FieldItem } from './FieldItem';
import { fieldRegistry } from '../../../lib/field-registry';
import type { FieldType } from '../../../types';

export function FieldsSection() {
	// Use selectors for proper subscription
	const currentFieldset = useFieldsetStore((state) => state.currentFieldset);
	const fields = useFieldsetStore((state) => state.fields);
	const fetchFields = useFieldsetStore((state) => state.fetchFields);
	const addFieldLocal = useFieldsetStore((state) => state.addFieldLocal);
	const reorderFieldsLocal = useFieldsetStore((state) => state.reorderFieldsLocal);
	
	const { showToast } = useUIStore();
	// Direct call to singleton registry instead of hook
	const groupedFieldTypes = fieldRegistry.getGroupedByCategory();

	const [drawerOpen, setDrawerOpen] = useState(false);
	const [selectedFieldType, setSelectedFieldType] = useState<FieldType | null>(null);
	const [newFieldLabel, setNewFieldLabel] = useState('');
	const [newFieldName, setNewFieldName] = useState('');
	const [showFieldDialog, setShowFieldDialog] = useState(false);

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
			const oldIndex = fields.findIndex((f) => f.id === active.id);
			const newIndex = fields.findIndex((f) => f.id === over.id);
			const newOrder = arrayMove(fields, oldIndex, newIndex);
			
			// Update locally - this will set unsavedChanges to true
			reorderFieldsLocal(newOrder);
		}
	};

	const handleFieldTypeSelect = (type: FieldType) => {
		setSelectedFieldType(type);
		setDrawerOpen(false);
		setShowFieldDialog(true);
	};

	const handleAddField = () => {
		if (!selectedFieldType) return;
		if (!newFieldLabel.trim() || !newFieldName.trim()) {
			showToast('error', 'Field label and name are required');
			return;
		}

		// Add field locally (will be saved when user clicks Save Changes)
		addFieldLocal({
			type: selectedFieldType,
			label: newFieldLabel,
			name: newFieldName,
		});

		setShowFieldDialog(false);
		setSelectedFieldType(null);
		setNewFieldLabel('');
		setNewFieldName('');
		showToast('success', 'Field added (will be saved when you click Save Changes)');
	};

	const handleFieldDialogKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleAddField();
		}
	};

	return (
		<div className="mb-8">
			<h2 className="text-lg font-semibold mb-4">Fields</h2>

			{/* Field List with DnD */}
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={fields.map((f) => f.id)}
					strategy={verticalListSortingStrategy}
				>
					{fields.map((field) => (
						<FieldItem
							key={field.id}
							field={field}
							allFields={fields}
						/>
					))}
				</SortableContext>
			</DndContext>

			{/* Add Field Button & Drawer */}
			<Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
				<DrawerTrigger asChild>
					<button className="w-full mt-4 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-gray-600">
						<Plus className="h-5 w-5" />
						<span>Add Field</span>
					</button>
				</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Select Field Type</DrawerTitle>
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
							<Button variant="outline">Cancel</Button>
						</DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>

			{/* Field Creation Dialog */}
			{showFieldDialog && selectedFieldType && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
						<h3 className="text-lg font-semibold mb-4">
							Add {
								Object.entries(groupedFieldTypes).find(
									([_, types]) => types.some((ft) => ft.type === selectedFieldType)
								)?.[1].find((ft) => ft.type === selectedFieldType)?.label || selectedFieldType
							} Field
						</h3>
						<div className="space-y-4" onKeyDown={handleFieldDialogKeyDown}>
							<div>
								<Label htmlFor="new-field-label">Field Label</Label>
								<Input
									id="new-field-label"
									value={newFieldLabel}
									onChange={(e) => setNewFieldLabel(e.target.value)}
									placeholder="Enter field label"
									autoFocus
								/>
							</div>
							<div>
								<Label htmlFor="new-field-name">Field Name</Label>
								<Input
									id="new-field-name"
									value={newFieldName}
									onChange={(e) => setNewFieldName(e.target.value)}
									placeholder="field_name"
								/>
							</div>
						</div>
						<div className="flex justify-end gap-2 mt-6">
							<Button
								variant="outline"
								onClick={() => {
									setShowFieldDialog(false);
									setSelectedFieldType(null);
									setNewFieldLabel('');
									setNewFieldName('');
								}}
							>
								Cancel
							</Button>
							<Button onClick={handleAddField}>Add Field</Button>
						</div>
						<p className="text-xs text-gray-500 mt-2">Press Enter to add</p>
					</div>
				</div>
			)}
		</div>
	);
}
