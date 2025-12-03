/**
 * OpenFields Repeater Field Handler
 *
 * Clean, scalable JavaScript for managing repeater fields.
 * Uses native HTML5 Drag and Drop API for row reordering.
 * ACF-compatible data format: {field}_{index}_{subfield}
 *
 * @package OpenFields
 * @since   1.0.0
 */

(function () {
	'use strict';

	/**
	 * RepeaterManager - Singleton controller for all repeater fields
	 */
	const RepeaterManager = {
		/**
		 * Initialize all repeaters on page load
		 */
		init() {
			this.initAllRepeaters();
			this.bindGlobalEvents();
			console.log('[OpenFields] Repeater manager initialized');
		},

		/**
		 * Initialize all repeater fields in the document or a container
		 * @param {HTMLElement} container - Container to search within
		 */
		initAllRepeaters(container = document) {
			const repeaters = container.querySelectorAll('.openfields-repeater:not([data-initialized])');
			repeaters.forEach((repeater) => this.initRepeater(repeater));
		},

		/**
		 * Initialize a single repeater field
		 * @param {HTMLElement} repeater - The repeater container element
		 */
		initRepeater(repeater) {
			// Mark as initialized
			repeater.setAttribute('data-initialized', 'true');

			// Store config
			const config = {
				fieldName: repeater.dataset.fieldName,
				min: parseInt(repeater.dataset.min, 10) || 0,
				max: parseInt(repeater.dataset.max, 10) || 0,
				layout: repeater.dataset.layout || 'table',
			};

			// Store on element for later access
			repeater._config = config;

			// Bind events
			this.bindRepeaterEvents(repeater);

			// Initialize drag and drop
			this.initDragDrop(repeater);

			// Initialize existing rows
			this.initRows(repeater);

			// Update UI state
			this.updateRepeaterState(repeater);
		},

		/**
		 * Bind event listeners for a repeater
		 * @param {HTMLElement} repeater
		 */
		bindRepeaterEvents(repeater) {
			// Add row button
			const addBtn = repeater.querySelector('.openfields-repeater-add');
			if (addBtn) {
				addBtn.addEventListener('click', (e) => {
					e.preventDefault();
					this.addRow(repeater);
				});
			}

			// Event delegation for row actions
			repeater.addEventListener('click', (e) => {
				const target = e.target;

				// Remove row
				if (target.closest('.openfields-repeater-row-remove')) {
					e.preventDefault();
					const row = target.closest('.openfields-repeater-row');
					if (row) {
						this.removeRow(repeater, row);
					}
				}
			});
		},

		/**
		 * Initialize all rows in a repeater
		 * @param {HTMLElement} repeater
		 */
		initRows(repeater) {
			const rows = repeater.querySelectorAll('.openfields-repeater-row');
			rows.forEach((row, index) => {
				row.setAttribute('data-row-index', index);
				// Initialize nested repeaters
				this.initAllRepeaters(row);
			});
		},

		/**
		 * Initialize HTML5 drag and drop for row reordering
		 * @param {HTMLElement} repeater
		 */
		initDragDrop(repeater) {
			const rowsContainer = repeater.querySelector('.openfields-repeater-rows');
			if (!rowsContainer) return;

			let draggedRow = null;
			let placeholder = null;

			// Make rows draggable via handle
			rowsContainer.addEventListener('mousedown', (e) => {
				const handle = e.target.closest('.openfields-repeater-row-handle');
				if (!handle) return;

				const row = handle.closest('.openfields-repeater-row');
				if (!row) return;

				row.setAttribute('draggable', 'true');
			});

			rowsContainer.addEventListener('mouseup', () => {
				const rows = rowsContainer.querySelectorAll('.openfields-repeater-row');
				rows.forEach((row) => row.removeAttribute('draggable'));
			});

			// Drag start
			rowsContainer.addEventListener('dragstart', (e) => {
				const row = e.target.closest('.openfields-repeater-row');
				if (!row) return;

				draggedRow = row;
				row.classList.add('is-dragging');

				// Create placeholder
				placeholder = document.createElement('div');
				placeholder.className = 'openfields-repeater-row-placeholder';
				placeholder.style.height = row.offsetHeight + 'px';

				// Use setTimeout to allow the drag image to be captured
				setTimeout(() => {
					row.style.display = 'none';
					row.parentNode.insertBefore(placeholder, row);
				}, 0);

				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/plain', '');
			});

			// Drag over
			rowsContainer.addEventListener('dragover', (e) => {
				e.preventDefault();
				e.dataTransfer.dropEffect = 'move';

				if (!placeholder) return;

				const afterElement = this.getDragAfterElement(rowsContainer, e.clientY);

				if (afterElement) {
					rowsContainer.insertBefore(placeholder, afterElement);
				} else {
					rowsContainer.appendChild(placeholder);
				}
			});

			// Drag end
			rowsContainer.addEventListener('dragend', (e) => {
				if (!draggedRow) return;

				draggedRow.classList.remove('is-dragging');
				draggedRow.style.display = '';
				draggedRow.removeAttribute('draggable');

				if (placeholder && placeholder.parentNode) {
					placeholder.parentNode.insertBefore(draggedRow, placeholder);
					placeholder.remove();
				}

				placeholder = null;
				draggedRow = null;

				// Reindex all rows
				this.reindexRows(repeater);
				this.updateRepeaterState(repeater);

				// Trigger change event
				this.triggerChange(repeater);
			});

			// Drop (cleanup)
			rowsContainer.addEventListener('drop', (e) => {
				e.preventDefault();
			});
		},

		/**
		 * Get the element to insert before during drag
		 * @param {HTMLElement} container
		 * @param {number} y - Mouse Y position
		 * @returns {HTMLElement|null}
		 */
		getDragAfterElement(container, y) {
			const draggableElements = [
				...container.querySelectorAll('.openfields-repeater-row:not(.is-dragging)'),
			];

			return draggableElements.reduce(
				(closest, child) => {
					const box = child.getBoundingClientRect();
					const offset = y - box.top - box.height / 2;

					if (offset < 0 && offset > closest.offset) {
						return { offset: offset, element: child };
					} else {
						return closest;
					}
				},
				{ offset: Number.NEGATIVE_INFINITY }
			).element;
		},

		/**
		 * Add a new row to the repeater
		 * @param {HTMLElement} repeater
		 */
		addRow(repeater) {
			const config = repeater._config;
			const rowsContainer = repeater.querySelector('.openfields-repeater-rows');
			const currentRows = rowsContainer.querySelectorAll('.openfields-repeater-row');

			// Check max limit
			if (config.max > 0 && currentRows.length >= config.max) {
				this.showNotice(repeater, `Maximum ${config.max} rows allowed.`, 'warning');
				return;
			}

			// Get template
			const templateScript = repeater.querySelector('script[type="text/template"]');
			if (!templateScript) {
				console.error('[OpenFields] Row template not found');
				return;
			}

			// Get next index
			const nextIndex = this.getNextRowIndex(repeater);

			// Clone template and replace index placeholder
			let html = templateScript.innerHTML.replace(/__INDEX__/g, nextIndex);

			// Create temp container
			const temp = document.createElement('div');
			temp.innerHTML = html.trim();
			const newRow = temp.firstElementChild;

			if (!newRow) return;

			// Add to container
			rowsContainer.appendChild(newRow);

			// Initialize the new row (nested repeaters, etc.)
			this.initAllRepeaters(newRow);

			// Reindex and update state
			this.reindexRows(repeater);
			this.updateRepeaterState(repeater);

			// Focus first input in new row
			const firstInput = newRow.querySelector('input, textarea, select');
			if (firstInput) {
				firstInput.focus();
			}

			// Trigger change event
			this.triggerChange(repeater);

			// Scroll to new row
			newRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		},

		/**
		 * Remove a row from the repeater
		 * @param {HTMLElement} repeater
		 * @param {HTMLElement} row
		 */
		removeRow(repeater, row) {
			const config = repeater._config;
			const rowsContainer = repeater.querySelector('.openfields-repeater-rows');
			const currentRows = rowsContainer.querySelectorAll('.openfields-repeater-row');

			// Check min limit
			if (config.min > 0 && currentRows.length <= config.min) {
				this.showNotice(repeater, `Minimum ${config.min} rows required.`, 'warning');
				return;
			}

			// Confirm removal
			if (!confirm('Remove this row?')) {
				return;
			}

			// Animate out
			row.style.transition = 'opacity 0.2s, transform 0.2s';
			row.style.opacity = '0';
			row.style.transform = 'translateX(-10px)';

			setTimeout(() => {
				row.remove();
				this.reindexRows(repeater);
				this.updateRepeaterState(repeater);
				this.triggerChange(repeater);
			}, 200);
		},

		/**
		 * Reindex all rows and their field names
		 * @param {HTMLElement} repeater
		 */
		reindexRows(repeater) {
			const config = repeater._config;
			const rowsContainer = repeater.querySelector('.openfields-repeater-rows');
			const rows = rowsContainer.querySelectorAll(':scope > .openfields-repeater-row');

			rows.forEach((row, newIndex) => {
				const oldIndex = row.getAttribute('data-row-index');

				// Update row index
				row.setAttribute('data-row-index', newIndex);

				// Update row number display
				const rowNumber = row.querySelector('.openfields-repeater-row-number');
				if (rowNumber) {
					rowNumber.textContent = newIndex + 1;
				}

				// Update field names and IDs
				if (oldIndex !== null && oldIndex !== String(newIndex)) {
					this.updateFieldIndices(row, config.fieldName, oldIndex, newIndex);
				}
			});

			// Update count input
			const countInput = repeater.querySelector('.openfields-repeater-count');
			if (countInput) {
				countInput.value = rows.length;
			}
		},

		/**
		 * Update field name indices within a row
		 * @param {HTMLElement} row
		 * @param {string} fieldName - Parent repeater field name
		 * @param {string} oldIndex
		 * @param {number} newIndex
		 */
		updateFieldIndices(row, fieldName, oldIndex, newIndex) {
			const inputs = row.querySelectorAll('input, textarea, select');

			inputs.forEach((input) => {
				// Update name attribute
				if (input.name) {
					// Pattern: {parent}_{oldIndex}_{subfield} -> {parent}_{newIndex}_{subfield}
					const namePattern = new RegExp(`(${this.escapeRegex(fieldName)})_${oldIndex}_`);
					input.name = input.name.replace(namePattern, `$1_${newIndex}_`);
				}

				// Update ID attribute
				if (input.id) {
					const idPattern = new RegExp(`(${this.escapeRegex(fieldName)})_${oldIndex}_`);
					input.id = input.id.replace(idPattern, `$1_${newIndex}_`);
				}
			});

			// Update labels
			const labels = row.querySelectorAll('label[for]');
			labels.forEach((label) => {
				const idPattern = new RegExp(`(${this.escapeRegex(fieldName)})_${oldIndex}_`);
				label.setAttribute('for', label.getAttribute('for').replace(idPattern, `$1_${newIndex}_`));
			});
		},

		/**
		 * Get the next available row index
		 * @param {HTMLElement} repeater
		 * @returns {number}
		 */
		getNextRowIndex(repeater) {
			const rowsContainer = repeater.querySelector('.openfields-repeater-rows');
			const rows = rowsContainer.querySelectorAll('.openfields-repeater-row');

			if (rows.length === 0) return 0;

			// Find highest existing index
			let maxIndex = -1;
			rows.forEach((row) => {
				const idx = parseInt(row.getAttribute('data-row-index'), 10);
				if (!isNaN(idx) && idx > maxIndex) {
					maxIndex = idx;
				}
			});

			return maxIndex + 1;
		},

		/**
		 * Update repeater UI state (button disabled states, etc.)
		 * @param {HTMLElement} repeater
		 */
		updateRepeaterState(repeater) {
			const config = repeater._config;
			const rowsContainer = repeater.querySelector('.openfields-repeater-rows');
			const rows = rowsContainer.querySelectorAll('.openfields-repeater-row');
			const addBtn = repeater.querySelector('.openfields-repeater-add');

			// Update add button
			if (addBtn) {
				if (config.max > 0 && rows.length >= config.max) {
					addBtn.disabled = true;
					addBtn.title = `Maximum ${config.max} rows reached`;
				} else {
					addBtn.disabled = false;
					addBtn.title = '';
				}
			}

			// Update remove buttons
			const removeBtns = repeater.querySelectorAll('.openfields-repeater-row-remove');
			removeBtns.forEach((btn) => {
				if (config.min > 0 && rows.length <= config.min) {
					btn.disabled = true;
					btn.title = `Minimum ${config.min} rows required`;
				} else {
					btn.disabled = false;
					btn.title = 'Remove row';
				}
			});
		},

		/**
		 * Show a temporary notice
		 * @param {HTMLElement} repeater
		 * @param {string} message
		 * @param {string} type - 'info', 'warning', 'error'
		 */
		showNotice(repeater, message, type = 'info') {
			// Remove existing notice
			const existing = repeater.querySelector('.openfields-repeater-notice');
			if (existing) existing.remove();

			const notice = document.createElement('div');
			notice.className = `openfields-repeater-notice notice notice-${type}`;
			notice.innerHTML = `<p>${message}</p>`;

			repeater.insertBefore(notice, repeater.firstChild);

			setTimeout(() => {
				notice.style.transition = 'opacity 0.3s';
				notice.style.opacity = '0';
				setTimeout(() => notice.remove(), 300);
			}, 3000);
		},

		/**
		 * Trigger change event on repeater
		 * @param {HTMLElement} repeater
		 */
		triggerChange(repeater) {
			const event = new CustomEvent('openfields:repeater:change', {
				bubbles: true,
				detail: {
					fieldName: repeater._config?.fieldName,
					rowCount: repeater.querySelectorAll('.openfields-repeater-row').length,
				},
			});
			repeater.dispatchEvent(event);
		},

		/**
		 * Escape string for use in RegExp
		 * @param {string} str
		 * @returns {string}
		 */
		escapeRegex(str) {
			return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		},

		/**
		 * Bind global events
		 */
		bindGlobalEvents() {
			// Re-init when Gutenberg/block editor loads new content
			if (typeof wp !== 'undefined' && wp.data) {
				const unsubscribe = wp.data.subscribe(() => {
					this.initAllRepeaters();
				});
			}

			// Re-init on AJAX complete (for dynamic content)
			document.addEventListener('ajaxComplete', () => {
				this.initAllRepeaters();
			});
		},
	};

	// Initialize on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => RepeaterManager.init());
	} else {
		RepeaterManager.init();
	}

	// Export for external access
	window.OpenFieldsRepeater = RepeaterManager;
})();
