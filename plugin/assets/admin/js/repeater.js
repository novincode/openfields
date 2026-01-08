/**
 * OpenFields Repeater Field Handler
 *
 * Clean, scalable JavaScript for managing repeater fields.
 * Supports nested repeaters with proper event delegation.
 * Uses native HTML5 Drag and Drop API.
 *
 * @package OpenFields
 * @since   1.0.0
 */

(function () {
	'use strict';

	/**
	 * Repeater Controller
	 */
	const Repeater = {
		/**
		 * Initialize
		 */
		init() {
			this.bindEvents();
			this.initAllRepeaters();
		},

		/**
		 * Bind global event listeners using delegation
		 */
		bindEvents() {
			// Use event delegation on document for all repeater interactions
			// This ensures nested repeaters work correctly
			document.addEventListener('click', (e) => {
				const target = e.target;

				// Add row button
				const addBtn = target.closest('.cof-repeater-add');
				if (addBtn) {
					e.preventDefault();
					e.stopPropagation();
					const repeater = addBtn.closest('.cof-repeater');
					if (repeater) {
						this.addRow(repeater);
					}
					return;
				}

				// Remove row button
				const removeBtn = target.closest('.cof-repeater-row-remove');
				if (removeBtn) {
					e.preventDefault();
					e.stopPropagation();
					const row = removeBtn.closest('.cof-repeater-row');
					const repeater = this.getClosestRepeater(row);
					if (row && repeater) {
						this.removeRow(repeater, row);
					}
					return;
				}

				// Toggle/collapse button
				const toggleBtn = target.closest('.cof-repeater-row-toggle');
				if (toggleBtn) {
					e.preventDefault();
					e.stopPropagation();
					const row = toggleBtn.closest('.cof-repeater-row');
					if (row) {
						this.toggleRow(row);
					}
					return;
				}
			});
		},

		/**
		 * Get the immediate parent repeater of an element
		 * @param {HTMLElement} element
		 * @returns {HTMLElement|null}
		 */
		getClosestRepeater(element) {
			// Get the row first
			const row = element.closest('.cof-repeater-row');
			if (!row) return null;

			// The repeater is the parent of .cof-repeater-rows which contains this row
			const rowsContainer = row.parentElement;
			if (!rowsContainer || !rowsContainer.classList.contains('cof-repeater-rows')) {
				return null;
			}

			return rowsContainer.closest('.cof-repeater');
		},

		/**
		 * Initialize all repeaters
		 * @param {HTMLElement} container
		 */
		initAllRepeaters(container = document) {
			const repeaters = container.querySelectorAll('.cof-repeater:not([data-init])');
			repeaters.forEach((repeater) => this.initRepeater(repeater));
		},

		/**
		 * Initialize a single repeater
		 * @param {HTMLElement} repeater
		 */
		initRepeater(repeater) {
			repeater.setAttribute('data-init', 'true');

			// Store config
			repeater._config = {
				name: repeater.dataset.name || '',
				min: parseInt(repeater.dataset.min, 10) || 0,
				max: parseInt(repeater.dataset.max, 10) || 0,
				layout: repeater.dataset.layout || 'block',
			};

			// Init drag and drop
			this.initDragDrop(repeater);

			// Update state
			this.updateState(repeater);

			// Initialize nested repeaters inside existing rows
			const rows = this.getRows(repeater);
			rows.forEach((row) => {
				this.initAllRepeaters(row);
			});
		},

		/**
		 * Get direct child rows of a repeater
		 * @param {HTMLElement} repeater
		 * @returns {NodeList}
		 */
		getRows(repeater) {
			const rowsContainer = repeater.querySelector(':scope > .cof-repeater-rows');
			if (!rowsContainer) return [];
			return rowsContainer.querySelectorAll(':scope > .cof-repeater-row');
		},

		/**
		 * Get rows container
		 * @param {HTMLElement} repeater
		 * @returns {HTMLElement|null}
		 */
		getRowsContainer(repeater) {
			return repeater.querySelector(':scope > .cof-repeater-rows');
		},

		/**
		 * Initialize drag and drop for a repeater
		 * @param {HTMLElement} repeater
		 */
		initDragDrop(repeater) {
			const rowsContainer = this.getRowsContainer(repeater);
			if (!rowsContainer) return;

			let draggedRow = null;
			let placeholder = null;

			// Enable dragging via handle
			rowsContainer.addEventListener('mousedown', (e) => {
				const handle = e.target.closest('.cof-repeater-row-handle');
				if (!handle) return;

				const row = handle.closest('.cof-repeater-row');
				// Ensure this row belongs to THIS repeater (not a nested one)
				if (!row || row.parentElement !== rowsContainer) return;

				row.draggable = true;
				
				// Stop propagation to prevent parent repeaters from also activating drag
				e.stopPropagation();
			});

			rowsContainer.addEventListener('mouseup', (e) => {
				const rows = this.getRows(repeater);
				rows.forEach((row) => (row.draggable = false));
			});

			rowsContainer.addEventListener('dragstart', (e) => {
				const row = e.target.closest('.cof-repeater-row');
				// Only drag direct children - critical for nested repeaters
				if (!row || row.parentElement !== rowsContainer) {
					e.preventDefault();
					return;
				}

				// Stop propagation immediately to prevent parent repeaters from receiving this event
				e.stopImmediatePropagation();

				draggedRow = row;
				row.classList.add('is-dragging');

				// Create placeholder
				placeholder = document.createElement('div');
				placeholder.className = 'cof-repeater-placeholder';
				placeholder.style.height = row.offsetHeight + 'px';

				setTimeout(() => {
					row.style.display = 'none';
					rowsContainer.insertBefore(placeholder, row);
				}, 0);

				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/plain', '');
			});

			rowsContainer.addEventListener('dragover', (e) => {
				e.preventDefault();
				e.stopPropagation(); // Prevent parent repeaters from handling
				
				if (!placeholder || !draggedRow) return;

				const afterElement = this.getDragAfterElement(rowsContainer, e.clientY, repeater);
				if (afterElement) {
					rowsContainer.insertBefore(placeholder, afterElement);
				} else {
					rowsContainer.appendChild(placeholder);
				}
			});

			rowsContainer.addEventListener('dragend', (e) => {
				e.stopPropagation(); // Prevent bubbling to parent repeaters
				
				if (!draggedRow) return;

				draggedRow.classList.remove('is-dragging');
				draggedRow.style.display = '';
				draggedRow.draggable = false;

				if (placeholder && placeholder.parentNode) {
					placeholder.parentNode.insertBefore(draggedRow, placeholder);
					placeholder.remove();
				}

				placeholder = null;
				draggedRow = null;

				// Reindex rows
				this.reindexRows(repeater);
				this.updateState(repeater);
			});

			rowsContainer.addEventListener('drop', (e) => {
				e.preventDefault();
				e.stopPropagation(); // Prevent bubbling
			});
			
			// Prevent drag events from parent repeaters interfering
			rowsContainer.addEventListener('dragenter', (e) => {
				e.stopPropagation();
			});
			
			rowsContainer.addEventListener('dragleave', (e) => {
				e.stopPropagation();
			});
		},

		/**
		 * Get element to insert before during drag
		 * @param {HTMLElement} container
		 * @param {number} y
		 * @param {HTMLElement} repeater
		 * @returns {HTMLElement|null}
		 */
		getDragAfterElement(container, y, repeater) {
			const rows = [...this.getRows(repeater)].filter(
				(row) => !row.classList.contains('is-dragging')
			);

			return rows.reduce(
				(closest, child) => {
					const box = child.getBoundingClientRect();
					const offset = y - box.top - box.height / 2;

					if (offset < 0 && offset > closest.offset) {
						return { offset, element: child };
					}
					return closest;
				},
				{ offset: Number.NEGATIVE_INFINITY }
			).element;
		},

		/**
		 * Add a new row
		 * @param {HTMLElement} repeater
		 */
		addRow(repeater) {
			const config = repeater._config;
			const rowsContainer = this.getRowsContainer(repeater);
			const rows = this.getRows(repeater);

			// Check max limit
			if (config.max > 0 && rows.length >= config.max) {
				return;
			}

			// Get template
			const template = repeater.querySelector(':scope > template.cof-repeater-template');
			if (!template) {
				console.error('[OpenFields] No template found for repeater:', config.name);
				return;
			}

			// Get next index
			const nextIndex = rows.length;

			// Clone template content
			let html = template.innerHTML;
			html = html.replace(/\{\{INDEX\}\}/g, nextIndex);

			// Create element
			const temp = document.createElement('div');
			temp.innerHTML = html.trim();
			const newRow = temp.firstElementChild;

			if (!newRow) return;

			// Update row index attribute
			newRow.setAttribute('data-index', nextIndex);

			// Add to container
			rowsContainer.appendChild(newRow);

		// Initialize nested repeaters in the new row
		this.initAllRepeaters(newRow);

		// Reindex and update
		this.reindexRows(repeater);
		this.updateState(repeater);

		// Trigger conditional logic evaluation for the new row
		if (window.OpenFieldsManager && window.OpenFieldsManager.evaluateAllConditions) {
			window.OpenFieldsManager.evaluateAllConditions();
		}

		// Focus first input
		const firstInput = newRow.querySelector('input:not([type="hidden"]), textarea, select');
		if (firstInput) {
			firstInput.focus();
		}

		// Scroll into view
		newRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	},		/**
		 * Remove a row
		 * @param {HTMLElement} repeater
		 * @param {HTMLElement} row
		 */
		removeRow(repeater, row) {
			const config = repeater._config;
			const rows = this.getRows(repeater);

			// Check min limit
			if (config.min > 0 && rows.length <= config.min) {
				return;
			}

			// Animate and remove
			row.style.opacity = '0';
			row.style.transform = 'translateX(-10px)';
			row.style.transition = 'opacity 0.15s, transform 0.15s';

			setTimeout(() => {
				row.remove();
				this.reindexRows(repeater);
				this.updateState(repeater);
			}, 150);
		},

		/**
		 * Toggle row collapsed state
		 * @param {HTMLElement} row
		 */
		toggleRow(row) {
			row.classList.toggle('is-collapsed');
			const icon = row.querySelector('.cof-repeater-row-toggle .dashicons');
			if (icon) {
				icon.classList.toggle('dashicons-arrow-up-alt2');
				icon.classList.toggle('dashicons-arrow-down-alt2');
			}
		},

		/**
		 * Reindex all rows and update field names
		 * @param {HTMLElement} repeater
		 */
		reindexRows(repeater) {
			const config = repeater._config;
			const rows = this.getRows(repeater);

			rows.forEach((row, newIndex) => {
				const oldIndex = row.getAttribute('data-index');

				// Update row index
				row.setAttribute('data-index', newIndex);

				// Update row number display
				const indexDisplay = row.querySelector(':scope > .cof-repeater-row-handle .cof-repeater-row-index');
				if (indexDisplay) {
					indexDisplay.textContent = newIndex + 1;
				}

				// Update field names if index changed
				if (oldIndex !== null && oldIndex !== String(newIndex)) {
					this.updateFieldNames(row, config.name, oldIndex, newIndex);
				}
			});

			// Update count input
			const countInput = repeater.querySelector(':scope > input.cof-repeater-count');
			if (countInput) {
				countInput.value = rows.length;
			}
		},

		/**
		 * Update field names within a row when index changes
		 * @param {HTMLElement} row
		 * @param {string} baseName
		 * @param {string} oldIndex
		 * @param {number} newIndex
		 */
		updateFieldNames(row, baseName, oldIndex, newIndex) {
			// Update all inputs in this row (but not in nested repeater rows)
			const inputs = row.querySelectorAll('input, textarea, select');

			inputs.forEach((input) => {
				// Skip if this input is inside a nested repeater row
				const closestRow = input.closest('.cof-repeater-row');
				if (closestRow !== row) return;

				// Update name: {base}_{oldIndex}_{subfield} -> {base}_{newIndex}_{subfield}
				// No prefix for ACF compatibility
				if (input.name) {
					const pattern = new RegExp(`^(${this.escapeRegex(baseName)}_)${oldIndex}(_)`);
					input.name = input.name.replace(pattern, `$1${newIndex}$2`);
				}

				// Update ID - handle both numeric indices and {{INDEX}} placeholders
				if (input.id) {
					// Match field_{base}_{index}_{subfield} pattern
					const pattern = new RegExp(`(field_${this.escapeRegex(baseName)}_)${oldIndex}(_)`);
					input.id = input.id.replace(pattern, `$1${newIndex}$2`);
				}
			});

			// Update labels - they need to match the new input IDs
			const labels = row.querySelectorAll('label[for]');
			labels.forEach((label) => {
				const closestRow = label.closest('.cof-repeater-row');
				if (closestRow !== row) return;

				const forAttr = label.getAttribute('for');
				// Match field_{base}_{index}_{subfield} pattern
				const pattern = new RegExp(`(field_${this.escapeRegex(baseName)}_)${oldIndex}(_)`);
				label.setAttribute('for', forAttr.replace(pattern, `$1${newIndex}$2`));
			});

			// Also update nested repeater data-name and their count inputs
			const nestedRepeaters = row.querySelectorAll(':scope > .cof-repeater-row-content .cof-repeater');
			nestedRepeaters.forEach((nested) => {
				const nestedName = nested.dataset.name;
				if (nestedName) {
					// Update the base name: {parent}_{oldIndex}_{child} -> {parent}_{newIndex}_{child}
					const pattern = new RegExp(`^${this.escapeRegex(baseName)}_${oldIndex}_`);
					const newName = nestedName.replace(pattern, `${baseName}_${newIndex}_`);
					nested.dataset.name = newName;

					// Update count input name (no prefix for ACF compatibility)
					const countInput = nested.querySelector(':scope > input.cof-repeater-count');
					if (countInput) {
						countInput.name = newName;
					}

					// Update config
					if (nested._config) {
						nested._config.name = newName;
					}

					// Recursively update all fields inside
					this.updateNestedFieldNames(nested, nestedName, newName);
				}
			});
		},

		/**
		 * Update all field names inside a nested repeater when parent index changes
		 * @param {HTMLElement} repeater
		 * @param {string} oldBaseName
		 * @param {string} newBaseName
		 */
		updateNestedFieldNames(repeater, oldBaseName, newBaseName) {
			const inputs = repeater.querySelectorAll('input, textarea, select');

			inputs.forEach((input) => {
				// No prefix for ACF compatibility
				if (input.name) {
					input.name = input.name.replace(
						`${oldBaseName}_`,
						`${newBaseName}_`
					);
				}
				if (input.id) {
					input.id = input.id.replace(
						`${oldBaseName}_`,
						`${newBaseName}_`
					);
				}
			});

			const labels = repeater.querySelectorAll('label[for]');
			labels.forEach((label) => {
				const forAttr = label.getAttribute('for');
				label.setAttribute('for', forAttr.replace(`${oldBaseName}_`, `${newBaseName}_`));
			});
		},

		/**
		 * Update UI state (button disabled states)
		 * @param {HTMLElement} repeater
		 */
		updateState(repeater) {
			const config = repeater._config;
			const rows = this.getRows(repeater);
			const addBtn = repeater.querySelector(':scope > .cof-repeater-footer > .cof-repeater-add');

			// Add button state
			if (addBtn) {
				addBtn.disabled = config.max > 0 && rows.length >= config.max;
			}

			// Remove button states
			const removeBtns = repeater.querySelectorAll(':scope > .cof-repeater-rows > .cof-repeater-row > .cof-repeater-row-actions > .cof-repeater-row-remove');
			removeBtns.forEach((btn) => {
				btn.disabled = config.min > 0 && rows.length <= config.min;
			});
		},

		/**
		 * Escape string for RegExp
		 * @param {string} str
		 * @returns {string}
		 */
		escapeRegex(str) {
			return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		},
	};

	// Initialize on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => Repeater.init());
	} else {
		Repeater.init();
	}

	// Export
	window.OpenFieldsRepeater = Repeater;
})();
