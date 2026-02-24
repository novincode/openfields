/**
 * Select Field Settings Component
 * 
 * Also used for Radio and Checkbox fields
 * 
 * @package OpenFields
 */

import { __ } from '@wordpress/i18n';
import { Plus, X } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../components/ui/select';
import type { FieldSettingsProps } from '../lib/field-registry';
import type { Choice } from '../types';

export function SelectFieldSettings({ field, onSettingsChange }: FieldSettingsProps) {
	const choices = (field.settings?.choices as Choice[]) || [];
	const isSelect = field.type === 'select';
	const isCheckbox = field.type === 'checkbox';

	const handleAddChoice = () => {
		onSettingsChange({
			choices: [...choices, { value: '', label: '' }],
		});
	};

	const handleUpdateChoice = (
		index: number,
		key: 'value' | 'label',
		value: string
	) => {
		const newChoices = [...choices];
		const existingChoice = newChoices[index];
		if (existingChoice) {
			newChoices[index] = {
				value: key === 'value' ? value : existingChoice.value,
				label: key === 'label' ? value : existingChoice.label,
			};
			onSettingsChange({ choices: newChoices });
		}
	};

	const handleRemoveChoice = (index: number) => {
		const newChoices = choices.filter((_, i) => i !== index);
		onSettingsChange({ choices: newChoices });
	};

	return (
		<div className="space-y-4 border-t pt-4">
			<h4 className="text-sm font-medium">{__('Field Type Settings', 'codeideal-open-fields')}</h4>
			
			{/* Toggle Options */}
			<div className="space-y-3">
				{isSelect && (
					<div className="flex items-center justify-between">
						<Label htmlFor={`multiple-${field.id}`} className="text-sm font-normal">{__('Allow Multiple Selections', 'codeideal-open-fields')}</Label>
						<Switch
							id={`multiple-${field.id}`}
							checked={(field.settings?.multiple as boolean) || false}
							onCheckedChange={(checked) => onSettingsChange({ multiple: checked })}
						/>
					</div>
				)}
				
				<div className="flex items-center justify-between">
					<Label htmlFor={`allow-null-${field.id}`} className="text-sm font-normal">{__('Allow Empty Value', 'codeideal-open-fields')}</Label>
					<Switch
						id={`allow-null-${field.id}`}
						checked={(field.settings?.allow_null as boolean) || false}
						onCheckedChange={(checked) => onSettingsChange({ allow_null: checked })}
					/>
				</div>
				
				{isCheckbox && (
					<div className="flex items-center justify-between">
						<Label htmlFor={`toggle-all-${field.id}`} className="text-sm font-normal">{__('Show Toggle All', 'codeideal-open-fields')}</Label>
						<Switch
							id={`toggle-all-${field.id}`}
							checked={(field.settings?.toggle_all as boolean) || false}
							onCheckedChange={(checked) => onSettingsChange({ toggle_all: checked })}
						/>
					</div>
				)}
			</div>

			{/* Layout option for radio/checkbox */}
			{!isSelect && (
				<div className="space-y-2">
					<Label>{__('Layout', 'codeideal-open-fields')}</Label>
					<Select
						value={(field.settings?.layout as string) || 'vertical'}
						onValueChange={(value) => onSettingsChange({ layout: value })}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select layout" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="vertical">{__('Vertical', 'codeideal-open-fields')}</SelectItem>
							<SelectItem value="horizontal">{__('Horizontal', 'codeideal-open-fields')}</SelectItem>
						</SelectContent>
					</Select>
				</div>
			)}

			{/* Choices editor */}
			<div className="space-y-2">
				<Label>{__('Choices', 'codeideal-open-fields')}</Label>
				<div className="space-y-2 bg-gray-50 p-3 rounded-lg">
					{choices.length === 0 && (
						<p className="text-sm text-gray-500 text-center py-2">{__('No choices added yet', 'codeideal-open-fields')}</p>
					)}
					{choices.map((choice, index) => (
						<div key={index} className="flex items-center gap-2">
							<Input
								value={choice.value}
								onChange={(e) => handleUpdateChoice(index, 'value', e.target.value)}
								placeholder="value"
								className="flex-1"
							/>
							<Input
								value={choice.label}
								onChange={(e) => handleUpdateChoice(index, 'label', e.target.value)}
								placeholder="label"
								className="flex-1"
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => handleRemoveChoice(index)}
								className="h-9 w-9 text-gray-400 hover:text-red-600"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					))}
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleAddChoice}
						className="w-full mt-2"
					>
						<Plus className="h-3 w-3 mr-1" />{__('Add Choice', 'codeideal-open-fields')}</Button>
				</div>
			</div>

			{/* Return format */}
			<div className="space-y-2">
				<Label htmlFor={`return-format-${field.id}`}>{__('Return Format', 'codeideal-open-fields')}</Label>
				<Select
					value={(field.settings?.return_format as string) || 'value'}
					onValueChange={(value) => onSettingsChange({ return_format: value })}
				>
					<SelectTrigger id={`return-format-${field.id}`}>
						<SelectValue placeholder="Select format" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="value">{__('Value', 'codeideal-open-fields')}</SelectItem>
						<SelectItem value="label">{__('Label', 'codeideal-open-fields')}</SelectItem>
						<SelectItem value="array">{__('Both (Array)', 'codeideal-open-fields')}</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
