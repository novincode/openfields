/**
 * Repeater Field Settings Component
 *
 * Settings panel for configuring repeater fields.
 * Sub-fields are managed via the nested fields UI in the field builder.
 *
 * @package OpenFields
 */

import { __ } from '@wordpress/i18n';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../components/ui/select';
import type { FieldSettingsProps } from '../lib/field-registry';

export function RepeaterFieldSettings({ field, onSettingsChange }: FieldSettingsProps) {
	// Type-safe settings access with defaults
	const settings = field.settings || {};
	const min = typeof settings.min === 'number' ? settings.min : 0;
	const max = typeof settings.max === 'number' ? settings.max : 0;
	const layout = typeof settings.layout === 'string' ? settings.layout : 'table';
	const buttonLabel = typeof settings.button_label === 'string' ? settings.button_label : 'Add Row';

	const handleChange = (key: string, value: unknown) => {
		onSettingsChange({
			...settings,
			[key]: value,
		});
	};

	return (
		<div className="space-y-4">
			{/* Min/Max Rows */}
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="repeater-min">{__('Minimum Rows', 'codeideal-open-fields')}</Label>
					<Input
						id="repeater-min"
						type="number"
						min={0}
						value={min}
						onChange={(e) => handleChange('min', parseInt(e.target.value, 10) || 0)}
						placeholder="0"
					/>
					<p className="text-xs text-muted-foreground">
						Minimum number of rows required
					</p>
				</div>
				<div className="space-y-2">
					<Label htmlFor="repeater-max">{__('Maximum Rows', 'codeideal-open-fields')}</Label>
					<Input
						id="repeater-max"
						type="number"
						min={0}
						value={max}
						onChange={(e) => handleChange('max', parseInt(e.target.value, 10) || 0)}
						placeholder="0 (unlimited)"
					/>
					<p className="text-xs text-muted-foreground">
						Maximum allowed (0 = unlimited)
					</p>
				</div>
			</div>

			{/* Layout */}
			<div className="space-y-2">
				<Label htmlFor="repeater-layout">{__('Layout', 'codeideal-open-fields')}</Label>
				<Select
					value={layout}
					onValueChange={(value) => handleChange('layout', value)}
				>
					<SelectTrigger id="repeater-layout">
						<SelectValue placeholder="Select layout" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="table">{__('Table', 'codeideal-open-fields')}</SelectItem>
						<SelectItem value="block">{__('Block', 'codeideal-open-fields')}</SelectItem>
						<SelectItem value="row">{__('Row', 'codeideal-open-fields')}</SelectItem>
					</SelectContent>
				</Select>
				<p className="text-xs text-muted-foreground">
					How repeater rows should be displayed
				</p>
			</div>

			{/* Button Label */}
			<div className="space-y-2">
				<Label htmlFor="repeater-button">{__('Button Label', 'codeideal-open-fields')}</Label>
				<Input
					id="repeater-button"
					type="text"
					value={buttonLabel}
					onChange={(e) => handleChange('button_label', e.target.value)}
					placeholder={__('Add Row', 'codeideal-open-fields')}
				/>
				<p className="text-xs text-muted-foreground">
					Text displayed on the add row button
				</p>
			</div>

			{/* Sub-fields Note */}
			<div className="rounded-md bg-muted p-3">
				<p className="text-sm text-muted-foreground">
					<strong>{__('Sub-fields:', 'codeideal-open-fields')}</strong> Add sub-fields by clicking the "Add Field" button
					inside this repeater in the field list above. Sub-fields will be repeated
					for each row.
				</p>
			</div>
		</div>
	);
}
