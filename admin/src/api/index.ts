/**
 * API client for OpenFields admin
 *
 * @package OpenFields
 */

import type { Fieldset, Field, LocationType } from '../types';

const getConfig = () => ({
	apiUrl: window.openfieldsAdmin?.apiUrl || '/wp-json/openfields/v1',
	nonce: window.openfieldsAdmin?.nonce || '',
});

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
		return request<Field[]>(`/fieldsets/${fieldsetId}/fields`);
	},

	/**
	 * Create a field
	 */
	async create(fieldsetId: number, data: Partial<Field>): Promise<Field> {
		return request<Field>(`/fieldsets/${fieldsetId}/fields`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	/**
	 * Update a field
	 */
	async update(id: number, data: Partial<Field>): Promise<Field> {
		return request<Field>(`/fields/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
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

export default {
	fieldset: fieldsetApi,
	field: fieldApi,
	fieldTypes: fieldTypesApi,
	location: locationApi,
};
