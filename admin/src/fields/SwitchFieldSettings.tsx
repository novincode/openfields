/**
 * Switch Field Settings Component
 * 
 * @package OpenFields
 */

import { __ } from '@wordpress/i18n';
import type { FieldSettingsProps } from '../lib/field-registry';

export function SwitchFieldSettings({ field, onSettingsChange }: FieldSettingsProps) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-3">
				<div>
					<label className="block text-sm text-gray-600 mb-1">{__('On Text', 'codeideal-open-fields')}</label>
					<input
						type="text"
						value={(field.settings?.on_text as string) || 'Yes'}
						onChange={(e) => onSettingsChange({ on_text: e.target.value })}
						className="w-full px-3 py-2 border rounded-md text-sm"
						placeholder={__('Yes', 'codeideal-open-fields')}
					/>
				</div>
				<div>
					<label className="block text-sm text-gray-600 mb-1">{__('Off Text', 'codeideal-open-fields')}</label>
					<input
						type="text"
						value={(field.settings?.off_text as string) || 'No'}
						onChange={(e) => onSettingsChange({ off_text: e.target.value })}
						className="w-full px-3 py-2 border rounded-md text-sm"
						placeholder={__('No', 'codeideal-open-fields')}
					/>
				</div>
			</div>
			<div>
				<label className="block text-sm text-gray-600 mb-1">{__('Default Value', 'codeideal-open-fields')}</label>
				<div className="flex gap-4">
					<label className="flex items-center gap-2 text-sm">
						<input
							type="radio"
							name={`default-${field.id}`}
							checked={(field.settings?.default_value as boolean) !== true}
							onChange={() => onSettingsChange({ default_value: false })}
						/>
						{__('Off', 'codeideal-open-fields')}
					</label>
					<label className="flex items-center gap-2 text-sm">
						<input
							type="radio"
							name={`default-${field.id}`}
							checked={(field.settings?.default_value as boolean) === true}
							onChange={() => onSettingsChange({ default_value: true })}
						/>
						{__('On', 'codeideal-open-fields')}
					</label>
				</div>
			</div>
		</div>
	);
}
