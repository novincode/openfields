/**
 * Textarea Field Settings Component
 * 
 * @package OpenFields
 */

import type { FieldSettingsProps } from '../lib/field-registry';

export function TextareaFieldSettings({ field, onSettingsChange }: FieldSettingsProps) {
	return (
		<div className="space-y-3">
			<div>
				<label className="block text-sm text-gray-600 mb-1">Placeholder</label>
				<input
					type="text"
					value={(field.settings?.placeholder as string) || ''}
					onChange={(e) => onSettingsChange({ placeholder: e.target.value })}
					className="w-full px-3 py-2 border rounded-md text-sm"
					placeholder="Enter placeholder text"
				/>
			</div>
			<div>
				<label className="block text-sm text-gray-600 mb-1">Rows</label>
				<input
					type="number"
					value={(field.settings?.rows as number) || 4}
					onChange={(e) =>
						onSettingsChange({ rows: parseInt(e.target.value, 10) || 4 })
					}
					className="w-full px-3 py-2 border rounded-md text-sm"
					min={1}
				/>
			</div>
			<div>
				<label className="block text-sm text-gray-600 mb-1">Default Value</label>
				<textarea
					value={(field.settings?.default_value as string) || ''}
					onChange={(e) => onSettingsChange({ default_value: e.target.value })}
					className="w-full px-3 py-2 border rounded-md text-sm"
					rows={3}
					placeholder="Default text"
				/>
			</div>
		</div>
	);
}
