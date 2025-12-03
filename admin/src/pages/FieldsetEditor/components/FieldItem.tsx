/**
 * FieldItem Component
 * 
 * A single draggable field item in the fieldset editor.
 * Handles field settings, conditional logic, and type-specific configurations.
 *
 * @package OpenFields
 */

import { useState, useEffect, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFieldsetStore } from '../../../stores/fieldset-store';
import { useUIStore } from '../../../stores/ui-store';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../components/ui/select';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '../../../components/ui/collapsible';
import { GripVertical, ChevronDown, Trash2, Filter } from 'lucide-react';

import { ConditionalLogicPanel } from './ConditionalLogicPanel';
import { TypeSpecificSettings } from './TypeSpecificSettings';
import type { Field, ConditionalRule } from '../../../types';

interface FieldItemProps {
	field: Field;
	allFields: Field[];
}

const WIDTH_OPTIONS = [
	{ value: '25', label: '25%' },
	{ value: '33', label: '33%' },
	{ value: '50', label: '50%' },
	{ value: '66', label: '66%' },
	{ value: '75', label: '75%' },
	{ value: '100', label: '100%' },
];

export function FieldItem({ field, allFields }: FieldItemProps) {
	const { updateFieldLocal, deleteField } = useFieldsetStore();
	const { showToast } = useUIStore();

	const [isOpen, setIsOpen] = useState(false);
	const [label, setLabel] = useState(field.label || '');
	const [name, setName] = useState(field.name || '');
	const [hasError, setHasError] = useState(false);

	// Wrapper settings
	const [wrapperWidth, setWrapperWidth] = useState(field.settings?.wrapper?.width || '100');
	const [wrapperClass, setWrapperClass] = useState(field.settings?.wrapper?.class || '');

	// Conditional logic
	const hasConditionalLogic =
		field.settings?.conditional_logic && field.settings.conditional_logic.length > 0;

	// Sortable setup
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: field.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	// Sync local state when field prop changes
	useEffect(() => {
		setLabel(field.label || '');
		setName(field.name || '');
		setWrapperWidth(field.settings?.wrapper?.width || '100');
		setWrapperClass(field.settings?.wrapper?.class || '');
	}, [field]);

	// Update handler that marks changes as unsaved
	const handleUpdate = useCallback(
		(updates: Partial<Field>) => {
			updateFieldLocal(field.id, updates);
		},
		[field.id, updateFieldLocal]
	);

	// Label change
	const handleLabelChange = (value: string) => {
		setLabel(value);
	};

	const handleLabelBlur = () => {
		if (!label.trim()) {
			setHasError(true);
			return;
		}
		setHasError(false);
		if (label !== field.label) {
			handleUpdate({ label });
		}
	};

	// Name change
	const handleNameChange = (value: string) => {
		setName(value);
	};

	const handleNameBlur = () => {
		if (!name.trim()) {
			setHasError(true);
			return;
		}
		setHasError(false);
		if (name !== field.name) {
			handleUpdate({ name });
		}
	};

	// Wrapper width change
	const handleWrapperWidthChange = (value: string) => {
		setWrapperWidth(value);
		handleUpdate({
			settings: {
				...field.settings,
				wrapper: {
					...field.settings?.wrapper,
					width: value,
				},
			},
		});
	};

	// Wrapper class change
	const handleWrapperClassChange = (value: string) => {
		setWrapperClass(value);
	};

	const handleWrapperClassBlur = () => {
		if (wrapperClass !== field.settings?.wrapper?.class) {
			handleUpdate({
				settings: {
					...field.settings,
					wrapper: {
						...field.settings?.wrapper,
						class: wrapperClass,
					},
				},
			});
		}
	};

	// Conditional logic change
	const handleConditionalLogicChange = (logic: ConditionalRule[][] | undefined) => {
		handleUpdate({
			settings: {
				...field.settings,
				conditional_logic: logic,
			},
		});
	};

	// Settings change (for type-specific settings)
	const handleSettingsChange = (settingsUpdates: Record<string, unknown>) => {
		handleUpdate({
			settings: {
				...field.settings,
				...settingsUpdates,
			},
		});
	};

	// Delete field
	const handleDelete = async () => {
		try {
			await deleteField(field.id);
			showToast('success', 'Field deleted');
		} catch {
			showToast('error', 'Failed to delete field');
		}
	};

	// Other fields for conditional logic
	const otherFields = allFields.filter((f) => f.id !== field.id);

	return (
		<div ref={setNodeRef} style={style} className="mb-2">
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<Card className={hasError ? 'border-red-500' : ''}>
					{/* Header */}
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
									{field.label || (
										<span className="text-red-500">Label required</span>
									)}
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
							onClick={handleDelete}
							className="p-1 text-gray-400 hover:text-red-600"
						>
							<Trash2 className="h-4 w-4" />
						</button>
					</div>

					{/* Content */}
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
										onChange={(e) => handleLabelChange(e.target.value)}
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
										onChange={(e) => handleNameChange(e.target.value)}
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
											onValueChange={handleWrapperWidthChange}
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
											onChange={(e) => handleWrapperClassChange(e.target.value)}
											onBlur={handleWrapperClassBlur}
											placeholder="custom-class"
										/>
									</div>
								</div>
							</div>

							{/* Type-Specific Settings */}
							<TypeSpecificSettings
								field={field}
								onSettingsChange={handleSettingsChange}
							/>

							{/* Conditional Logic */}
							<ConditionalLogicPanel
								field={field}
								otherFields={otherFields}
								onConditionalLogicChange={handleConditionalLogicChange}
							/>
						</div>
					</CollapsibleContent>
				</Card>
			</Collapsible>
		</div>
	);
}
