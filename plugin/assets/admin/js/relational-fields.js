/**
 * OpenFields Relational Fields JavaScript.
 *
 * Handles searchable selects for post object, taxonomy, and user fields.
 *
 * @package OpenFields
 * @since   1.0.0
 */

(function() {
	'use strict';

	const { __ } = wp.i18n;

	// Debounce utility.
	function debounce(fn, delay) {
		let timer = null;
		return function(...args) {
			clearTimeout(timer);
			timer = setTimeout(() => fn.apply(this, args), delay);
		};
	}

	/**
	 * Build REST API URL handling both pretty permalinks and index.php?rest_route= format.
	 *
	 * @param {string} endpoint The REST endpoint (e.g., 'openfields/v1/search/posts')
	 * @param {Object} params   Query parameters as key-value pairs
	 * @return {string} The full URL
	 */
	function buildRestUrl(endpoint, params = {}) {
		const baseUrl = cofldConfig.restUrl;
		
		// Build query string
		const queryString = Object.entries(params)
			.filter(([, v]) => v !== '' && v !== null && v !== undefined)
			.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
			.join('&');
		
		// Check if we're using index.php?rest_route= format
		if (baseUrl.includes('?')) {
			// Already has query string, use & for additional params
			return queryString 
				? `${baseUrl}${endpoint}&${queryString}`
				: `${baseUrl}${endpoint}`;
		} else {
			// Pretty permalinks, use ? for query string
			return queryString 
				? `${baseUrl}${endpoint}?${queryString}`
				: `${baseUrl}${endpoint}`;
		}
	}

	/**
	 * Initialize relational fields.
	 */
	function init() {
		// Post Object fields.
		document.querySelectorAll('.cofld-post-object-field').forEach(initPostObjectField);

		// User fields.
		document.querySelectorAll('.cofld-user-field').forEach(initUserField);

		// Taxonomy select fields (for searchable enhancement).
		document.querySelectorAll('.cofld-taxonomy-select .cofld-searchable-select').forEach(initSearchableSelect);
	}

	/**
	 * Initialize a Post Object field.
	 *
	 * @param {HTMLElement} container Field container.
	 */
	function initPostObjectField(container) {
		const input = container.querySelector('input[type="hidden"]');
		const searchInput = container.querySelector('.cofld-search-input');
		const resultsContainer = container.querySelector('.cofld-search-results');
		const selectedContainer = container.querySelector('.cofld-selected-items');

		const multiple = container.dataset.multiple === '1';
		const postTypes = container.dataset.postTypes || 'post';

		// Handle remove button clicks.
		container.addEventListener('click', (e) => {
			if (e.target.closest('.cofld-remove-item')) {
				const item = e.target.closest('.cofld-selected-item');
				if (item) {
					removeSelectedItem(item, input, multiple);
				}
			}
		});

		// Search handler.
		const search = debounce(async (query) => {
			if (query.length < 2) {
				resultsContainer.innerHTML = '';
				resultsContainer.classList.remove('active');
				return;
			}

			resultsContainer.innerHTML = '<div class="cofld-search-loading">' + __('Searching...', 'codeideal-open-fields') + '</div>';
			resultsContainer.classList.add('active');

			try {
				const url = buildRestUrl('openfields/v1/search/posts', {
					s: query,
					post_type: postTypes,
					per_page: 10
				});

				const response = await fetch(url, {
					headers: {
						'X-WP-Nonce': cofldConfig.restNonce
					}
				});

				const data = await response.json();
				renderSearchResults(data.results, resultsContainer, (post) => {
					selectPost(post, input, selectedContainer, multiple);
					searchInput.value = '';
					resultsContainer.innerHTML = '';
					resultsContainer.classList.remove('active');
				});
			} catch (error) {
				resultsContainer.innerHTML = '<div class="cofld-search-error">' + __('Search failed', 'codeideal-open-fields') + '</div>';
			}
		}, 300);

		searchInput.addEventListener('input', (e) => search(e.target.value));

		// Close results on outside click.
		document.addEventListener('click', (e) => {
			if (!container.contains(e.target)) {
				resultsContainer.classList.remove('active');
			}
		});
	}

	/**
	 * Initialize a User field.
	 *
	 * @param {HTMLElement} container Field container.
	 */
	function initUserField(container) {
		const input = container.querySelector('input[type="hidden"]');
		const searchInput = container.querySelector('.cofld-search-input');
		const resultsContainer = container.querySelector('.cofld-search-results');
		const selectedContainer = container.querySelector('.cofld-selected-items');

		const multiple = container.dataset.multiple === '1';
		const roles = container.dataset.roles || '';

		// Handle remove button clicks.
		container.addEventListener('click', (e) => {
			if (e.target.closest('.cofld-remove-item')) {
				const item = e.target.closest('.cofld-selected-item');
				if (item) {
					removeSelectedItem(item, input, multiple);
				}
			}
		});

		// Search handler.
		const search = debounce(async (query) => {
			if (query.length < 2) {
				resultsContainer.innerHTML = '';
				resultsContainer.classList.remove('active');
				return;
			}

			resultsContainer.innerHTML = '<div class="cofld-search-loading">' + __('Searching...', 'codeideal-open-fields') + '</div>';
			resultsContainer.classList.add('active');

			try {
				const params = {
					s: query,
					per_page: 10
				};
				if (roles) {
					params.role = roles;
				}

				const url = buildRestUrl('openfields/v1/search/users', params);

				const response = await fetch(url, {
					headers: {
						'X-WP-Nonce': cofldConfig.restNonce
					}
				});

				const data = await response.json();
				renderUserResults(data.results, resultsContainer, (user) => {
					selectUser(user, input, selectedContainer, multiple);
					searchInput.value = '';
					resultsContainer.innerHTML = '';
					resultsContainer.classList.remove('active');
				});
			} catch (error) {
				resultsContainer.innerHTML = '<div class="cofld-search-error">' + __('Search failed', 'codeideal-open-fields') + '</div>';
			}
		}, 300);

		searchInput.addEventListener('input', (e) => search(e.target.value));

		// Close results on outside click.
		document.addEventListener('click', (e) => {
			if (!container.contains(e.target)) {
				resultsContainer.classList.remove('active');
			}
		});
	}

	/**
	 * Render post search results.
	 *
	 * @param {Array}    posts     Array of post objects.
	 * @param {Element}  container Results container.
	 * @param {Function} onSelect  Selection callback.
	 */
	function renderSearchResults(posts, container, onSelect) {
		if (!posts.length) {
			container.innerHTML = '<div class="cofld-search-empty">' + __('No results found', 'codeideal-open-fields') + '</div>';
			return;
		}

		container.innerHTML = posts.map(post => `
			<div class="cofld-search-result" data-id="${post.id}">
				<span class="cofld-result-title">${escapeHtml(post.title)}</span>
				<span class="cofld-result-type">${escapeHtml(post.type_label)}</span>
			</div>
		`).join('');

		container.querySelectorAll('.cofld-search-result').forEach((el, i) => {
			el.addEventListener('click', () => onSelect(posts[i]));
		});
	}

	/**
	 * Render user search results.
	 *
	 * @param {Array}    users     Array of user objects.
	 * @param {Element}  container Results container.
	 * @param {Function} onSelect  Selection callback.
	 */
	function renderUserResults(users, container, onSelect) {
		if (!users.length) {
			container.innerHTML = '<div class="cofld-search-empty">' + __('No users found', 'codeideal-open-fields') + '</div>';
			return;
		}

		container.innerHTML = users.map(user => `
			<div class="cofld-search-result" data-id="${user.id}">
				<img src="${escapeHtml(user.avatar)}" alt="" class="cofld-user-avatar" />
				<span class="cofld-result-title">${escapeHtml(user.display_name)}</span>
				<span class="cofld-result-email">${escapeHtml(user.user_email)}</span>
			</div>
		`).join('');

		container.querySelectorAll('.cofld-search-result').forEach((el, i) => {
			el.addEventListener('click', () => onSelect(users[i]));
		});
	}

	/**
	 * Select a post.
	 *
	 * @param {Object}  post              Post data.
	 * @param {Element} input             Hidden input.
	 * @param {Element} selectedContainer Container for selected items.
	 * @param {boolean} multiple          Allow multiple selections.
	 */
	function selectPost(post, input, selectedContainer, multiple) {
		// Check if already selected.
		const existing = selectedContainer.querySelector(`[data-id="${post.id}"]`);
		if (existing) return;

		if (!multiple) {
			// Clear existing selection.
			selectedContainer.innerHTML = '';
			input.value = post.id;
		} else {
			// Add to existing values.
			const values = input.value ? input.value.split(',').map(Number) : [];
			values.push(post.id);
			input.value = values.join(',');
		}

		// Add selected item element.
		const item = document.createElement('div');
		item.className = 'cofld-selected-item';
		item.dataset.id = post.id;
		item.innerHTML = `
			<span class="cofld-item-title">${escapeHtml(post.title)}</span>
			<span class="cofld-item-type">${escapeHtml(post.type_label)}</span>
			<button type="button" class="cofld-remove-item" title="${__('Remove', 'codeideal-open-fields')}">
				<span class="dashicons dashicons-no-alt"></span>
			</button>
		`;
		selectedContainer.appendChild(item);
	}

	/**
	 * Select a user.
	 *
	 * @param {Object}  user              User data.
	 * @param {Element} input             Hidden input.
	 * @param {Element} selectedContainer Container for selected items.
	 * @param {boolean} multiple          Allow multiple selections.
	 */
	function selectUser(user, input, selectedContainer, multiple) {
		// Check if already selected.
		const existing = selectedContainer.querySelector(`[data-id="${user.id}"]`);
		if (existing) return;

		if (!multiple) {
			// Clear existing selection.
			selectedContainer.innerHTML = '';
			input.value = user.id;
		} else {
			// Add to existing values.
			const values = input.value ? input.value.split(',').map(Number) : [];
			values.push(user.id);
			input.value = values.join(',');
		}

		// Add selected item element.
		const item = document.createElement('div');
		item.className = 'cofld-selected-item';
		item.dataset.id = user.id;
		item.innerHTML = `
			<img src="${escapeHtml(user.avatar)}" alt="" class="cofld-user-avatar" />
			<span class="cofld-item-title">${escapeHtml(user.display_name)}</span>
			<button type="button" class="cofld-remove-item" title="${__('Remove', 'codeideal-open-fields')}">
				<span class="dashicons dashicons-no-alt"></span>
			</button>
		`;
		selectedContainer.appendChild(item);
	}

	/**
	 * Remove a selected item.
	 *
	 * @param {Element} item     Item element to remove.
	 * @param {Element} input    Hidden input.
	 * @param {boolean} multiple Allow multiple selections.
	 */
	function removeSelectedItem(item, input, multiple) {
		const id = parseInt(item.dataset.id, 10);
		item.remove();

		if (multiple) {
			const values = input.value.split(',').map(Number).filter(v => v !== id);
			input.value = values.join(',');
		} else {
			input.value = '';
		}
	}

	/**
	 * Initialize a searchable select (for taxonomy dropdowns).
	 *
	 * @param {HTMLSelectElement} select Select element.
	 */
	function initSearchableSelect(select) {
		// Basic enhancement - could be expanded with a proper library like Select2.
		// For now, add a simple filter.
		const container = select.closest('.cofld-taxonomy-select');
		if (!container) return;

		// The taxonomy select already works, this is for future enhancement.
	}

	/**
	 * Escape HTML entities.
	 *
	 * @param {string} text Text to escape.
	 * @return {string} Escaped text.
	 */
	function escapeHtml(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	// Initialize on DOMContentLoaded.
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	// Re-initialize when new content is added (for repeaters).
	document.addEventListener('openfields:row:added', () => {
		setTimeout(init, 100);
	});
})();
