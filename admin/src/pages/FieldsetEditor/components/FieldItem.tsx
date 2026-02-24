/**
 * FieldItem Component
 * 
 * A single draggable field item in the fieldset editor.
 * Handles field settings, conditional logic, and type-specific configurations.
 * Supports recursive rendering for nested fields (repeater, group, etc.)
 *
 * @package OpenFields
 */

import { useState, useEffect, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFieldsetStore, canHaveChildren } from '../../../stores/fieldset-store';
import { useUIStore } from '../../../stores/ui-store';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Slider } from '../../../components/ui/slider';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '../../../components/ui/collapsible';
import { GripVertical, ChevronDown, Trash2, Filter, Layers } from 'lucide-react';
import { sanitizeFieldName, isFieldNameDuplicate } from '../../../utils/field-name-validator';

import { ConditionalLogicPanel } from './ConditionalLogicPanel';
import { TypeSpecificSettings } from './TypeSpecificSettings';
import { NestedFieldsArea } from './NestedFieldsArea';
import { MoveFieldDialog } from './MoveFieldDialog';
import type { Field, ConditionalRule } from '../../../types';
import { cn } from '@/lib/utils';

interface FieldItemProps {
    field: Field;
    allFields: Field[];
    /** Current nesting depth (0 = root) */
    depth?: number;
    /** Maximum allowed nesting depth */
    maxDepth?: number;
}



export function FieldItem({ field, allFields, depth = 0, maxDepth = 3 }: FieldItemProps) {
    // Use selectors for proper subscription
    const updateFieldLocal = useFieldsetStore((state) => state.updateFieldLocal);
    const deleteFieldLocal = useFieldsetStore((state) => state.deleteFieldLocal);
    const { showToast } = useUIStore();

    const [isOpen, setIsOpen] = useState(false);
    const [label, setLabel] = useState(field.label || '');
    const [name, setName] = useState(field.name || '');
    const [nameError, setNameError] = useState<string>('');
    const [hasError, setHasError] = useState(false);

    // Check if this field can have children (repeater, group, etc.)
    const fieldCanHaveChildren = canHaveChildren(field);

    // Get children count for display
    const childCount = allFields.filter(f => String(f.parent_id) === String(field.id)).length;

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
            updateFieldLocal(String(field.id), updates);
        },
        [field.id, updateFieldLocal]
    );

    // Label change - save immediately
    const handleLabelChange = (value: string) => {
        setLabel(value);
        // Save immediately if not empty
        if (value.trim()) {
            setHasError(false);
            handleUpdate({ label: value });
        }
    };

    const handleLabelBlur = () => {
        if (!label.trim()) {
            setHasError(true);
        }
    };

    // Name change - auto-sanitize and check for duplicates
    const handleNameChange = (value: string) => {
        // Auto-sanitize: spaces to underscores, lowercase, remove invalid chars
        const sanitized = sanitizeFieldName(value);
        setName(sanitized || value); // Keep original if sanitization results in empty

        // Check for duplicates among other fields in this fieldset
        const otherFieldNames = allFields
            .filter(f => f.id !== field.id)
            .map(f => f.name);

        if (sanitized && isFieldNameDuplicate(sanitized, otherFieldNames.map(n => ({ name: n })))) {
            setNameError('This field name is already used in this fieldset');
        } else if (!sanitized) {
            setNameError('Field name is required and must contain only letters, numbers, hyphens, or underscores');
        } else {
            setNameError('');
        }
    };

    const handleNameBlur = () => {
        const sanitized = sanitizeFieldName(name);
        if (sanitized) {
            // Save the sanitized version
            handleUpdate({ name: sanitized });
            setName(sanitized);
        } else {
            setNameError('Field name cannot be empty');
        }
    };

    // Wrapper width change
    const handleWrapperWidthChange = (value: number[]) => {
        const widthValue = String(value[0]);
        setWrapperWidth(widthValue);
        handleUpdate({
            settings: {
                ...field.settings,
                wrapper: {
                    ...field.settings?.wrapper,
                    width: widthValue,
                },
            },
        });
    };

    // Wrapper class change - save immediately
    const handleWrapperClassChange = (value: string) => {
        setWrapperClass(value);
        handleUpdate({
            settings: {
                ...field.settings,
                wrapper: {
                    ...field.settings?.wrapper,
                    class: value,
                },
            },
        });
    };

    const handleWrapperClassBlur = () => {
        // Additional validation if needed
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
    const handleDelete = () => {
        if (childCount > 0) {
            deleteFieldLocal(String(field.id));
            showToast('success', `${__('Field and', 'codeideal-open-fields')} ${childCount} ${__('sub-field(s) removed (will be deleted when you click Save Changes)', 'codeideal-open-fields')}`);
        } else {
            deleteFieldLocal(String(field.id));
            showToast('success', __('Field removed (will be deleted when you click Save Changes)', 'codeideal-open-fields'));
        }
    };

    // Other fields for conditional logic
    const otherFields = allFields.filter((f) => f.id !== field.id);

    return (
        <div ref={setNodeRef} style={style} className="mb-2">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <Card className={cn(
                    `${hasError ? 'border-red-500' : ''} ${depth > 0 ? 'bg-gray-50/50' : ''}`,
                )}>
                    {/* Header */}
                    <div className={cn(
                        'flex items-center gap-2 p-3',
                    )}>
                        <button
                            {...attributes}
                            {...listeners}
                            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
                        >
                            <GripVertical className="h-4 w-4" />
                        </button>
                        <CollapsibleTrigger className="flex-1 flex items-center justify-between gap-2 text-start">
                            <div className="flex-1">
                                <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
                                    {field.label || (
                                        <span className="text-red-500">{__('Label required', 'codeideal-open-fields')}</span>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                        {field.type}
                                    </Badge>
                                    {fieldCanHaveChildren && (
                                        <Badge variant="secondary" className="text-xs">
                                            <Layers className="h-3 w-3 me-1" />
                                            {childCount} {childCount !== 1 ? __('sub-fields', 'codeideal-open-fields') : __('sub-field', 'codeideal-open-fields')}
                                        </Badge>
                                    )}
                                    {hasConditionalLogic && (
                                        <Badge variant="secondary" className="text-xs">
                                            <Filter className="h-3 w-3 me-1" />
                                            {__('Conditional', 'codeideal-open-fields')}
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500">{field.name}</div>
                            </div>
                            <ChevronDown
                                className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''
                                    }`}
                            />
                        </CollapsibleTrigger>
                        {/* Move field button */}
                        <MoveFieldDialog
                            field={field}
                            allFields={allFields}
                            maxDepth={maxDepth}
                        />
                        <button
                            onClick={handleDelete}
                            className="p-1 text-gray-400 hover:text-red-600"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <CollapsibleContent className=''>
                        <div className="px-3 pb-3 space-y-4 border-t pt-3">
                            {hasError && (
                                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                    {__('Field label and name cannot be empty', 'codeideal-open-fields')}
                                </div>
                            )}

                            {/* Basic Settings */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor={`label-${field.id}`}>{__('Field Label', 'codeideal-open-fields')}</Label>
                                    <Input
                                        id={`label-${field.id}`}
                                        value={label}
                                        onChange={(e) => handleLabelChange(e.target.value)}
                                        onBlur={handleLabelBlur}
                                        placeholder={__('Enter field label', 'codeideal-open-fields')}
                                        className={hasError && !label.trim() ? 'border-red-500' : ''}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={`name-${field.id}`}>
                                        {__('Field Name', 'codeideal-open-fields')}
                                    </Label>
                                    <Input
                                        id={`name-${field.id}`}
                                        value={name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        onBlur={handleNameBlur}
                                        placeholder="my_field_name"
                                        className={nameError ? 'border-red-500' : ''}
                                        disabled={false}
                                    />
                                    {nameError && (
                                        <p className="text-xs text-red-600 mt-1">{nameError}</p>
                                    )}
                                </div>
                            </div>

                            {/* Wrapper Settings */}
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium mb-3">{__('Wrapper Settings', 'codeideal-open-fields')}</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <Label htmlFor={`width-${field.id}`}>{__('Width', 'codeideal-open-fields')}</Label>
                                            <span className="text-sm font-medium text-primary">{wrapperWidth}%</span>
                                        </div>
                                        <Slider
                                            id={`width-${field.id}`}
                                            min={10}
                                            max={100}
                                            step={1}
                                            value={[parseInt(wrapperWidth, 10)]}
                                            onValueChange={handleWrapperWidthChange}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`class-${field.id}`}>{__('CSS Class', 'codeideal-open-fields')}</Label>
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

                            {/* Nested Fields Area (for repeater, group, etc.) */}
                            {fieldCanHaveChildren && (
                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                        <Layers className="h-4 w-4" />
                                        {__('Sub-fields', 'codeideal-open-fields')}
                                    </h4>
                                    <NestedFieldsArea
                                        parentField={field}
                                        allFields={allFields}
                                        depth={depth + 1}
                                        maxDepth={maxDepth}
                                        FieldItemComponent={FieldItem}
                                    />
                                </div>
                            )}
                        </div>
                    </CollapsibleContent>
                </Card>
            </Collapsible>
        </div>
    );
}
