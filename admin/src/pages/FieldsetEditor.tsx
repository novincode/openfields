/**
 * Fieldset Editor Page
 *
 * @package OpenFields
 */

import { useEffect, useState } from 'react';
import {
	ArrowLeft,
	Save,
	Settings,
	MapPin,
	GripVertical,
	Trash2,
	ChevronDown,
	ChevronRight,
} from 'lucide-react';
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
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useFieldsetStore } from '../stores';
import type { Field, FieldType } from '../types';

interface FieldsetEditorProps {
	fieldsetId?: number;
}

const FIELD_TYPES: { key: FieldType; label: string; icon: string }[] = [
	{ key: 'text', label: 'Text', icon: 'T' },
	{ key: 'textarea', label: 'Textarea', icon: '¶' },
	{ key: 'number', label: 'Number', icon: '#' },
	{ key: 'email', label: 'Email', icon: '@' },
	{ key: 'url', label: 'URL', icon: '🔗' },
	{ key: 'select', label: 'Select', icon: '▼' },
	{ key: 'checkbox', label: 'Checkbox', icon: '☑' },
	{ key: 'radio', label: 'Radio', icon: '◉' },
	{ key: 'switch', label: 'Switch', icon: '⊙' },
	{ key: 'wysiwyg', label: 'WYSIWYG', icon: '📝' },
	{ key: 'image', label: 'Image', icon: '🖼' },
	{ key: 'file', label: 'File', icon: '📎' },
	{ key: 'date', label: 'Date', icon: '📅' },
	{ key: 'color', label: 'Color', icon: '🎨' },
];

export default function FieldsetEditor({ fieldsetId }: FieldsetEditorProps) {
	const {
		currentFieldset,
		fields,
		isLoading,
		fetchFieldset,
		createFieldset,
		updateFieldset,
		addField,
		updateField,
		deleteField,
		reorderFields,
	} = useFieldsetStore();

	const [title, setTitle] = useState('');
	const [fieldKey, setFieldKey] = useState('');
	const [activeTab, setActiveTab] = useState<'fields' | 'settings' | 'location'>(
		'fields'
	);
	const [localFields, setLocalFields] = useState<Field[]>([]);
	const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	useEffect(() => {
		if (fieldsetId) {
			fetchFieldset(fieldsetId);
		}
	}, [fieldsetId, fetchFieldset]);

	useEffect(() => {
		if (currentFieldset) {
			setTitle(currentFieldset.title);
			setFieldKey(currentFieldset.field_key);
		}
	}, [currentFieldset]);

	useEffect(() => {
		setLocalFields(fields);
	}, [fields]);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			if (fieldsetId && currentFieldset) {
				await updateFieldset(fieldsetId, { title, field_key: fieldKey });
			} else {
				const newFieldset = await createFieldset({
					title,
					field_key: fieldKey || generateKey(title),
				});
				// Redirect to edit page
				const adminUrl = window.openfieldsAdmin?.adminUrl || '/wp-admin/';
				window.location.href = `${adminUrl}admin.php?page=openfields&action=edit&id=${newFieldset.id}`;
			}
		} finally {
			setIsSaving(false);
		}
	};

	const handleAddField = async (type: FieldType) => {
		if (!fieldsetId) return;

		const newField = await addField(fieldsetId, {
			type,
			label: `New ${type} field`,
			name: generateKey(`new_${type}_${Date.now()}`),
			settings: {},
			menu_order: localFields.length,
		});

		setSelectedFieldId(newField.id);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = localFields.findIndex((f) => f.id === active.id);
			const newIndex = localFields.findIndex((f) => f.id === over.id);

			const newFields = arrayMove(localFields, oldIndex, newIndex);
			setLocalFields(newFields);

			// Update order in backend
			if (fieldsetId) {
				const updates = newFields.map((f, i) => ({ id: f.id, menu_order: i }));
				reorderFields(fieldsetId, updates);
			}
		}
	};

	const goBack = () => {
		const adminUrl = window.openfieldsAdmin?.adminUrl || '/wp-admin/';
		window.location.href = `${adminUrl}admin.php?page=openfields`;
	};

	const selectedField = localFields.find((f) => f.id === selectedFieldId);

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="flex items-center justify-between px-6 py-4 border-b bg-white">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={goBack}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Field Group Title"
							className="text-xl font-semibold border-0 p-0 h-auto focus-visible:ring-0"
						/>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button onClick={handleSave} disabled={isSaving || !title}>
						<Save className="h-4 w-4 mr-2" />
						{isSaving ? 'Saving...' : 'Save'}
					</Button>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex flex-1 overflow-hidden">
				{/* Sidebar - Field Types */}
				<div className="w-64 border-r bg-gray-50 overflow-y-auto">
					<div className="p-4">
						<h3 className="font-medium text-sm text-gray-500 mb-3">
							Add Field
						</h3>
						<div className="grid grid-cols-2 gap-2">
							{FIELD_TYPES.map((type) => (
								<button
									key={type.key}
									onClick={() => handleAddField(type.key)}
									disabled={!fieldsetId}
									className="flex flex-col items-center justify-center p-3 bg-white border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<span className="text-lg mb-1">{type.icon}</span>
									<span className="text-xs text-gray-600">
										{type.label}
									</span>
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Field List */}
				<div className="flex-1 overflow-y-auto p-6">
					{/* Tabs */}
					<div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
						<button
							onClick={() => setActiveTab('fields')}
							className={`px-4 py-2 text-sm rounded-md transition-colors ${
								activeTab === 'fields'
									? 'bg-white shadow text-gray-900'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							Fields
						</button>
						<button
							onClick={() => setActiveTab('settings')}
							className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
								activeTab === 'settings'
									? 'bg-white shadow text-gray-900'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							<Settings className="h-4 w-4" />
							Settings
						</button>
						<button
							onClick={() => setActiveTab('location')}
							className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
								activeTab === 'location'
									? 'bg-white shadow text-gray-900'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							<MapPin className="h-4 w-4" />
							Location
						</button>
					</div>

					{activeTab === 'fields' && (
						<>
							{isLoading && (
								<div className="flex justify-center py-12">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
								</div>
							)}

							{!isLoading && localFields.length === 0 && (
								<div className="text-center py-12">
									<p className="text-gray-500 mb-4">
										{fieldsetId
											? 'No fields yet. Add your first field from the sidebar.'
											: 'Save the field group first, then add fields.'}
									</p>
								</div>
							)}

							{!isLoading && localFields.length > 0 && (
								<DndContext
									sensors={sensors}
									collisionDetection={closestCenter}
									onDragEnd={handleDragEnd}
								>
									<SortableContext
										items={localFields.map((f) => f.id)}
										strategy={verticalListSortingStrategy}
									>
										<div className="space-y-2">
											{localFields.map((field) => (
												<SortableFieldItem
													key={field.id}
													field={field}
													isSelected={
														selectedFieldId === field.id
													}
													onSelect={() =>
														setSelectedFieldId(
															selectedFieldId === field.id
																? null
																: field.id
														)
													}
													onDelete={() =>
														deleteField(field.id)
													}
												/>
											))}
										</div>
									</SortableContext>
								</DndContext>
							)}
						</>
					)}

					{activeTab === 'settings' && (
						<Card>
							<CardHeader>
								<CardTitle>Field Group Settings</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Label htmlFor="field-key">Field Key</Label>
									<Input
										id="field-key"
										value={fieldKey}
										onChange={(e) =>
											setFieldKey(
												e.target.value
													.toLowerCase()
													.replace(/[^a-z0-9_]/g, '_')
											)
										}
										placeholder="group_my_fields"
									/>
									<p className="text-xs text-gray-500 mt-1">
										Unique identifier for this field group
									</p>
								</div>
							</CardContent>
						</Card>
					)}

					{activeTab === 'location' && (
						<Card>
							<CardHeader>
								<CardTitle>Location Rules</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-gray-500">
									Location rules determine where this field group will
									appear. Coming soon...
								</p>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Field Settings Panel */}
				{selectedField && (
					<div className="w-80 border-l bg-white overflow-y-auto p-4">
						<FieldSettingsPanel
							field={selectedField}
							onUpdate={(data) => updateField(selectedField.id, data)}
							onClose={() => setSelectedFieldId(null)}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

interface SortableFieldItemProps {
	field: Field;
	isSelected: boolean;
	onSelect: () => void;
	onDelete: () => void;
}

function SortableFieldItem({
	field,
	isSelected,
	onSelect,
	onDelete,
}: SortableFieldItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: field.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex items-center gap-2 p-3 bg-white border rounded-lg ${
				isDragging ? 'opacity-50' : ''
			} ${isSelected ? 'ring-2 ring-primary' : ''}`}
		>
			<button
				{...attributes}
				{...listeners}
				className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
			>
				<GripVertical className="h-4 w-4" />
			</button>

			<button
				onClick={onSelect}
				className="flex-1 text-left flex items-center gap-3"
			>
				<span className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm">
					{FIELD_TYPES.find((t) => t.key === field.type)?.icon || '?'}
				</span>
				<div>
					<div className="font-medium text-sm">{field.label}</div>
					<div className="text-xs text-gray-500">{field.name}</div>
				</div>
			</button>

			<button
				onClick={onSelect}
				className="p-1 text-gray-400 hover:text-gray-600"
			>
				{isSelected ? (
					<ChevronDown className="h-4 w-4" />
				) : (
					<ChevronRight className="h-4 w-4" />
				)}
			</button>

			<button
				onClick={onDelete}
				className="p-1 text-gray-400 hover:text-red-600"
			>
				<Trash2 className="h-4 w-4" />
			</button>
		</div>
	);
}

interface FieldSettingsPanelProps {
	field: Field;
	onUpdate: (data: Partial<Field>) => void;
	onClose: () => void;
}

function FieldSettingsPanel({
	field,
	onUpdate,
	onClose,
}: FieldSettingsPanelProps) {
	const [label, setLabel] = useState(field.label);
	const [name, setName] = useState(field.name);

	const handleSave = () => {
		onUpdate({ label, name });
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-semibold">Field Settings</h3>
				<Button variant="ghost" size="sm" onClick={onClose}>
					×
				</Button>
			</div>

			<div className="space-y-4">
				<div>
					<Label htmlFor="field-label">Label</Label>
					<Input
						id="field-label"
						value={label}
						onChange={(e) => setLabel(e.target.value)}
					/>
				</div>

				<div>
					<Label htmlFor="field-name">Name</Label>
					<Input
						id="field-name"
						value={name}
						onChange={(e) =>
							setName(
								e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')
							)
						}
					/>
					<p className="text-xs text-gray-500 mt-1">
						Used in template: get_field('{name}')
					</p>
				</div>

				<div>
					<Label>Type</Label>
					<div className="text-sm text-gray-600 mt-1">{field.type}</div>
				</div>

				<Button onClick={handleSave} className="w-full">
					Update Field
				</Button>
			</div>
		</div>
	);
}

function generateKey(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_|_$/g, '');
}
