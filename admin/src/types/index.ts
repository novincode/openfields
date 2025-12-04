/**
 * OpenFields Admin TypeScript Types
 *
 * @package OpenFields
 */

// Import and re-export field types from the canonical source
import type { FieldType, FieldCategory } from './fields';
export type { FieldType, FieldCategory };
export { FIELD_TYPES } from './fields';

// Field Schema
export interface FieldTypeSchema {
	key: FieldType;
	label: string;
	icon: string;
	category: 'basic' | 'content' | 'choice' | 'relational' | 'layout';
	settings: FieldSettingDefinition[];
	defaultValue?: unknown;
}

export interface FieldSettingDefinition {
	key: string;
	label: string;
	type: 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'choices';
	default?: unknown;
	options?: { value: string; label: string }[];
	condition?: {
		field: string;
		value: unknown;
	};
}

// Field Instance
export interface Field {
	id: number | string; // string for temp IDs before save
	fieldset_id: number;
	parent_id?: number | string | null; // null/undefined = root level, field ID = nested in that parent
	name: string;
	label: string;
	type: FieldType;
	settings: FieldSettings;
	menu_order: number;
	created_at?: string;
	updated_at?: string;
}

export interface FieldSettings {
	placeholder?: string;
	default_value?: unknown;
	instructions?: string;
	required?: boolean;
	wrapper?: {
		width?: string;
		class?: string;
		id?: string;
	};
	conditional_logic?: ConditionalRule[][];
	// Type-specific settings
	min?: number;
	max?: number;
	step?: number;
	rows?: number;
	choices?: Choice[];
	multiple?: boolean;
	allow_null?: boolean;
	return_format?: string;
	preview_size?: string;
	mime_types?: string;
	post_type?: string[];
	taxonomy?: string[];
	sub_fields?: Field[];
	[key: string]: unknown;
}

export interface Choice {
	value: string;
	label: string;
}

export interface ConditionalRule {
	field: string;
	operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'empty' | 'not_empty';
	value: string;
}

// Fieldset
export interface Fieldset {
	id: number;
	title: string;
	field_key: string;
	description?: string;
	settings: FieldsetSettings;
	is_active: boolean;
	menu_order: number;
	created_at?: string;
	updated_at?: string;
	fields?: Field[];
}

export interface FieldsetSettings {
	position?: 'normal' | 'side' | 'acf_after_title';
	style?: 'default' | 'seamless';
	label_placement?: 'top' | 'left';
	instruction_placement?: 'label' | 'field';
	location_groups?: LocationGroup[];
}

// Location Rules
export interface LocationRule {
	type: string;
	operator: '==' | '!=';
	value: string;
}

export interface LocationGroup {
	id: string;
	rules: LocationRule[];
}

export interface LocationType {
	key: string;
	label: string;
	options: { value: string; label: string }[];
}

// API Response Types
export interface ApiResponse<T> {
	success: boolean;
	data: T;
	message?: string;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	per_page: number;
}

// Store Types
export interface FieldsetStore {
	fieldsets: Fieldset[];
	currentFieldset: Fieldset | null;
	isLoading: boolean;
	error: string | null;
	fetchFieldsets: () => Promise<void>;
	fetchFieldset: (id: number) => Promise<void>;
	createFieldset: (data: Partial<Fieldset>) => Promise<Fieldset>;
	updateFieldset: (id: number, data: Partial<Fieldset>) => Promise<void>;
	deleteFieldset: (id: number) => Promise<void>;
	duplicateFieldset: (id: number) => Promise<Fieldset>;
	setCurrentFieldset: (fieldset: Fieldset | null) => void;
}

export interface FieldStore {
	fields: Field[];
	selectedField: Field | null;
	isDragging: boolean;
	addField: (fieldsetId: number, type: FieldType, index?: number) => void;
	updateField: (id: number, data: Partial<Field>) => void;
	deleteField: (id: number) => void;
	reorderFields: (fieldsetId: number, fromIndex: number, toIndex: number) => void;
	duplicateField: (id: number) => void;
	setSelectedField: (field: Field | null) => void;
	setIsDragging: (dragging: boolean) => void;
}

export interface UIStore {
	sidebarOpen: boolean;
	activePanel: 'fields' | 'settings' | 'location';
	notifications: Notification[];
	toggleSidebar: () => void;
	setActivePanel: (panel: 'fields' | 'settings' | 'location') => void;
	addNotification: (notification: Omit<Notification, 'id'>) => void;
	removeNotification: (id: string) => void;
}

export interface Notification {
	id: string;
	type: 'success' | 'error' | 'warning' | 'info';
	message: string;
	duration?: number;
}

// WordPress Data
export interface WPPostType {
	name: string;
	label: string;
	labels: {
		singular_name: string;
		name: string;
	};
}

export interface WPTaxonomy {
	name: string;
	label: string;
	labels: {
		singular_name: string;
		name: string;
	};
}

export interface WPUser {
	id: number;
	name: string;
	email: string;
}

// Global Window Extension
declare global {
	interface Window {
		openfieldsAdmin: {
			restUrl: string;
			nonce: string;
			adminUrl: string;
			pluginUrl: string;
			version: string;
			ajaxUrl: string;
			postTypes: { name: string; label: string }[];
			taxonomies: { name: string; label: string }[];
			userRoles: { name: string; label: string }[];
			fieldTypes: { key: string; label: string }[];
			i18n: Record<string, string>;
		};
	}
}

export {};
