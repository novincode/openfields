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
import { RepeaterFieldSettings } from './RepeaterFieldSettings';
import { PostObjectFieldSettings } from './PostObjectFieldSettings';
import { TaxonomyFieldSettings } from './TaxonomyFieldSettings';
import { UserFieldSettings } from './UserFieldSettings';
import { LinkFieldSettings } from './LinkFieldSettings';

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

	// Repeater - supports nested sub-fields
	const repeaterDef = fieldRegistry.get('repeater');
	if (repeaterDef) {
		fieldRegistry.register({
			...repeaterDef,
			SettingsComponent: RepeaterFieldSettings as React.ComponentType<FieldSettingsProps>,
			hasSubFields: true,
			defaultSettings: {
				min: 0,
				max: 0,
				layout: 'table',
				button_label: 'Add Row',
			},
		});
	}

	// Post Object - searchable post selector
	const postObjectDef = fieldRegistry.get('post_object');
	if (postObjectDef) {
		fieldRegistry.register({
			...postObjectDef,
			SettingsComponent: PostObjectFieldSettings as React.ComponentType<FieldSettingsProps>,
			defaultSettings: {
				post_type: ['post'],
				multiple: false,
				return_format: 'object',
				allow_null: false,
			},
		});
	}

	// Taxonomy - term selector
	const taxonomyDef = fieldRegistry.get('taxonomy');
	if (taxonomyDef) {
		fieldRegistry.register({
			...taxonomyDef,
			SettingsComponent: TaxonomyFieldSettings as React.ComponentType<FieldSettingsProps>,
			defaultSettings: {
				taxonomy: ['category'],
				field_type: 'select',
				multiple: false,
				return_format: 'id',
				save_terms: false,
				load_terms: false,
			},
		});
	}

	// User - searchable user selector
	const userDef = fieldRegistry.get('user');
	if (userDef) {
		fieldRegistry.register({
			...userDef,
			SettingsComponent: UserFieldSettings as React.ComponentType<FieldSettingsProps>,
			defaultSettings: {
				role: '',
				multiple: false,
				return_format: 'array',
				allow_null: false,
			},
		});
	}

	// Link - URL with title and target
	const linkDef = fieldRegistry.get('link');
	if (linkDef) {
		fieldRegistry.register({
			...linkDef,
			SettingsComponent: LinkFieldSettings as React.ComponentType<FieldSettingsProps>,
			defaultSettings: {
				show_title: true,
				show_target: true,
			},
		});
	}
}

// Auto-register on import
registerFieldSettings();
