/**
 * Select Field Settings Component
 * 
 * Also used for Radio and Checkbox fields
 * 
 * @package OpenFields
 */

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
		<div className="space-y-3">
			{/* Options based on field type */}
			<div className="flex items-center gap-4">
				{isSelect && (
					<label className="flex items-center gap-2 text-sm text-gray-600">
						<input
							type="checkbox"
							checked={(field.settings?.multiple as boolean) || false}
							onChange={(e) => onSettingsChange({ multiple: e.target.checked })}
							className="rounded"
						/>
						Allow Multiple
					</label>
				)}
				<label className="flex items-center gap-2 text-sm text-gray-600">
					<input
						type="checkbox"
						checked={(field.settings?.allow_null as boolean) || false}
						onChange={(e) => onSettingsChange({ allow_null: e.target.checked })}
						className="rounded"
					/>
					Allow Empty
				</label>
			</div>

			{/* Layout option for radio/checkbox */}
			{!isSelect && (
				<div>
					<label className="block text-sm text-gray-600 mb-1">Layout</label>
					<div className="flex gap-4">
						<label className="flex items-center gap-2 text-sm">
							<input
								type="radio"
								name={`layout-${field.id}`}
								checked={(field.settings?.layout as string) !== 'horizontal'}
								onChange={() => onSettingsChange({ layout: 'vertical' })}
							/>
							Vertical
						</label>
						<label className="flex items-center gap-2 text-sm">
							<input
								type="radio"
								name={`layout-${field.id}`}
								checked={(field.settings?.layout as string) === 'horizontal'}
								onChange={() => onSettingsChange({ layout: 'horizontal' })}
							/>
							Horizontal
						</label>
					</div>
				</div>
			)}

			{/* Toggle all for checkbox */}
			{isCheckbox && (
				<label className="flex items-center gap-2 text-sm text-gray-600">
					<input
						type="checkbox"
						checked={(field.settings?.toggle_all as boolean) || false}
						onChange={(e) => onSettingsChange({ toggle_all: e.target.checked })}
						className="rounded"
					/>
					Show Toggle All
				</label>
			)}

			{/* Choices editor */}
			<div>
				<label className="block text-sm text-gray-600 mb-2">Choices</label>
				<div className="space-y-2">
					{choices.map((choice, index) => (
						<div key={index} className="flex items-center gap-2">
							<input
								type="text"
								value={choice.value}
								onChange={(e) =>
									handleUpdateChoice(index, 'value', e.target.value)
								}
								placeholder="value"
								className="flex-1 px-3 py-2 border rounded-md text-sm"
							/>
							<input
								type="text"
								value={choice.label}
								onChange={(e) =>
									handleUpdateChoice(index, 'label', e.target.value)
								}
								placeholder="label"
								className="flex-1 px-3 py-2 border rounded-md text-sm"
							/>
							<button
								type="button"
								onClick={() => handleRemoveChoice(index)}
								className="p-2 text-gray-400 hover:text-red-600"
							>
								×
							</button>
						</div>
					))}
				</div>
				<button
					type="button"
					onClick={handleAddChoice}
					className="mt-2 text-sm text-blue-600 hover:underline"
				>
					+ Add Choice
				</button>
			</div>

			{/* Return format */}
			<div>
				<label className="block text-sm text-gray-600 mb-1">Return Format</label>
				<select
					value={(field.settings?.return_format as string) || 'value'}
					onChange={(e) => onSettingsChange({ return_format: e.target.value })}
					className="w-full px-3 py-2 border rounded-md text-sm"
				>
					<option value="value">Value</option>
					<option value="label">Label</option>
					<option value="array">Both (Array)</option>
				</select>
			</div>
		</div>
	);
}
