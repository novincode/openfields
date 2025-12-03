/**
 * Field Type System - Scalable & Type-Safe
 * 
 * This module defines a discriminated union type system for fields.
 * Each field type has its own settings interface, but they all share
 * common properties defined in BaseFieldSettings.
 *
 * @package OpenFields
 */

// ============================================================================
// FIELD TYPES ENUM
// ============================================================================

export const FIELD_TYPES = [
	'text',
	'textarea',
	'number',
	'email',
	'url',
	'select',
	'radio',
	'checkbox',
	'switch',
	'wysiwyg',
	'image',
	'gallery',
	'file',
	'date',
	'datetime',
	'time',
	'color',
	'link',
	'post',
	'taxonomy',
	'user',
	'repeater',
	'group',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_CATEGORIES = ['basic', 'content', 'choice', 'relational', 'layout'] as const;
export type FieldCategory = (typeof FIELD_CATEGORIES)[number];

// ============================================================================
// CONDITIONAL LOGIC
// ============================================================================

export const CONDITION_OPERATORS = ['==', '!=', '>', '<', '>=', '<=', 'contains', 'empty', 'not_empty'] as const;
export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];

export interface ConditionalRule {
	field: string;
	operator: ConditionOperator;
	value: string;
}

// Conditional logic is stored as array of rule groups (OR between groups, AND within group)
export type ConditionalLogic = ConditionalRule[][];

// ============================================================================
// WRAPPER SETTINGS (Common to all fields)
// ============================================================================

export interface WrapperSettings {
	width?: '25' | '33' | '50' | '66' | '75' | '100';
	class?: string;
	id?: string;
}

// ============================================================================
// BASE FIELD SETTINGS (Common to all field types)
// ============================================================================

export interface BaseFieldSettings {
	placeholder?: string;
	default_value?: unknown;
	instructions?: string;
	required?: boolean;
	wrapper?: WrapperSettings;
	conditional_logic?: ConditionalLogic;
}

// ============================================================================
// TYPE-SPECIFIC SETTINGS
// ============================================================================

// Text Field
export interface TextFieldSettings extends BaseFieldSettings {
	max_length?: number;
	prepend?: string;
	append?: string;
}

// Textarea Field
export interface TextareaFieldSettings extends BaseFieldSettings {
	rows?: number;
	max_length?: number;
	new_lines?: 'br' | 'wpautop';
}

// Number Field
export interface NumberFieldSettings extends BaseFieldSettings {
	min?: number;
	max?: number;
	step?: number;
	prepend?: string;
	append?: string;
}

// Email Field
export interface EmailFieldSettings extends BaseFieldSettings {
	// Email specific settings
}

// URL Field
export interface UrlFieldSettings extends BaseFieldSettings {
	// URL specific settings
}

// Choice item
export interface Choice {
	value: string;
	label: string;
}

// Select Field
export interface SelectFieldSettings extends BaseFieldSettings {
	choices?: Choice[];
	multiple?: boolean;
	allow_null?: boolean;
	return_format?: 'value' | 'label' | 'array';
}

// Radio Field
export interface RadioFieldSettings extends BaseFieldSettings {
	choices?: Choice[];
	layout?: 'vertical' | 'horizontal';
	allow_null?: boolean;
	return_format?: 'value' | 'label' | 'array';
}

// Checkbox Field
export interface CheckboxFieldSettings extends BaseFieldSettings {
	choices?: Choice[];
	layout?: 'vertical' | 'horizontal';
	toggle_all?: boolean;
	return_format?: 'value' | 'label' | 'array';
}

// Switch Field
export interface SwitchFieldSettings extends BaseFieldSettings {
	on_text?: string;
	off_text?: string;
}

// WYSIWYG Field
export interface WysiwygFieldSettings extends BaseFieldSettings {
	tabs?: 'all' | 'visual' | 'text';
	toolbar?: 'full' | 'basic';
	media_upload?: boolean;
	delay?: boolean;
}

// Image Field
export interface ImageFieldSettings extends BaseFieldSettings {
	return_format?: 'array' | 'url' | 'id';
	preview_size?: string;
	library?: 'all' | 'uploadedTo';
	min_width?: number;
	max_width?: number;
	min_height?: number;
	max_height?: number;
	min_size?: string;
	max_size?: string;
	mime_types?: string;
}

// Gallery Field
export interface GalleryFieldSettings extends BaseFieldSettings {
	return_format?: 'array' | 'url' | 'id';
	preview_size?: string;
	library?: 'all' | 'uploadedTo';
	min?: number;
	max?: number;
	min_width?: number;
	max_width?: number;
	min_height?: number;
	max_height?: number;
	min_size?: string;
	max_size?: string;
	mime_types?: string;
}

// File Field
export interface FileFieldSettings extends BaseFieldSettings {
	return_format?: 'array' | 'url' | 'id';
	library?: 'all' | 'uploadedTo';
	min_size?: string;
	max_size?: string;
	mime_types?: string;
}

// Date Field
export interface DateFieldSettings extends BaseFieldSettings {
	display_format?: string;
	return_format?: string;
	first_day?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

// DateTime Field
export interface DatetimeFieldSettings extends BaseFieldSettings {
	display_format?: string;
	return_format?: string;
	first_day?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

// Time Field
export interface TimeFieldSettings extends BaseFieldSettings {
	display_format?: string;
	return_format?: string;
}

// Color Field
export interface ColorFieldSettings extends BaseFieldSettings {
	enable_opacity?: boolean;
	return_format?: 'string' | 'array';
}

// Link Field
export interface LinkFieldSettings extends BaseFieldSettings {
	return_format?: 'array' | 'url';
}

// Post Field
export interface PostFieldSettings extends BaseFieldSettings {
	post_type?: string[];
	taxonomy?: string[];
	allow_null?: boolean;
	multiple?: boolean;
	return_format?: 'object' | 'id';
}

// Taxonomy Field
export interface TaxonomyFieldSettings extends BaseFieldSettings {
	taxonomy?: string;
	field_type?: 'checkbox' | 'multi_select' | 'radio' | 'select';
	allow_null?: boolean;
	add_term?: boolean;
	save_terms?: boolean;
	load_terms?: boolean;
	return_format?: 'object' | 'id';
}

// User Field
export interface UserFieldSettings extends BaseFieldSettings {
	role?: string[];
	allow_null?: boolean;
	multiple?: boolean;
	return_format?: 'array' | 'id' | 'object';
}

// Forward declaration for recursive types
export interface BaseField {
	id: number | string; // string for temp IDs before save
	fieldset_id: number;
	parent_id?: number | string | null; // null/undefined = root level, field ID = nested in that parent
	name: string;
	label: string;
	type: FieldType;
	menu_order: number;
	created_at?: string;
	updated_at?: string;
}

// Repeater Field (recursive - contains sub_fields)
export interface RepeaterFieldSettings extends BaseFieldSettings {
	sub_fields?: Field[];
	min?: number;
	max?: number;
	layout?: 'table' | 'block' | 'row';
	button_label?: string;
	collapsed?: string;
}

// Group Field (contains sub_fields)
export interface GroupFieldSettings extends BaseFieldSettings {
	sub_fields?: Field[];
	layout?: 'block' | 'table' | 'row';
}

// ============================================================================
// SETTINGS TYPE MAP (Maps FieldType to its Settings interface)
// ============================================================================

export interface FieldSettingsMap {
	text: TextFieldSettings;
	textarea: TextareaFieldSettings;
	number: NumberFieldSettings;
	email: EmailFieldSettings;
	url: UrlFieldSettings;
	select: SelectFieldSettings;
	radio: RadioFieldSettings;
	checkbox: CheckboxFieldSettings;
	switch: SwitchFieldSettings;
	wysiwyg: WysiwygFieldSettings;
	image: ImageFieldSettings;
	gallery: GalleryFieldSettings;
	file: FileFieldSettings;
	date: DateFieldSettings;
	datetime: DatetimeFieldSettings;
	time: TimeFieldSettings;
	color: ColorFieldSettings;
	link: LinkFieldSettings;
	post: PostFieldSettings;
	taxonomy: TaxonomyFieldSettings;
	user: UserFieldSettings;
	repeater: RepeaterFieldSettings;
	group: GroupFieldSettings;
}

// ============================================================================
// DISCRIMINATED UNION FIELD TYPE
// ============================================================================

/**
 * Creates a typed field with discriminated union based on `type`
 * TypeScript will narrow the settings type based on the field type
 */
export type TypedField<T extends FieldType> = BaseField & {
	type: T;
	settings: FieldSettingsMap[T];
};

// Individual field types (for convenience)
export type TextField = TypedField<'text'>;
export type TextareaField = TypedField<'textarea'>;
export type NumberField = TypedField<'number'>;
export type EmailField = TypedField<'email'>;
export type UrlField = TypedField<'url'>;
export type SelectField = TypedField<'select'>;
export type RadioField = TypedField<'radio'>;
export type CheckboxField = TypedField<'checkbox'>;
export type SwitchField = TypedField<'switch'>;
export type WysiwygField = TypedField<'wysiwyg'>;
export type ImageField = TypedField<'image'>;
export type GalleryField = TypedField<'gallery'>;
export type FileField = TypedField<'file'>;
export type DateField = TypedField<'date'>;
export type DatetimeField = TypedField<'datetime'>;
export type TimeField = TypedField<'time'>;
export type ColorField = TypedField<'color'>;
export type LinkField = TypedField<'link'>;
export type PostField = TypedField<'post'>;
export type TaxonomyField = TypedField<'taxonomy'>;
export type UserField = TypedField<'user'>;
export type RepeaterField = TypedField<'repeater'>;
export type GroupField = TypedField<'group'>;

/**
 * The main Field union type
 * TypeScript will narrow the type based on the `type` discriminator
 */
export type Field =
	| TextField
	| TextareaField
	| NumberField
	| EmailField
	| UrlField
	| SelectField
	| RadioField
	| CheckboxField
	| SwitchField
	| WysiwygField
	| ImageField
	| GalleryField
	| FileField
	| DateField
	| DatetimeField
	| TimeField
	| ColorField
	| LinkField
	| PostField
	| TaxonomyField
	| UserField
	| RepeaterField
	| GroupField;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Type guard to check if a field is of a specific type
 */
export function isFieldType<T extends FieldType>(
	field: Field,
	type: T
): field is Extract<Field, { type: T }> {
	return field.type === type;
}

/**
 * Get default settings for a field type
 */
export function getDefaultSettings<T extends FieldType>(type: T): FieldSettingsMap[T] {
	const defaults: FieldSettingsMap = {
		text: { placeholder: '' },
		textarea: { rows: 4 },
		number: { min: undefined, max: undefined, step: 1 },
		email: {},
		url: {},
		select: { choices: [], multiple: false, allow_null: false },
		radio: { choices: [], layout: 'vertical' },
		checkbox: { choices: [], layout: 'vertical' },
		switch: { on_text: 'Yes', off_text: 'No' },
		wysiwyg: { tabs: 'all', toolbar: 'full', media_upload: true },
		image: { return_format: 'array', preview_size: 'medium' },
		gallery: { return_format: 'array', preview_size: 'medium' },
		file: { return_format: 'array' },
		date: { display_format: 'Y-m-d', return_format: 'Y-m-d' },
		datetime: { display_format: 'Y-m-d H:i', return_format: 'Y-m-d H:i:s' },
		time: { display_format: 'H:i', return_format: 'H:i:s' },
		color: { enable_opacity: false },
		link: { return_format: 'array' },
		post: { post_type: ['post'], multiple: false },
		taxonomy: { taxonomy: 'category', field_type: 'select' },
		user: { role: [], multiple: false },
		repeater: { sub_fields: [], min: 0, max: 0, layout: 'table', button_label: 'Add Row' },
		group: { sub_fields: [], layout: 'block' },
	};
	return defaults[type];
}

/**
 * Create a new field with defaults
 */
export function createField<T extends FieldType>(
	type: T,
	data: Partial<Omit<TypedField<T>, 'type' | 'settings'>> & {
		settings?: Partial<FieldSettingsMap[T]>;
	}
): Omit<TypedField<T>, 'id' | 'fieldset_id' | 'created_at' | 'updated_at'> {
	return {
		name: '',
		label: '',
		type,
		menu_order: 0,
		...data,
		settings: {
			...getDefaultSettings(type),
			...data.settings,
		} as FieldSettingsMap[T],
	};
}
