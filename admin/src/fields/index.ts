/**
 * Fields Index - Register All Field Types with Settings Components
 * 
 * This file imports and registers all field types with their settings components.
 * To add a new field type, create a file in this folder and import it here.
 *
 * @package OpenFields
 */

import { fieldRegistry } from '../lib/field-registry';
import type { FieldSettingsProps } from '../lib/field-registry';

// Import settings components
import { TextFieldSettings } from './TextFieldSettings';
import { TextareaFieldSettings } from './TextareaFieldSettings';
import { NumberFieldSettings } from './NumberFieldSettings';
import { SelectFieldSettings } from './SelectFieldSettings';
import { SwitchFieldSettings } from './SwitchFieldSettings';

/**
 * Register all field types with their settings components
 */
export function registerFieldSettings() {
	// Text
	const textDef = fieldRegistry.get('text');
	if (textDef) {
		fieldRegistry.register({
			...textDef,
			SettingsComponent: TextFieldSettings as React.ComponentType<FieldSettingsProps>,
			defaultSettings: {
				placeholder: '',
				max_length: undefined,
			},
		});
	}

	// Textarea
	const textareaDef = fieldRegistry.get('textarea');
	if (textareaDef) {
		fieldRegistry.register({
			...textareaDef,
			SettingsComponent: TextareaFieldSettings as React.ComponentType<FieldSettingsProps>,
			defaultSettings: {
				placeholder: '',
				rows: 4,
			},
		});
	}

	// Number
	const numberDef = fieldRegistry.get('number');
	if (numberDef) {
		fieldRegistry.register({
			...numberDef,
			SettingsComponent: NumberFieldSettings as React.ComponentType<FieldSettingsProps>,
			defaultSettings: {
				min: undefined,
				max: undefined,
				step: 1,
			},
		});
	}

	// Select
	const selectDef = fieldRegistry.get('select');
	if (selectDef) {
		fieldRegistry.register({
			...selectDef,
			SettingsComponent: SelectFieldSettings as React.ComponentType<FieldSettingsProps>,
			defaultSettings: {
				choices: [],
				multiple: false,
				allow_null: false,
			},
		});
	}

	// Switch
	const switchDef = fieldRegistry.get('switch');
	if (switchDef) {
		fieldRegistry.register({
			...switchDef,
			SettingsComponent: SwitchFieldSettings as React.ComponentType<FieldSettingsProps>,
			defaultSettings: {
				on_text: 'Yes',
				off_text: 'No',
			},
		});
	}

	// Radio - same as Select for now
	const radioDef = fieldRegistry.get('radio');
	if (radioDef) {
		fieldRegistry.register({
			...radioDef,
			SettingsComponent: SelectFieldSettings as React.ComponentType<FieldSettingsProps>,
			defaultSettings: {
				choices: [],
				layout: 'vertical',
			},
		});
	}

	// Checkbox - same as Select for now
	const checkboxDef = fieldRegistry.get('checkbox');
	if (checkboxDef) {
		fieldRegistry.register({
			...checkboxDef,
			SettingsComponent: SelectFieldSettings as React.ComponentType<FieldSettingsProps>,
			defaultSettings: {
				choices: [],
				layout: 'vertical',
			},
		});
	}
}

// Auto-register on import
registerFieldSettings();
