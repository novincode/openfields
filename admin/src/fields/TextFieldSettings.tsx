/**
 * Text Field Settings Component
 * 
 * @package OpenFields
 */

import type { FieldSettingsProps } from '../lib/field-registry';

export function TextFieldSettings({ field, onSettingsChange }: FieldSettingsProps) {
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
				<label className="block text-sm text-gray-600 mb-1">Max Length</label>
				<input
					type="number"
					value={(field.settings?.max as number) || ''}
					onChange={(e) =>
						onSettingsChange({
							max: e.target.value ? parseInt(e.target.value, 10) : undefined,
						})
					}
					className="w-full px-3 py-2 border rounded-md text-sm"
					placeholder="0 = unlimited"
				/>
			</div>
			<div>
				<label className="block text-sm text-gray-600 mb-1">Default Value</label>
				<input
					type="text"
					value={(field.settings?.default_value as string) || ''}
					onChange={(e) => onSettingsChange({ default_value: e.target.value })}
					className="w-full px-3 py-2 border rounded-md text-sm"
					placeholder="Default text"
				/>
			</div>
		</div>
	);
}
