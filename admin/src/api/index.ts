/**
 * API client for OpenFields admin
 *
 * @package OpenFields
 */

import type { Fieldset, Field, LocationType } from '../types';

const getConfig = () => ({
	apiUrl: window.cofldAdmin?.restUrl || '/wp-json/codeideal-open-fields/v1',
	nonce: window.cofldAdmin?.nonce || '',
});

/**
 * Transform a field from API format to frontend format
 * API returns: conditional_logic, wrapper_config, field_config as separate fields
 * Frontend expects: settings object containing all of these
 */
function transformFieldFromAPI(apiField: any): Field {
	const settings: any = {
		placeholder: apiField.placeholder,
		default_value: apiField.default_value,
		instructions: apiField.instructions,
		required: apiField.required,
	};

	// Add conditional_logic if present
	if (apiField.conditional_logic) {
		settings.conditional_logic = apiField.conditional_logic;
	}

	// Add wrapper config if present (wrapper_config -> wrapper)
	if (apiField.wrapper_config) {
		settings.wrapper = apiField.wrapper_config;
	}

	// Add field config (type-specific settings)
	if (apiField.field_config) {
		Object.assign(settings, apiField.field_config);
	}

	return {
		...apiField,
		// Normalize parent_id - null, undefined, 0, or "0" all become null
		parent_id: apiField.parent_id && apiField.parent_id !== '0' && apiField.parent_id !== 0 
			? apiField.parent_id 
			: null,
		settings,
	};
}

/**
 * Transform a field from frontend format to API format
 * Frontend sends: settings object containing conditional_logic, wrapper, and type-specific settings
 * API expects: these as separate top-level fields
 * 
 * IMPORTANT: We must send empty values too (empty string, empty array, null) 
 * so the API knows to clear them. Only skip truly undefined values.
 */
function transformFieldToAPI(frontendField: Partial<Field>): any {
	const apiData: any = { ...frontendField };
	
	// Handle parent_id - send null explicitly if not set or 0
	if ('parent_id' in frontendField) {
		apiData.parent_id = frontendField.parent_id || null;
	}
	
	// If settings is provided, extract its contents to top-level fields
	if (frontendField.settings) {
		const { settings } = frontendField;
		
		// Add top-level fields from settings - use 'in' operator to check existence, not truthiness
		// This ensures empty strings and null values are sent to clear fields
		if ('placeholder' in settings) apiData.placeholder = settings.placeholder ?? '';
		if ('default_value' in settings) apiData.default_value = settings.default_value ?? '';
		if ('instructions' in settings) apiData.instructions = settings.instructions ?? '';
		if ('required' in settings) apiData.required = settings.required;
		
		// Transform wrapper -> wrapper_config (send even if empty to clear)
		if ('wrapper' in settings) {
			apiData.wrapper_config = settings.wrapper || {};
		}
		
		// Extract conditional_logic (send even if empty/undefined to clear)
		if ('conditional_logic' in settings) {
			apiData.conditional_logic = settings.conditional_logic || [];
		}
		
		// All other settings go into field_config
		const field_config: any = {};
		const knownKeys = ['placeholder', 'default_value', 'instructions', 'required', 'wrapper', 'conditional_logic'];
		for (const [key, value] of Object.entries(settings)) {
			if (!knownKeys.includes(key)) {
				field_config[key] = value;
			}
		}
		// Send field_config which contains all type-specific settings
		// REST API will handle both 'settings' and 'field_config' parameters
		apiData.field_config = field_config;
		
		// Remove settings from apiData as it's been expanded to field_config
		delete apiData.settings;
	}
	
	return apiData;
}

/**
 * Make an API request
 */
async function request<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const { apiUrl, nonce } = getConfig();
	const url = `${apiUrl}${endpoint}`;

	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		'X-WP-Nonce': nonce,
	};

	const response = await fetch(url, {
		...options,
		headers: {
			...headers,
			...options.headers,
		},
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'An error occurred' }));
		throw new Error(error.message || `HTTP ${response.status}`);
	}

	return response.json();
}

/**
 * Fieldset API
 */
export const fieldsetApi = {
	/**
	 * Get all fieldsets
	 */
	async getAll(): Promise<Fieldset[]> {
		return request<Fieldset[]>('/fieldsets');
	},

	/**
	 * Get a single fieldset
	 */
	async get(id: number): Promise<Fieldset> {
		return request<Fieldset>(`/fieldsets/${id}`);
	},

	/**
	 * Create a fieldset
	 */
	async create(data: Partial<Fieldset>): Promise<Fieldset> {
		return request<Fieldset>('/fieldsets', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	/**
	 * Update a fieldset
	 */
	async update(id: number, data: Partial<Fieldset>): Promise<Fieldset> {
		return request<Fieldset>(`/fieldsets/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	},

	/**
	 * Delete a fieldset
	 */
	async delete(id: number): Promise<void> {
		return request<void>(`/fieldsets/${id}`, {
			method: 'DELETE',
		});
	},

	/**
	 * Duplicate a fieldset
	 */
	async duplicate(id: number): Promise<Fieldset> {
		return request<Fieldset>(`/fieldsets/${id}/duplicate`, {
			method: 'POST',
		});
	},

	/**
	 * Export a fieldset
	 */
	async export(id: number): Promise<object> {
		return request<object>(`/fieldsets/${id}/export`);
	},

	/**
	 * Import fieldsets
	 */
	async import(data: object): Promise<{ imported: number }> {
		return request<{ imported: number }>('/fieldsets/import', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},
};

/**
 * Fields API
 */
export const fieldApi = {
	/**
	 * Get fields for a fieldset
	 */
	async getByFieldset(fieldsetId: number): Promise<Field[]> {
		const fields = await request<any[]>(`/fieldsets/${fieldsetId}/fields`);
		return fields.map(transformFieldFromAPI);
	},

	/**
	 * Create a field
	 */
	async create(fieldsetId: number, data: Partial<Field>): Promise<Field> {
		const apiData = transformFieldToAPI(data);
		const response = await request<any>(`/fieldsets/${fieldsetId}/fields`, {
			method: 'POST',
			body: JSON.stringify(apiData),
		});
		return transformFieldFromAPI(response);
	},

	/**
	 * Update a field
	 */
	async update(id: number, data: Partial<Field>): Promise<Field> {
		const apiData = transformFieldToAPI(data);
		const response = await request<any>(`/fields/${id}`, {
			method: 'PUT',
			body: JSON.stringify(apiData),
		});
		return transformFieldFromAPI(response);
	},

	/**
	 * Delete a field
	 */
	async delete(id: number): Promise<void> {
		return request<void>(`/fields/${id}`, {
			method: 'DELETE',
		});
	},

	/**
	 * Bulk update fields (for reordering)
	 */
	async bulkUpdate(
		fieldsetId: number,
		fields: { id: number; menu_order: number }[]
	): Promise<void> {
		return request<void>(`/fieldsets/${fieldsetId}/fields/bulk`, {
			method: 'PUT',
			body: JSON.stringify({ fields }),
		});
	},
};

/**
 * Field Types API
 */
export const fieldTypesApi = {
	/**
	 * Get all registered field types
	 */
	async getAll(): Promise<Record<string, { label: string; category: string }>> {
		return request<Record<string, { label: string; category: string }>>('/field-types');
	},
};

/**
 * Location API
 */
export const locationApi = {
	/**
	 * Get location types and options
	 */
	async getTypes(): Promise<LocationType[]> {
		return request<LocationType[]>('/locations/types');
	},

	/**
	 * Get location rules for a fieldset
	 */
	async getRules(fieldsetId: number): Promise<object> {
		return request<object>(`/fieldsets/${fieldsetId}/locations`);
	},

	/**
	 * Update location rules
	 */
	async updateRules(fieldsetId: number, rules: object): Promise<void> {
		return request<void>(`/fieldsets/${fieldsetId}/locations`, {
			method: 'PUT',
			body: JSON.stringify({ rules }),
		});
	},
};

/**
 * Settings API
 */
export interface PluginSettings {
	version: string;
	enable_rest_api: boolean;
	show_admin_column: boolean;
	delete_data: boolean;
}

export const settingsApi = {
	/**
	 * Get plugin settings
	 */
	async get(): Promise<PluginSettings> {
		return request<PluginSettings>('/settings');
	},

	/**
	 * Update plugin settings
	 */
	async update(settings: Partial<PluginSettings>): Promise<PluginSettings> {
		return request<PluginSettings>('/settings', {
			method: 'PUT',
			body: JSON.stringify(settings),
		});
	},
};

export default {
	fieldset: fieldsetApi,
	field: fieldApi,
	fieldTypes: fieldTypesApi,
	location: locationApi,
	settings: settingsApi,
};
