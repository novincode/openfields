/**
 * Fieldset Editor Page - Completely Redesigned
 *
 * @package OpenFields
 */

import { useEffect, useState } from 'react';
import { useFieldsetStore } from '../stores/fieldset-store';
import { useUIStore } from '../stores/ui-store';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from '../components/ui/drawer';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '../components/ui/collapsible';
import { ScrollArea } from '../components/ui/scroll-area';
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
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, Trash2, Plus } from 'lucide-react';
import type { Field, FieldType } from '../types';

const FIELD_TYPES: { type: FieldType; label: string; category: string }[] = [
	{ type: 'text', label: 'Text', category: 'Basic' },
	{ type: 'textarea', label: 'Text Area', category: 'Basic' },
	{ type: 'number', label: 'Number', category: 'Basic' },
	{ type: 'email', label: 'Email', category: 'Basic' },
	{ type: 'url', label: 'URL', category: 'Basic' },
	{ type: 'wysiwyg', label: 'WYSIWYG Editor', category: 'Content' },
	{ type: 'image', label: 'Image', category: 'Content' },
	{ type: 'gallery', label: 'Gallery', category: 'Content' },
	{ type: 'file', label: 'File', category: 'Content' },
	{ type: 'select', label: 'Select', category: 'Choice' },
	{ type: 'radio', label: 'Radio', category: 'Choice' },
	{ type: 'checkbox', label: 'Checkbox', category: 'Choice' },
	{ type: 'switch', label: 'Switch', category: 'Choice' },
	{ type: 'date', label: 'Date Picker', category: 'Advanced' },
	{ type: 'datetime', label: 'Date Time', category: 'Advanced' },
	{ type: 'time', label: 'Time', category: 'Advanced' },
	{ type: 'color', label: 'Color Picker', category: 'Advanced' },
	{ type: 'link', label: 'Link', category: 'Relational' },
	{ type: 'post', label: 'Post', category: 'Relational' },
	{ type: 'taxonomy', label: 'Taxonomy', category: 'Relational' },
	{ type: 'user', label: 'User', category: 'Relational' },
	{ type: 'repeater', label: 'Repeater', category: 'Layout' },
	{ type: 'group', label: 'Group', category: 'Layout' },
];

interface SortableFieldProps {
	field: Field;
	onUpdate: (id: number, data: Partial<Field>) => void;
	onDelete: (id: number) => void;
}

interface FieldsetEditorProps {
	fieldsetId?: number;
	isNew?: boolean;
}

function SortableField({ field, onUpdate, onDelete }: SortableFieldProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [label, setLabel] = useState(field.label || '');
	const [name, setName] = useState(field.name || '');
	const [hasError, setHasError] = useState(false);

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: field.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	// Real-time update on blur
	const handleLabelBlur = () => {
		if (!label.trim()) {
			setHasError(true);
			return;
		}
		setHasError(false);
		if (label !== field.label) {
			onUpdate(field.id, { label });
		}
	};

	const handleNameBlur = () => {
		if (!name.trim()) {
			setHasError(true);
			return;
		}
		setHasError(false);
		if (name !== field.name) {
			onUpdate(field.id, { name });
		}
	};

	return (
		<div ref={setNodeRef} style={style} className="mb-2">
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<Card className={`${hasError ? 'border-red-500' : ''}`}>
					<div className="flex items-center gap-2 p-3">
						<button
							{...attributes}
							{...listeners}
							className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
						>
							<GripVertical className="h-4 w-4" />
						</button>
						<CollapsibleTrigger className="flex-1 flex items-center justify-between gap-2 text-left">
							<div className="flex-1">
								<div className="font-medium text-sm">
									{field.label || <span className="text-red-500">Label required</span>}
								</div>
								<div className="text-xs text-gray-500">{field.type}</div>
							</div>
							<ChevronDown
								className={`h-4 w-4 transition-transform ${
									isOpen ? 'rotate-180' : ''
								}`}
							/>
						</CollapsibleTrigger>
						<button
							onClick={() => onDelete(field.id)}
							className="p-1 text-gray-400 hover:text-red-600"
						>
							<Trash2 className="h-4 w-4" />
						</button>
					</div>
					<CollapsibleContent>
						<div className="px-3 pb-3 space-y-3 border-t pt-3">
							{hasError && (
								<div className="text-sm text-red-600 bg-red-50 p-2 rounded">
									Field label and name cannot be empty
								</div>
							)}
							<div>
								<Label htmlFor={`label-${field.id}`}>Field Label</Label>
								<Input
									id={`label-${field.id}`}
									value={label}
									onChange={(e) => setLabel(e.target.value)}
									onBlur={handleLabelBlur}
									placeholder="Enter field label"
									className={hasError && !label.trim() ? 'border-red-500' : ''}
								/>
							</div>
							<div>
								<Label htmlFor={`name-${field.id}`}>Field Name</Label>
								<Input
									id={`name-${field.id}`}
									value={name}
									onChange={(e) => setName(e.target.value)}
									onBlur={handleNameBlur}
									placeholder="field_name"
									className={hasError && !name.trim() ? 'border-red-500' : ''}
								/>
							</div>
							<div>
								<Label>Field Type</Label>
								<div className="text-sm text-gray-600">{field.type}</div>
							</div>
						</div>
					</CollapsibleContent>
				</Card>
			</Collapsible>
		</div>
	);
}

export function FieldsetEditor({ fieldsetId, isNew }: FieldsetEditorProps) {
	const { currentFieldset, fields, fetchFieldset, createFieldset, updateFieldset, fetchFields, addField, updateField, deleteField, reorderFields, isLoading } =
		useFieldsetStore();
	const { showToast } = useUIStore();
	const [title, setTitle] = useState('');
	const [status, setStatus] = useState<'active' | 'inactive'>('active');
	const [isSaving, setIsSaving] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [selectedFieldType, setSelectedFieldType] = useState<FieldType | null>(null);
	const [newFieldLabel, setNewFieldLabel] = useState('');
	const [newFieldName, setNewFieldName] = useState('');
	const [showFieldDialog, setShowFieldDialog] = useState(false);
	const [localFields, setLocalFields] = useState<Field[]>([]);
	const [initialized, setInitialized] = useState(false);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Fetch fieldset on mount if editing existing
	useEffect(() => {
		const init = async () => {
			if (fieldsetId && !isNew) {
				await fetchFieldset(fieldsetId);
			} else if (isNew) {
				// Create a new fieldset immediately
				try {
					const newFieldset = await createFieldset({ title: 'New Fieldset' });
					// Redirect to edit page
					window.location.href = `admin.php?page=openfields&action=edit&id=${newFieldset.id}`;
				} catch (error) {
					showToast('error', 'Failed to create fieldset');
				}
			}
			setInitialized(true);
		};
		init();
	}, [fieldsetId, isNew]);

	useEffect(() => {
		if (currentFieldset) {
			setTitle(currentFieldset.title);
			setStatus('active'); // Default to active
			fetchFields(currentFieldset.id);
		}
	}, [currentFieldset?.id]);

	useEffect(() => {
		setLocalFields(fields);
	}, [fields]);

	const handleSave = async () => {
		if (!currentFieldset) return;
		
		if (!title.trim()) {
			showToast('error', 'Fieldset title is required');
			return;
		}

		setIsSaving(true);
		try {
			await updateFieldset(currentFieldset.id, { title });
			showToast('success', 'Fieldset saved successfully');
		} catch (error) {
			showToast('error', 'Failed to save fieldset');
		} finally {
			setIsSaving(false);
		}
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || !currentFieldset) return;

		if (active.id !== over.id) {
			const oldIndex = localFields.findIndex((f) => f.id === active.id);
			const newIndex = localFields.findIndex((f) => f.id === over.id);
			const newOrder = arrayMove(localFields, oldIndex, newIndex);
			setLocalFields(newOrder);

			// Update backend
			const updates = newOrder.map((field, index) => ({
				id: field.id,
				menu_order: index,
			}));
			await reorderFields(currentFieldset.id, updates);
		}
	};

	const handleAddField = async () => {
		if (!selectedFieldType || !currentFieldset) return;
		if (!newFieldLabel.trim() || !newFieldName.trim()) {
			showToast('error', 'Field label and name are required');
			return;
		}

		try {
			await addField(currentFieldset.id, {
				type: selectedFieldType,
				label: newFieldLabel,
				name: newFieldName,
				menu_order: fields.length,
			});
			setDrawerOpen(false);
			setShowFieldDialog(false);
			setSelectedFieldType(null);
			setNewFieldLabel('');
			setNewFieldName('');
			showToast('success', 'Field added successfully');
		} catch (error) {
			showToast('error', 'Failed to add field');
		}
	};

	const handleFieldTypeSelect = (type: FieldType) => {
		setSelectedFieldType(type);
		setDrawerOpen(false);
		setShowFieldDialog(true);
	};

	const handleUpdateField = async (id: number, data: Partial<Field>) => {
		try {
			await updateField(id, data);
		} catch (error) {
			showToast('error', 'Failed to update field');
		}
	};

	const handleDeleteField = async (id: number) => {
		try {
			await deleteField(id);
			showToast('success', 'Field deleted');
		} catch (error) {
			showToast('error', 'Failed to delete field');
		}
	};

	// Show loading state
	if (!initialized || isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-gray-500">Loading...</p>
			</div>
		);
	}

	if (!currentFieldset) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-gray-500">Fieldset not found</p>
			</div>
		);
	}

	const groupedFieldTypes = FIELD_TYPES.reduce((acc, ft) => {
		if (!acc[ft.category]) acc[ft.category] = [];
		acc[ft.category]!.push(ft);
		return acc;
	}, {} as Record<string, typeof FIELD_TYPES>);

	return (
		<div className="flex min-h-screen flex-col">
			{/* Sticky Header */}
			<div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
				<div className="flex items-center justify-between">
					<div className="flex-1 max-w-2xl">
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Enter fieldset title"
							className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0"
						/>
					</div>
					<div className="flex items-center gap-3">
						<select
							value={status}
							onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
							className="px-3 py-2 border rounded-md"
						>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
						</select>
						<Button onClick={handleSave} disabled={isSaving}>
							{isSaving ? 'Saving...' : 'Save Changes'}
						</Button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-auto px-6 py-6 max-w-5xl w-full mx-auto">
				{/* Fields Section */}
				<div className="mb-8">
					<h2 className="text-lg font-semibold mb-4">Fields</h2>
					
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={localFields.map((f) => f.id)}
							strategy={verticalListSortingStrategy}
						>
							{localFields.map((field) => (
								<SortableField
									key={field.id}
									field={field}
									onUpdate={handleUpdateField}
									onDelete={handleDeleteField}
								/>
							))}
						</SortableContext>
					</DndContext>

					{/* Add Field Area */}
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
										<h3 className="text-sm font-semibold text-gray-700 mb-2">
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
									Add {FIELD_TYPES.find((ft) => ft.type === selectedFieldType)?.label} Field
								</h3>
								<div className="space-y-4">
									<div>
										<Label htmlFor="new-field-label">Field Label</Label>
										<Input
											id="new-field-label"
											value={newFieldLabel}
											onChange={(e) => setNewFieldLabel(e.target.value)}
											placeholder="Enter field label"
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
							</div>
						</div>
					)}
				</div>

				{/* Settings Section */}
				<div className="mb-8">
					<h2 className="text-lg font-semibold mb-4">Settings</h2>
					<Card className="p-4">
						<div className="space-y-4">
							<div>
								<Label htmlFor="description">Description</Label>
								<Input
									id="description"
									placeholder="Optional description for this fieldset"
								/>
							</div>
						</div>
					</Card>
				</div>

				{/* Location Rules */}
				<div className="mb-8">
					<h2 className="text-lg font-semibold mb-4">Location Rules</h2>
					<Card className="p-4">
						<p className="text-sm text-gray-600 mb-4">
							Set the rules where this fieldset will appear
						</p>
						<div className="space-y-3">
							<div>
								<Label>Show on</Label>
								<select className="w-full mt-1 px-3 py-2 border rounded-md">
									<option value="">Select location</option>
									<option value="post_type">Post Type</option>
									<option value="taxonomy">Taxonomy</option>
									<option value="user">User</option>
								</select>
							</div>
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}
