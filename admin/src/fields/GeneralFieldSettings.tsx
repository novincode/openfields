/**
 * General Field Settings Component
 *
 * Common settings that apply to ALL field types:
 * - Required toggle
 * - Instructions/Help text
 * - Default value handling
 *
 * @package OpenFields
 */

import { __ } from '@wordpress/i18n';
import type { FieldSettingsProps } from '../lib/field-registry';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';

export function GeneralFieldSettings({ field, onSettingsChange }: FieldSettingsProps) {
	const isRequired = field.settings?.required ?? false;
	const instructions = (field.settings?.instructions as string) || '';

	return (
		<div className="space-y-4">
			{/* Required Toggle */}
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label htmlFor={`required-${field.id}`} className="text-sm font-medium">
						{__('Required', 'codeideal-open-fields')}
					</Label>
					<p className="text-xs text-muted-foreground">
						{__('Make this field mandatory', 'codeideal-open-fields')}
					</p>
				</div>
				<Switch
					id={`required-${field.id}`}
					checked={isRequired}
					onCheckedChange={(checked) => onSettingsChange({ required: checked })}
				/>
			</div>

			{/* Instructions */}
			<div>
				<Label htmlFor={`instructions-${field.id}`} className="text-sm font-medium">
					{__('Instructions', 'codeideal-open-fields')}
				</Label>
				<textarea
					id={`instructions-${field.id}`}
					value={instructions}
					onChange={(e) => onSettingsChange({ instructions: e.target.value })}
					className="w-full mt-1 px-3 py-2 border rounded-md text-sm resize-none"
					rows={2}
					placeholder={__('Help text shown below the field', 'codeideal-open-fields')}
				/>
			</div>
		</div>
	);
}
