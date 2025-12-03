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
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../components/ui/select';
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
import { GripVertical, ChevronDown, Trash2, Plus, X, Filter } from 'lucide-react';
import type { Field, FieldType, ConditionalRule, LocationGroup } from '../types';

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
	allFields: Field[];
	onUpdate: (id: number, data: Partial<Field>) => void;
	onDelete: (id: number) => void;
}

interface FieldsetEditorProps {
	fieldsetId?: number;
	isNew?: boolean;
}

const CONDITION_OPERATORS = [
	{ value: '==', label: 'is equal to' },
	{ value: '!=', label: 'is not equal to' },
	{ value: 'contains', label: 'contains' },
	{ value: 'empty', label: 'is empty' },
	{ value: 'not_empty', label: 'is not empty' },
];

const WIDTH_OPTIONS = [
	{ value: '25', label: '25%' },
	{ value: '33', label: '33%' },
	{ value: '50', label: '50%' },
	{ value: '66', label: '66%' },
	{ value: '75', label: '75%' },
	{ value: '100', label: '100%' },
];

function SortableField({ field, allFields, onUpdate, onDelete }: SortableFieldProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [label, setLabel] = useState(field.label || '');
	const [name, setName] = useState(field.name || '');
	const [hasError, setHasError] = useState(false);
	
	// Wrapper settings
	const [wrapperWidth, setWrapperWidth] = useState(field.settings?.wrapper?.width || '100');
	const [wrapperClass, setWrapperClass] = useState(field.settings?.wrapper?.class || '');
	
	// Conditional logic - stored as ConditionalRule[][] in settings
	const hasConditionalLogic = field.settings?.conditional_logic && field.settings.conditional_logic.length > 0;
	const [conditionalEnabled, setConditionalEnabled] = useState(hasConditionalLogic);
	const [conditionalRules, setConditionalRules] = useState<ConditionalRule[]>(
		field.settings?.conditional_logic?.[0] || []
	);
	const [conditionalLogicType, setConditionalLogicType] = useState<'and' | 'or'>('and');

	// Other fields for conditional logic dropdown (exclude self)
	const otherFields = allFields.filter((f) => f.id !== field.id);

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

	// Save conditional logic to backend
	const saveConditionalLogic = (rules: ConditionalRule[]) => {
		const conditionalLogicData = rules.length > 0 ? [rules] : undefined;
		onUpdate(field.id, {
			settings: {
				...field.settings,
				conditional_logic: conditionalLogicData,
			},
		});
		// Signal parent to enable save
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('fieldChanged'));
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
								<div className="font-medium text-sm flex items-center gap-2">
									{field.label || <span className="text-red-500">Label required</span>}
									<Badge variant="outline" className="text-xs">
										{field.type}
									</Badge>
									{hasConditionalLogic && (
										<Badge variant="secondary" className="text-xs">
											<Filter className="h-3 w-3 mr-1" />
											Conditional
										</Badge>
									)}
								</div>
								<div className="text-xs text-gray-500">{field.name}</div>
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
						<div className="px-3 pb-3 space-y-4 border-t pt-3">
							{hasError && (
								<div className="text-sm text-red-600 bg-red-50 p-2 rounded">
									Field label and name cannot be empty
								</div>
							)}
							
							{/* Basic Settings */}
							<div className="grid grid-cols-2 gap-3">
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
							</div>
							
							{/* Wrapper Settings */}
							<div className="border-t pt-4">
								<h4 className="text-sm font-medium mb-3">Wrapper Settings</h4>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<Label htmlFor={`width-${field.id}`}>Width</Label>
										<Select
											value={wrapperWidth}
											onValueChange={(value) => {
												setWrapperWidth(value);
												onUpdate(field.id, {
													settings: {
														...field.settings,
														wrapper: {
															...field.settings?.wrapper,
															width: value,
														},
													},
												});
											}}
										>
											<SelectTrigger id={`width-${field.id}`}>
												<SelectValue placeholder="Select width" />
											</SelectTrigger>
											<SelectContent>
												{WIDTH_OPTIONS.map((opt) => (
													<SelectItem key={opt.value} value={opt.value}>
														{opt.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div>
												<Label htmlFor={`class-${field.id}`}>CSS Class</Label>
										<Input
											id={`class-${field.id}`}
											value={wrapperClass}
											onChange={(e) => setWrapperClass(e.target.value)}
											onBlur={() => {
												onUpdate(field.id, {
													settings: {
														...field.settings,
														wrapper: {
															...field.settings?.wrapper,
															class: wrapperClass,
														},
													},
												});
												if (typeof window !== 'undefined') {
													window.dispatchEvent(new CustomEvent('fieldChanged'));
												}
											}}
											placeholder="custom-class"
										/>
									</div>
								</div>
							</div>
							
							{/* Conditional Logic */}
							<div className="border-t pt-4">
								<div className="flex items-center justify-between mb-3">
									<h4 className="text-sm font-medium">Conditional Logic</h4>
									<Switch
										checked={conditionalEnabled}
										onCheckedChange={(checked) => {
											setConditionalEnabled(checked);
											if (!checked) {
												setConditionalRules([]);
												onUpdate(field.id, {
													settings: {
														...field.settings,
														conditional_logic: undefined,
													},
												});
											}
										}}
									/>
								</div>
								
								{conditionalEnabled && (
									<div className="space-y-3 bg-gray-50 p-3 rounded-lg">
										<p className="text-xs text-gray-600">
											Show this field if{' '}
											<button
												type="button"
												onClick={() => setConditionalLogicType(conditionalLogicType === 'and' ? 'or' : 'and')}
												className="font-semibold text-blue-600 hover:underline"
											>
												{conditionalLogicType === 'and' ? 'ALL' : 'ANY'}
											</button>{' '}
											conditions match
										</p>
										
										{conditionalRules.map((rule, index) => (
											<div key={index} className="flex items-center gap-2">
												<Select
													value={rule.field}
													onValueChange={(value) => {
														const newRules = [...conditionalRules];
														newRules[index] = { field: value, operator: rule.operator, value: rule.value };
														setConditionalRules(newRules);
														saveConditionalLogic(newRules);
													}}
												>
													<SelectTrigger className="w-[140px]">
														<SelectValue placeholder="Select field" />
													</SelectTrigger>
													<SelectContent>
														{otherFields.map((f) => (
															<SelectItem key={f.id} value={f.name}>
																{f.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												
												<Select
													value={rule.operator}
													onValueChange={(value) => {
														const newRules = [...conditionalRules];
														newRules[index] = { field: rule.field, operator: value as ConditionalRule['operator'], value: rule.value };
														setConditionalRules(newRules);
														saveConditionalLogic(newRules);
													}}
												>
													<SelectTrigger className="w-[130px]">
														<SelectValue placeholder="Operator" />
													</SelectTrigger>
													<SelectContent>
														{CONDITION_OPERATORS.map((op) => (
															<SelectItem key={op.value} value={op.value}>
																{op.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												
												{!['empty', 'not_empty'].includes(rule.operator) && (
													<Input
														value={rule.value}
														onChange={(e) => {
															const newRules = [...conditionalRules];
															newRules[index] = { field: rule.field, operator: rule.operator, value: e.target.value };
															setConditionalRules(newRules);
														}}
														onBlur={() => saveConditionalLogic(conditionalRules)}
														placeholder="Value"
														className="w-[120px]"
													/>
												)}
												
												<button
													type="button"
													onClick={() => {
														const newRules = conditionalRules.filter((_, i) => i !== index);
														setConditionalRules(newRules);
														saveConditionalLogic(newRules);
													}}
													className="p-1 text-gray-400 hover:text-red-600"
												>
													<X className="h-4 w-4" />
												</button>
											</div>
										))}
										
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => {
												setConditionalRules([
													...conditionalRules,
													{ field: '', operator: '==', value: '' },
												]);
											}}
										>
											<Plus className="h-3 w-3 mr-1" />
											Add Rule
										</Button>
									</div>
								)}
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
	const [slug, setSlug] = useState('');
	const [description, setDescription] = useState('');
	const [isActive, setIsActive] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [selectedFieldType, setSelectedFieldType] = useState<FieldType | null>(null);
	const [newFieldLabel, setNewFieldLabel] = useState('');
	const [newFieldName, setNewFieldName] = useState('');
	const [showFieldDialog, setShowFieldDialog] = useState(false);
	const [localFields, setLocalFields] = useState<Field[]>([]);
	const [initialized, setInitialized] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	
	// Location rules state
	const [locationGroups, setLocationGroups] = useState<LocationGroup[]>([
		{ id: '1', rules: [{ type: '', operator: '==', value: '' }] }
	]);

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
			setSlug(currentFieldset.field_key || currentFieldset.title.toLowerCase().replace(/[^a-z0-9]+/g, '_'));
			setDescription(currentFieldset.description || '');
			setIsActive(currentFieldset.is_active !== false);
			setLocationGroups(currentFieldset.settings?.location_groups || [{ id: '1', rules: [{ type: '', operator: '==', value: '' }] }]);
			fetchFields(currentFieldset.id);
		}
	}, [currentFieldset?.id]);

	useEffect(() => {
		setLocalFields(fields);
	}, [fields]);

	// Track changes to any field
	useEffect(() => {
		if (!initialized || !currentFieldset) return;
		
		const titleChanged = title !== currentFieldset.title;
		const slugChanged = slug !== (currentFieldset.field_key || currentFieldset.title.toLowerCase().replace(/[^a-z0-9]+/g, '_'));
		const descriptionChanged = description !== (currentFieldset.description || '');
		const isActiveChanged = isActive !== (currentFieldset.is_active !== false);
		const locationGroupsChanged = JSON.stringify(locationGroups) !== JSON.stringify(currentFieldset.settings?.location_groups || [{ id: '1', rules: [{ type: '', operator: '==', value: '' }] }]);
		
		setHasUnsavedChanges(titleChanged || slugChanged || descriptionChanged || isActiveChanged || locationGroupsChanged);
	}, [title, slug, description, isActive, locationGroups, currentFieldset, initialized]);

	useEffect(() => {
		if (currentFieldset) {
			const changed = 
				title !== currentFieldset.title ||
				slug !== (currentFieldset.field_key || '') ||
				description !== (currentFieldset.description || '') ||
				isActive !== (currentFieldset.is_active !== false) ||
				JSON.stringify(locationGroups) !== JSON.stringify(currentFieldset.settings?.location_groups || []);
			setHasUnsavedChanges(changed);
		}
	}, [title, slug, description, isActive, locationGroups, currentFieldset]);

	const handleSave = async () => {
		if (!currentFieldset) return;
		
		if (!title.trim()) {
			showToast('error', 'Fieldset title is required');
			return;
		}

		setIsSaving(true);
		try {
			// Save fieldset details including location rules in settings
			await updateFieldset(currentFieldset.id, { 
				title, 
				field_key: slug,
				description,
				is_active: isActive,
				settings: {
					...(currentFieldset.settings || {}),
					location_groups: locationGroups,
				},
			});
			
			setHasUnsavedChanges(false);
			showToast('success', 'Fieldset saved successfully');
		} catch (error) {
			console.error('Save error:', error);
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
			setHasUnsavedChanges(true);

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

	const handleFieldDialogKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleAddField();
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
						<Button 
							onClick={handleSave} 
							disabled={isSaving || !hasUnsavedChanges}
						>
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
									allFields={localFields}
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

				{/* Settings Section */}
				<div className="mb-8">
					<h2 className="text-lg font-semibold mb-4">Settings</h2>
					<Card className="p-4">
						<div className="space-y-4">
							<div className="flex items-center justify-between pb-4 border-b">
								<div>
									<Label htmlFor="active">Active</Label>
									<p className="text-xs text-gray-500">Enable or disable this fieldset</p>
								</div>
								<Switch
									id="active"
									checked={isActive}
									onCheckedChange={(checked) => {
										setIsActive(checked);
										setHasUnsavedChanges(true);
									}}
								/>
							</div>
							<div>
								<Label htmlFor="slug">Fieldset Slug</Label>
								<Input
									id="slug"
									value={slug}
									onChange={(e) => {
										setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
										setHasUnsavedChanges(true);
									}}
									placeholder="fieldset_slug"
								/>
								<p className="text-xs text-gray-500 mt-1">Used for programmatic access</p>
							</div>
							<div>
								<Label htmlFor="description">Description</Label>
								<Input
									id="description"
									value={description}
									onChange={(e) => {
										setDescription(e.target.value);
										setHasUnsavedChanges(true);
									}}
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
							Show this fieldset when the following rules match
						</p>
						
						{locationGroups.map((group, groupIndex) => (
							<div key={group.id} className="mb-4">
								{groupIndex > 0 && (
									<div className="flex items-center gap-2 my-3">
										<div className="flex-1 border-t"></div>
										<span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">OR</span>
										<div className="flex-1 border-t"></div>
									</div>
								)}
								
								<div className="bg-gray-50 p-3 rounded-lg space-y-2">
									{group.rules.map((rule, ruleIndex) => (
										<div key={ruleIndex}>
											{ruleIndex > 0 && (
												<div className="text-xs font-medium text-gray-500 text-center my-2">AND</div>
											)}
											<div className="flex items-center gap-2">
												<Select
													value={rule.type}
													onValueChange={(value) => {
														const newGroups = [...locationGroups];
														const targetGroup = newGroups[groupIndex];
														if (targetGroup && targetGroup.rules[ruleIndex]) {
															targetGroup.rules[ruleIndex].type = value;
															targetGroup.rules[ruleIndex].value = '';
															setLocationGroups(newGroups);
															setHasUnsavedChanges(true);
														}
													}}
												>
													<SelectTrigger className="w-[160px]">
														<SelectValue placeholder="Select type" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="post_type">Post Type</SelectItem>
														<SelectItem value="page_template">Page Template</SelectItem>
														<SelectItem value="taxonomy">Taxonomy</SelectItem>
														<SelectItem value="user_role">User Role</SelectItem>
													</SelectContent>
												</Select>
												
												<Select
													value={rule.operator}
													onValueChange={(value) => {
														const newGroups = [...locationGroups];
														const targetGroup = newGroups[groupIndex];
														if (targetGroup && targetGroup.rules[ruleIndex]) {
															targetGroup.rules[ruleIndex].operator = value as '==' | '!=';
															setLocationGroups(newGroups);
															setHasUnsavedChanges(true);
														}
													}}
												>
													<SelectTrigger className="w-[130px]">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="==">is equal to</SelectItem>
														<SelectItem value="!=">is not equal to</SelectItem>
													</SelectContent>
												</Select>
												
												<Select
													value={rule.value}
													onValueChange={(value) => {
														const newGroups = [...locationGroups];
														const targetGroup = newGroups[groupIndex];
														if (targetGroup && targetGroup.rules[ruleIndex]) {
															targetGroup.rules[ruleIndex].value = value;
															setLocationGroups(newGroups);
															setHasUnsavedChanges(true);
														}
													}}
												>
													<SelectTrigger className="flex-1">
														<SelectValue placeholder="Select value" />
													</SelectTrigger>
													<SelectContent>
														{rule.type === 'post_type' && (
															<>
																{(window.openfieldsAdmin?.postTypes || []).map((pt) => (
																	<SelectItem key={pt.name} value={pt.name}>
																		{pt.label}
																	</SelectItem>
																))}
																{(!window.openfieldsAdmin?.postTypes || window.openfieldsAdmin.postTypes.length === 0) && (
																	<>
																		<SelectItem value="post">Post</SelectItem>
																		<SelectItem value="page">Page</SelectItem>
																	</>
																)}
															</>
														)}
														{rule.type === 'taxonomy' && (
															<>
																{(window.openfieldsAdmin?.taxonomies || []).map((tax) => (
																	<SelectItem key={tax.name} value={tax.name}>
																		{tax.label}
																	</SelectItem>
																))}
																{(!window.openfieldsAdmin?.taxonomies || window.openfieldsAdmin.taxonomies.length === 0) && (
																	<>
																		<SelectItem value="category">Category</SelectItem>
																		<SelectItem value="post_tag">Tag</SelectItem>
																	</>
																)}
															</>
														)}
														{rule.type === 'user_role' && (
															<>
																{(window.openfieldsAdmin?.userRoles || []).map((role) => (
																	<SelectItem key={role.name} value={role.name}>
																		{role.label}
																	</SelectItem>
																))}
																{(!window.openfieldsAdmin?.userRoles || window.openfieldsAdmin.userRoles.length === 0) && (
																	<>
																		<SelectItem value="administrator">Administrator</SelectItem>
																		<SelectItem value="editor">Editor</SelectItem>
																		<SelectItem value="author">Author</SelectItem>
																	</>
																)}
															</>
														)}
														{rule.type === 'page_template' && (
															<>
																<SelectItem value="default">Default Template</SelectItem>
																<SelectItem value="full-width">Full Width</SelectItem>
															</>
														)}
														</SelectContent>
												</Select>
												
												{(group.rules.length > 1 || locationGroups.length > 1) && (
													<button
														type="button"
														onClick={() => {
															const newGroups = [...locationGroups];
															const targetGroup = newGroups[groupIndex];
															if (targetGroup) {
																if (group.rules.length > 1) {
																	targetGroup.rules = group.rules.filter((_, i) => i !== ruleIndex);
																} else {
																	// Remove entire group
																	newGroups.splice(groupIndex, 1);
																}
															}
															if (newGroups.length === 0) {
																newGroups.push({ id: Date.now().toString(), rules: [{ type: '', operator: '==', value: '' }] });
															}
															setLocationGroups(newGroups);
															setHasUnsavedChanges(true);
														}}
														className="p-1 text-gray-400 hover:text-red-600"
													>
														<X className="h-4 w-4" />
													</button>
												)}
											</div>
										</div>
									))}
									
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => {
											const newGroups = [...locationGroups];
											const targetGroup = newGroups[groupIndex];
											if (targetGroup) {
												targetGroup.rules.push({ type: '', operator: '==', value: '' });
												setLocationGroups(newGroups);
												setHasUnsavedChanges(true);
											}
										}}
										className="mt-2"
									>
										<Plus className="h-3 w-3 mr-1" />
										Add AND rule
									</Button>
								</div>
							</div>
						))}
						
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								setLocationGroups([
									...locationGroups,
									{ id: Date.now().toString(), rules: [{ type: '', operator: '==', value: '' }] }
								]);
								setHasUnsavedChanges(true);
							}}
						>
							<Plus className="h-3 w-3 mr-1" />
							Add OR rule group
						</Button>
					</Card>
				</div>
			</div>
		</div>
	);
}
