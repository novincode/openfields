/**
 * Switch Field Settings Component
 * 
 * @package OpenFields
 */

import type { FieldSettingsProps } from '../lib/field-registry';

export function SwitchFieldSettings({ field, onSettingsChange }: FieldSettingsProps) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-3">
				<div>
					<label className="block text-sm text-gray-600 mb-1">On Text</label>
					<input
						type="text"
						value={(field.settings?.on_text as string) || 'Yes'}
						onChange={(e) => onSettingsChange({ on_text: e.target.value })}
						className="w-full px-3 py-2 border rounded-md text-sm"
						placeholder="Yes"
					/>
				</div>
				<div>
					<label className="block text-sm text-gray-600 mb-1">Off Text</label>
					<input
						type="text"
						value={(field.settings?.off_text as string) || 'No'}
						onChange={(e) => onSettingsChange({ off_text: e.target.value })}
						className="w-full px-3 py-2 border rounded-md text-sm"
						placeholder="No"
					/>
				</div>
			</div>
			<div>
				<label className="block text-sm text-gray-600 mb-1">Default Value</label>
				<div className="flex gap-4">
					<label className="flex items-center gap-2 text-sm">
						<input
							type="radio"
							name={`default-${field.id}`}
							checked={(field.settings?.default_value as boolean) !== true}
							onChange={() => onSettingsChange({ default_value: false })}
						/>
						Off
					</label>
					<label className="flex items-center gap-2 text-sm">
						<input
							type="radio"
							name={`default-${field.id}`}
							checked={(field.settings?.default_value as boolean) === true}
							onChange={() => onSettingsChange({ default_value: true })}
						/>
						On
					</label>
				</div>
			</div>
		</div>
	);
}
