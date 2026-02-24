/**
 * CopyFieldDialog Component
 * 
 * A dialog that allows copying fields from other fieldsets or other locations
 * within the current fieldset.
 *
 * @package OpenFields
 */

import { useState, useEffect, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '../../../components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../components/ui/select';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Badge } from '../../../components/ui/badge';
import { Label } from '../../../components/ui/label';
import { Copy, ChevronRight, Loader2 } from 'lucide-react';
import { useFieldsetStore, canHaveChildren, getRootFields, getChildFields } from '../../../stores/fieldset-store';
import { fieldsetApi, fieldApi } from '../../../api';
import type { Field, Fieldset } from '../../../types';

interface CopyFieldDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Where the copied field will go - null means root level */
	targetParentId: number | string | null;
	/** Current fieldset ID */
	currentFieldsetId: number;
	/** Callback when a field is copied */
	onCopy: (field: Field) => void;
}

// Recursive component to render field tree
function FieldTreeItem({
	field,
	allFields,
	depth,
	onSelect,
}: {
	field: Field;
	allFields: Field[];
	depth: number;
	onSelect: (field: Field) => void;
}) {
	const children = getChildFields(allFields, field.id);
	const hasChildren = canHaveChildren(field) && children.length > 0;
	
	return (
		<div>
			<button
				onClick={() => onSelect(field)}
				className={`w-full text-start px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2 transition-colors`}
				style={{ paddingLeft: `${12 + depth * 20}px` }}
			>
				{hasChildren && <ChevronRight className="h-3 w-3 text-gray-400" />}
				{!hasChildren && <span className="w-3" />}
				<span className="flex-1 text-sm truncate">{field.label || field.name}</span>
				<Badge variant="outline" className="text-xs">
					{field.type}
				</Badge>
				<Copy className="h-3 w-3 text-gray-400" />
			</button>
			{hasChildren && (
				<div>
					{children.map(child => (
						<FieldTreeItem
							key={child.id}
							field={child}
							allFields={allFields}
							depth={depth + 1}
							onSelect={onSelect}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export function CopyFieldDialog({
	open,
	onOpenChange,
	targetParentId,
	currentFieldsetId,
	onCopy,
}: CopyFieldDialogProps) {
	const [selectedFieldsetId, setSelectedFieldsetId] = useState<string>('current');
	const [fieldsets, setFieldsets] = useState<Fieldset[]>([]);
	const [otherFieldsetFields, setOtherFieldsetFields] = useState<Field[]>([]);
	const [isLoadingFieldsets, setIsLoadingFieldsets] = useState(false);
	const [isLoadingFields, setIsLoadingFields] = useState(false);
	
	// Get current fieldset's fields from store
	const currentFields = useFieldsetStore((state) => state.fields);
	const currentFieldset = useFieldsetStore((state) => state.currentFieldset);
	
	// Fetch all fieldsets on mount
	useEffect(() => {
		if (open && fieldsets.length === 0) {
			setIsLoadingFieldsets(true);
			fieldsetApi.getAll()
				.then(data => {
					setFieldsets(data);
				})
				.catch(err => {
					console.error('Failed to fetch fieldsets:', err);
				})
				.finally(() => {
					setIsLoadingFieldsets(false);
				});
		}
	}, [open, fieldsets.length]);
	
	// Fetch fields when a different fieldset is selected
	useEffect(() => {
		if (selectedFieldsetId === 'current' || !selectedFieldsetId) {
			setOtherFieldsetFields([]);
			return;
		}
		
		setIsLoadingFields(true);
		fieldApi.getByFieldset(Number(selectedFieldsetId))
			.then((data: Field[]) => {
				setOtherFieldsetFields(data);
			})
			.catch((err: Error) => {
				console.error('Failed to fetch fields:', err);
				setOtherFieldsetFields([]);
			})
			.finally(() => {
				setIsLoadingFields(false);
			});
	}, [selectedFieldsetId]);
	
	// Determine which fields to display
	const displayFields = useMemo(() => {
		const fields = selectedFieldsetId === 'current' ? currentFields : otherFieldsetFields;
		return getRootFields(fields);
	}, [selectedFieldsetId, currentFields, otherFieldsetFields]);
	
	const allDisplayFields = selectedFieldsetId === 'current' ? currentFields : otherFieldsetFields;
	
	// Handle field selection
	const handleSelectField = (field: Field) => {
		// Create a copy of the field with a new temp ID
		const copiedField: Field = {
			...field,
			id: `temp-${Date.now()}`,
			parent_id: targetParentId,
			fieldset_id: currentFieldsetId,
			// Append "(Copy)" to label to make it clear
			label: `${field.label} (Copy)`,
			// Generate new name to avoid conflicts
			name: `${field.name}_copy_${Date.now().toString(36)}`,
		};
		
		// Deep copy settings
		if (field.settings) {
			copiedField.settings = JSON.parse(JSON.stringify(field.settings));
		}
		
		onCopy(copiedField);
		onOpenChange(false);
	};
	
	const targetLabel = targetParentId 
		? currentFields.find(f => String(f.id) === String(targetParentId))?.label || 'selected parent'
		: 'root level';
	
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Copy className="h-5 w-5" />
						{__('Copy Field', 'codeideal-open-fields')}
					</DialogTitle>
					<DialogDescription>
						{__('Copy a field to', 'codeideal-open-fields')} {targetLabel}. {__('The copied field will have a new ID and name.', 'codeideal-open-fields')}
					</DialogDescription>
				</DialogHeader>
				
				<div className="space-y-4">
					{/* Fieldset Selector */}
					<div>
						<Label>{__('Copy from', 'codeideal-open-fields')}</Label>
						<Select
							value={selectedFieldsetId}
							onValueChange={setSelectedFieldsetId}
						>
							<SelectTrigger className="mt-1">
								<SelectValue placeholder={__('Select fieldset...', 'codeideal-open-fields')} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="current">
									{currentFieldset?.title || __('Current Fieldset', 'codeideal-open-fields')} ({__('Current', 'codeideal-open-fields')})
								</SelectItem>
								{fieldsets
									.filter(fs => fs.id !== currentFieldsetId)
									.map(fs => (
										<SelectItem key={fs.id} value={String(fs.id)}>
											{fs.title}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
					</div>
					
					{/* Field Tree */}
					<div>
						<Label>{__('Select field to copy', 'codeideal-open-fields')}</Label>
						<div className="mt-1 border rounded-md">
							{isLoadingFieldsets || isLoadingFields ? (
								<div className="flex items-center justify-center py-8 text-gray-500">
									<Loader2 className="h-5 w-5 animate-spin me-2" />
									{__('Loading...', 'codeideal-open-fields')}
								</div>
							) : displayFields.length === 0 ? (
								<div className="text-center py-8 text-gray-500 text-sm">
									{__('No fields available in this fieldset', 'codeideal-open-fields')}
								</div>
							) : (
								<ScrollArea className="h-64">
									<div className="p-1">
										{displayFields.map(field => (
											<FieldTreeItem
												key={field.id}
												field={field}
												allFields={allDisplayFields}
												depth={0}
												onSelect={handleSelectField}
											/>
										))}
									</div>
								</ScrollArea>
							)}
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
