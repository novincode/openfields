/**
 * Field name utilities
 * 
 * Helpers for validating and formatting field names used as WordPress meta keys
 */

/**
 * WordPress allows only: lowercase letters, numbers, hyphens, underscores
 * This sanitizes a field name to match WordPress sanitize_key rules
 */
export function sanitizeFieldName(name: string): string {
	if (!name) return '';
	
	// Convert to lowercase
	let sanitized = name.toLowerCase();
	
	// Replace spaces with underscores
	sanitized = sanitized.replace(/\s+/g, '_');
	
	// Remove any characters that aren't alphanumeric, hyphens, or underscores
	sanitized = sanitized.replace(/[^a-z0-9_-]/g, '');
	
	return sanitized;
}

/**
 * Check if a field name is valid (non-empty after sanitization)
 */
export function isValidFieldName(name: string): boolean {
	return sanitizeFieldName(name).length > 0;
}

/**
 * Check if a field name already exists in a list of fields
 */
export function isFieldNameDuplicate(name: string, otherFields: { name: string }[]): boolean {
	const sanitized = sanitizeFieldName(name);
	return otherFields.some(field => sanitizeFieldName(field.name) === sanitized);
}

/**
 * Get a list of all field names (excluding a specific field ID)
 */
export function getFieldNamesInFieldset(fields: { id: string | number; name: string }[], excludeId?: string | number): string[] {
	return fields
		.filter(f => excludeId === undefined || f.id !== excludeId)
		.map(f => f.name);
}
