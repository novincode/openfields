/**
 * Text Field Settings Component
 * 
 * @package OpenFields
 */

import { __ } from '@wordpress/i18n';
import type { FieldSettingsProps } from '../lib/field-registry';

export function TextFieldSettings({ field, onSettingsChange }: FieldSettingsProps) {
	return (
		<div className="space-y-3">
			<div>
				<label className="block text-sm text-gray-600 mb-1">{__('Placeholder', 'codeideal-open-fields')}</label>
				<input
					type="text"
					value={(field.settings?.placeholder as string) || ''}
					onChange={(e) => onSettingsChange({ placeholder: e.target.value })}
					className="w-full px-3 py-2 border rounded-md text-sm"
					placeholder={__('Enter placeholder text', 'codeideal-open-fields')}
				/>
			</div>
			<div>
				<label className="block text-sm text-gray-600 mb-1">{__('Max Length', 'codeideal-open-fields')}</label>
				<input
					type="number"
					value={(field.settings?.max as number) || ''}
					onChange={(e) =>
						onSettingsChange({
							max: e.target.value ? parseInt(e.target.value, 10) : undefined,
						})
					}
					className="w-full px-3 py-2 border rounded-md text-sm"
					placeholder={__('0 = unlimited', 'codeideal-open-fields')}
				/>
			</div>
			<div>
				<label className="block text-sm text-gray-600 mb-1">{__('Default Value', 'codeideal-open-fields')}</label>
				<input
					type="text"
					value={(field.settings?.default_value as string) || ''}
					onChange={(e) => onSettingsChange({ default_value: e.target.value })}
					className="w-full px-3 py-2 border rounded-md text-sm"
					placeholder={__('Default text', 'codeideal-open-fields')}
				/>
			</div>
		</div>
	);
}
