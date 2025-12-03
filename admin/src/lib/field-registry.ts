/**
 * Field Registry - Plugin Architecture for Field Types
 * 
 * This module provides a scalable, extensible way to register field types.
 * Each field type can register its own settings component, validation, 
 * and other behaviors without modifying core code.
 *
 * @package OpenFields
 */

import type { ComponentType } from 'react';
import type { FieldType, FieldCategory } from '../types/fields';
import type { Field, FieldSettings } from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props passed to field settings components (simplified, uses base Field type)
 */
export interface FieldSettingsProps {
	field: Field;
	onSettingsChange: (settings: Partial<FieldSettings>) => void;
}

/**
 * Field type registration definition
 */
export interface FieldTypeDefinition {
	/** Unique field type key */
	type: FieldType;
	/** Display label */
	label: string;
	/** Icon (Lucide icon name or custom) */
	icon?: string;
	/** Category for grouping */
	category: FieldCategory;
	/** Description for UI */
	description?: string;
	/** Settings component for this field type */
	SettingsComponent?: ComponentType<FieldSettingsProps>;
	/** Default settings when creating a new field */
	defaultSettings?: Partial<FieldSettings>;
	/** Validate field configuration */
	validate?: (field: Field) => string[] | null;
	/** Custom preview renderer for the field list */
	PreviewComponent?: ComponentType<{ field: Field }>;
	/** Whether this field type supports sub-fields */
	hasSubFields?: boolean;
}

/**
 * Field type metadata (without React components, for serialization)
 */
export interface FieldTypeMeta {
	type: FieldType;
	label: string;
	icon?: string;
	category: FieldCategory;
	description?: string;
	hasSubFields?: boolean;
}

// ============================================================================
// REGISTRY CLASS
// ============================================================================

class FieldRegistry {
	private fields: Map<FieldType, FieldTypeDefinition> = new Map();
	private listeners: Set<() => void> = new Set();

	/**
	 * Register a field type
	 */
	register(definition: FieldTypeDefinition): void {
		const existing = this.fields.get(definition.type);
		if (existing) {
			// Merge with existing definition instead of overwriting completely
			this.fields.set(definition.type, {
				...existing,
				...definition,
			});
		} else {
			this.fields.set(definition.type, definition);
		}
		this.notifyListeners();
	}

	/**
	 * Register multiple field types at once
	 */
	registerMany(definitions: FieldTypeDefinition[]): void {
		definitions.forEach((def) => this.register(def));
	}

	/**
	 * Get a field type definition
	 */
	get(type: FieldType): FieldTypeDefinition | undefined {
		return this.fields.get(type);
	}

	/**
	 * Get all registered field types
	 */
	getAll(): FieldTypeDefinition[] {
		return Array.from(this.fields.values());
	}

	/**
	 * Get field types by category
	 */
	getByCategory(category: FieldCategory): FieldTypeDefinition[] {
		return this.getAll().filter((f) => f.category === category);
	}

	/**
	 * Get field types grouped by category
	 */
	getGroupedByCategory(): Record<FieldCategory, FieldTypeDefinition[]> {
		const grouped: Record<FieldCategory, FieldTypeDefinition[]> = {
			basic: [],
			content: [],
			choice: [],
			relational: [],
			layout: [],
		};
		this.getAll().forEach((def) => {
			grouped[def.category].push(def);
		});
		return grouped;
	}

	/**
	 * Get metadata (without components) for all field types
	 */
	getMetadata(): FieldTypeMeta[] {
		return this.getAll().map(({ type, label, icon, category, description, hasSubFields }) => ({
			type,
			label,
			icon,
			category,
			description,
			hasSubFields,
		}));
	}

	/**
	 * Check if a field type is registered
	 */
	has(type: FieldType): boolean {
		return this.fields.has(type);
	}

	/**
	 * Get the settings component for a field type
	 */
	getSettingsComponent(type: FieldType): ComponentType<FieldSettingsProps> | undefined {
		return this.get(type)?.SettingsComponent;
	}

	/**
	 * Get default settings for a field type
	 */
	getDefaultSettings(type: FieldType): Partial<FieldSettings> {
		return this.get(type)?.defaultSettings ?? {};
	}

	/**
	 * Validate a field
	 */
	validate(field: Field): string[] | null {
		const definition = this.get(field.type);
		if (!definition?.validate) {
			return null;
		}
		return definition.validate(field);
	}

	/**
	 * Subscribe to registry changes
	 */
	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notifyListeners(): void {
		this.listeners.forEach((listener) => listener());
	}
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const fieldRegistry = new FieldRegistry();

// ============================================================================
// REACT HOOK
// ============================================================================

import { useSyncExternalStore, useCallback } from 'react';

/**
 * React hook to access field registry
 */
export function useFieldRegistry() {
	const getSnapshot = useCallback(() => fieldRegistry.getAll(), []);
	const subscribe = useCallback((callback: () => void) => fieldRegistry.subscribe(callback), []);
	
	useSyncExternalStore(subscribe, getSnapshot);
	
	return {
		registry: fieldRegistry,
		fieldTypes: fieldRegistry.getAll(),
		getFieldType: <T extends FieldType>(type: T) => fieldRegistry.get(type),
		getGroupedByCategory: () => fieldRegistry.getGroupedByCategory(),
		getSettingsComponent: (type: FieldType) => fieldRegistry.getSettingsComponent(type),
	};
}

// ============================================================================
// DEFAULT FIELD REGISTRATIONS
// ============================================================================

// Register default field types with basic metadata
// Settings components are registered separately in field modules

const defaultFieldTypes: FieldTypeDefinition[] = [
	// Basic
	{ type: 'text', label: 'Text', category: 'basic', icon: 'Type', description: 'Single line text input' },
	{ type: 'textarea', label: 'Textarea', category: 'basic', icon: 'AlignLeft', description: 'Multi-line text area' },
	{ type: 'number', label: 'Number', category: 'basic', icon: 'Hash', description: 'Numeric input with validation' },
	{ type: 'email', label: 'Email', category: 'basic', icon: 'Mail', description: 'Email input with validation' },
	{ type: 'url', label: 'URL', category: 'basic', icon: 'Link', description: 'URL input with validation' },
	
	// Content
	{ type: 'wysiwyg', label: 'WYSIWYG Editor', category: 'content', icon: 'FileText', description: 'Rich text editor' },
	{ type: 'image', label: 'Image', category: 'content', icon: 'Image', description: 'Single image upload' },
	{ type: 'gallery', label: 'Gallery', category: 'content', icon: 'Images', description: 'Multiple image gallery' },
	{ type: 'file', label: 'File', category: 'content', icon: 'File', description: 'File upload' },
	
	// Choice
	{ type: 'select', label: 'Select', category: 'choice', icon: 'ChevronDown', description: 'Dropdown selection' },
	{ type: 'radio', label: 'Radio', category: 'choice', icon: 'Circle', description: 'Radio button group' },
	{ type: 'checkbox', label: 'Checkbox', category: 'choice', icon: 'CheckSquare', description: 'Checkbox group' },
	{ type: 'switch', label: 'Switch', category: 'choice', icon: 'ToggleLeft', description: 'True/False toggle' },
	
	// Advanced (part of basic date/time)
	{ type: 'date', label: 'Date Picker', category: 'basic', icon: 'Calendar', description: 'Date selection' },
	{ type: 'datetime', label: 'Date Time', category: 'basic', icon: 'CalendarClock', description: 'Date and time selection' },
	{ type: 'time', label: 'Time', category: 'basic', icon: 'Clock', description: 'Time selection' },
	{ type: 'color', label: 'Color Picker', category: 'basic', icon: 'Palette', description: 'Color selection' },
	
	// Relational
	{ type: 'link', label: 'Link', category: 'relational', icon: 'ExternalLink', description: 'URL with title and target' },
	{ type: 'post', label: 'Post Object', category: 'relational', icon: 'FileText', description: 'Select WordPress posts' },
	{ type: 'taxonomy', label: 'Taxonomy', category: 'relational', icon: 'Tags', description: 'Select taxonomy terms' },
	{ type: 'user', label: 'User', category: 'relational', icon: 'User', description: 'Select WordPress users' },
	
	// Layout
	{ type: 'repeater', label: 'Repeater', category: 'layout', icon: 'Repeat', description: 'Repeatable sub-fields', hasSubFields: true },
	{ type: 'group', label: 'Group', category: 'layout', icon: 'FolderOpen', description: 'Group fields together', hasSubFields: true },
];

// Auto-register defaults
fieldRegistry.registerMany(defaultFieldTypes);
