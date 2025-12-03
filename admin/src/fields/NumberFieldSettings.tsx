/**
 * Number Field Settings Component
 * 
 * @package OpenFields
 */

import type { FieldSettingsProps } from '../lib/field-registry';

export function NumberFieldSettings({ field, onSettingsChange }: FieldSettingsProps) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-3 gap-3">
				<div>
					<label className="block text-sm text-gray-600 mb-1">Min</label>
					<input
						type="number"
						value={(field.settings?.min as number) ?? ''}
						onChange={(e) =>
							onSettingsChange({
								min: e.target.value ? parseFloat(e.target.value) : undefined,
							})
						}
						className="w-full px-3 py-2 border rounded-md text-sm"
					/>
				</div>
				<div>
					<label className="block text-sm text-gray-600 mb-1">Max</label>
					<input
						type="number"
						value={(field.settings?.max as number) ?? ''}
						onChange={(e) =>
							onSettingsChange({
								max: e.target.value ? parseFloat(e.target.value) : undefined,
							})
						}
						className="w-full px-3 py-2 border rounded-md text-sm"
					/>
				</div>
				<div>
					<label className="block text-sm text-gray-600 mb-1">Step</label>
					<input
						type="number"
						value={(field.settings?.step as number) || 1}
						onChange={(e) =>
							onSettingsChange({ step: parseFloat(e.target.value) || 1 })
						}
						className="w-full px-3 py-2 border rounded-md text-sm"
					/>
				</div>
			</div>
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
				<label className="block text-sm text-gray-600 mb-1">Default Value</label>
				<input
					type="number"
					value={(field.settings?.default_value as number) ?? ''}
					onChange={(e) =>
						onSettingsChange({
							default_value: e.target.value ? parseFloat(e.target.value) : undefined,
						})
					}
					className="w-full px-3 py-2 border rounded-md text-sm"
				/>
			</div>
		</div>
	);
}
