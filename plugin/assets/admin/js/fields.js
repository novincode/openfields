/**
 * OpenFields Admin JS
 *
 * Comprehensive field interactions including:
 * - Switch field toggle behavior with Yes/No labels
 * - Conditional logic visibility management
 * - Field validation and error handling
 * - File upload preview management
 * - Dynamic field interactions
 *
 * @package OpenFields
 * @since   1.0.0
 */

(function() {
	'use strict';

	/**
	 * OpenFields Fields Manager
	 *
	 * Main controller for all field interactions and logic.
	 */
	const FieldsManager = {
		/**
		 * Initialize the fields manager.
		 */
		init() {
			this.initSwitchFields();
			this.initConditionalLogic();
			this.initFileFields();
			this.bindEvents();

			console.log('[OpenFields] Fields manager initialized');
		},

		/**
		 * Initialize switch field interactions.
		 *
		 * Converts hidden checkboxes into beautiful toggle switches with Yes/No labels.
		 */
		initSwitchFields() {
			const switches = document.querySelectorAll('.openfields-switch-input');

			switches.forEach(switchInput => {
				// Store initial state for change detection.
				switchInput.dataset.previousState = switchInput.checked ? 'on' : 'off';

				// Add change listener for tracking.
				switchInput.addEventListener('change', (e) => {
					const newState = e.target.checked ? 'on' : 'off';
					e.target.dataset.previousState = newState;

					// Emit custom event for other components to listen to.
					const event = new CustomEvent('switchToggled', {
						detail: {
							fieldName: e.target.name,
							checked: e.target.checked,
							value: e.target.value,
						},
					});
					document.dispatchEvent(event);
				});

				// Handle keyboard interaction (Space to toggle).
				switchInput.addEventListener('keydown', (e) => {
					if (e.key === ' ' || e.code === 'Space') {
						e.preventDefault();
						switchInput.checked = !switchInput.checked;
						switchInput.dispatchEvent(new Event('change', { bubbles: true }));
					}
				});

				// Make the track clickable (but don't double-toggle since label.for handles it).
				const track = switchInput.nextElementSibling;
				if (track && track.classList.contains('openfields-switch-track')) {
					track.addEventListener('click', () => {
						// Just focus the input, the label.for attribute handles the toggle
						switchInput.focus();
					});
				}
			});

			console.log(`[OpenFields] Initialized ${switches.length} switch fields`);
		},

		/**
		 * Initialize conditional logic for field visibility.
		 *
		 * Shows/hides fields based on conditional logic rules.
		 */
		initConditionalLogic() {
			const fieldsWithConditions = document.querySelectorAll('[data-conditional-logic]');

			if (fieldsWithConditions.length === 0) {
				return;
			}

			// Setup listeners on all input fields for change detection.
			this.setupConditionalListeners();

			// Initial evaluation of conditional logic.
			this.evaluateAllConditions();

			console.log(`[OpenFields] Initialized ${fieldsWithConditions.length} conditional fields`);
		},

		/**
		 * Setup event listeners for conditional logic evaluation.
		 */
		setupConditionalListeners() {
			const formInputs = document.querySelectorAll(
				'.openfields-meta-box input, .openfields-meta-box select, .openfields-meta-box textarea'
			);

			formInputs.forEach(input => {
				input.addEventListener('change', () => this.evaluateAllConditions());
				input.addEventListener('input', () => this.evaluateAllConditions());
			});
		},

		/**
		 * Evaluate all conditional logic rules.
		 */
		evaluateAllConditions() {
			const fieldsWithConditions = document.querySelectorAll('[data-conditional-logic]');

			fieldsWithConditions.forEach(field => {
				const conditionsJson = field.dataset.conditionalLogic;
				if (!conditionsJson) return;

				try {
					const conditions = JSON.parse(conditionsJson);
					const shouldShow = this.evaluateCondition(conditions);

					// Update visibility with smooth transition.
					if (shouldShow) {
						field.dataset.conditionalStatus = 'visible';
						field.style.opacity = '1';
						field.style.visibility = 'visible';
						field.style.pointerEvents = 'auto';
						field.style.height = 'auto';
					} else {
						field.dataset.conditionalStatus = 'hidden';
						field.style.opacity = '0';
						field.style.visibility = 'hidden';
						field.style.pointerEvents = 'none';
						field.style.height = '0';
						field.style.margin = '0';
						field.style.padding = '0';
						field.style.overflow = 'hidden';
					}
				} catch (e) {
					console.warn('[OpenFields] Failed to parse conditional logic:', e);
				}
			});
		},

		/**
		 * Evaluate a single condition rule.
		 *
		 * @param {Object|Array} condition - The condition or conditions to evaluate.
		 * @returns {boolean} Whether the condition is met.
		 */
		evaluateCondition(condition) {
			if (!condition) return true;

			// Handle OR conditions (any must be true).
			if (Array.isArray(condition) && condition[0]?.type === 'or') {
				return condition.some(cond => this.evaluateCondition(cond));
			}

			// Handle AND conditions (all must be true).
			if (Array.isArray(condition) && condition[0]?.type === 'and') {
				return condition.every(cond => this.evaluateCondition(cond));
			}

			// Single condition evaluation.
			if (condition.field && condition.operator && condition.value !== undefined) {
				const fieldElement = document.querySelector(
					`[name*="${condition.field}"], [data-field="${condition.field}"]`
				);

				if (!fieldElement) return false;

				const currentValue = this.getFieldValue(fieldElement);
				return this.compareValues(currentValue, condition.operator, condition.value);
			}

			return true;
		},

		/**
		 * Get the current value of a field element.
		 *
		 * @param {HTMLElement} element - The field element.
		 * @returns {*} The field value.
		 */
		getFieldValue(element) {
			if (element.type === 'checkbox' || element.type === 'radio') {
				return element.checked ? element.value : null;
			}
			if (element.tagName === 'SELECT') {
				return element.value;
			}
			return element.value || '';
		},

		/**
		 * Compare two values based on an operator.
		 *
		 * @param {*} value1 - The first value.
		 * @param {string} operator - The comparison operator.
		 * @param {*} value2 - The second value.
		 * @returns {boolean} Result of the comparison.
		 */
		compareValues(value1, operator, value2) {
			switch (operator) {
				case '==':
				case 'equals':
					return String(value1) === String(value2);
				case '!=':
				case 'not_equals':
					return String(value1) !== String(value2);
				case 'contains':
					return String(value1).includes(String(value2));
				case 'not_contains':
					return !String(value1).includes(String(value2));
				case '>':
				case 'greater_than':
					return parseFloat(value1) > parseFloat(value2);
				case '<':
				case 'less_than':
					return parseFloat(value1) < parseFloat(value2);
				case '>=':
				case 'greater_than_or_equal':
					return parseFloat(value1) >= parseFloat(value2);
				case '<=':
				case 'less_than_or_equal':
					return parseFloat(value1) <= parseFloat(value2);
				case 'is_empty':
					return !value1 || value1 === '';
				case 'is_not_empty':
					return value1 && value1 !== '';
				default:
					return false;
			}
		},

		/**
		 * Initialize file field interactions.
		 *
		 * Handles file selection, preview generation, and management.
		 */
		initFileFields() {
			const fileInputs = document.querySelectorAll('.openfields-file-upload input[type="file"]');

			fileInputs.forEach(input => {
				input.addEventListener('change', (e) => this.handleFileSelect(e));
			});

			console.log(`[OpenFields] Initialized ${fileInputs.length} file fields`);
		},

		/**
		 * Handle file selection in file fields.
		 *
		 * @param {Event} event - The change event.
		 */
		handleFileSelect(event) {
			const input = event.target;
			const container = input.closest('.openfields-file-field') || input.closest('.openfields-image-field');

			if (!container) return;

			const files = input.files;
			if (files.length === 0) return;

			const file = files[0];

			// Validate file size (max 5MB).
			const maxSize = 5 * 1024 * 1024;
			if (file.size > maxSize) {
				this.showError(container, 'File size exceeds 5MB limit');
				input.value = '';
				return;
			}

			// Handle image preview if it's an image field.
			if (container.classList.contains('openfields-image-field')) {
				this.generateImagePreview(container, file);
			}

			// Update file name display.
			const fileName = container.querySelector('.openfields-file-name');
			if (fileName) {
				fileName.textContent = file.name;
			}

			// Emit file selected event.
			const fileEvent = new CustomEvent('fileSelected', {
				detail: {
					file: file,
					fieldName: input.name,
				},
			});
			document.dispatchEvent(fileEvent);
		},

		/**
		 * Generate and display image preview.
		 *
		 * @param {HTMLElement} container - The field container.
		 * @param {File} file - The selected file.
		 */
		generateImagePreview(container, file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const preview = container.querySelector('.openfields-image-preview');
				if (preview) {
					let img = preview.querySelector('img');
					if (!img) {
						img = document.createElement('img');
						preview.innerHTML = '';
						preview.appendChild(img);
					}
					img.src = e.target.result;
				}
			};
			reader.readAsDataURL(file);
		},

		/**
		 * Bind global event handlers.
		 */
		bindEvents() {
			// Listen for custom switch toggle events if needed elsewhere.
			document.addEventListener('switchToggled', (e) => {
				console.log('[OpenFields] Switch toggled:', e.detail);
			});

			// Listen for file selected events if needed elsewhere.
			document.addEventListener('fileSelected', (e) => {
				console.log('[OpenFields] File selected:', e.detail);
			});
		},

		/**
		 * Show error message on a field.
		 *
		 * @param {HTMLElement} container - The field container.
		 * @param {string} message - The error message.
		 */
		showError(container, message) {
			// Remove existing error.
			const existingError = container.querySelector('.openfields-field-error-message');
			if (existingError) {
				existingError.remove();
			}

			// Add error class and message.
			container.classList.add('is-error');

			const errorEl = document.createElement('div');
			errorEl.className = 'openfields-field-error-message';
			errorEl.textContent = message;
			container.appendChild(errorEl);

			// Remove error after 5 seconds if no user interaction.
			setTimeout(() => {
				if (container.querySelector('.openfields-field-error-message')) {
					container.classList.remove('is-error');
					errorEl.remove();
				}
			}, 5000);
		},

		/**
		 * Validate all required fields in the meta box.
		 *
		 * @returns {boolean} Whether all validations passed.
		 */
		validateForm() {
			const requiredFields = document.querySelectorAll('.openfields-field-required');
			let isValid = true;

			requiredFields.forEach(label => {
				const fieldName = label.parentElement.querySelector('label')?.getAttribute('for');
				if (!fieldName) return;

				const field = document.querySelector(`#${fieldName}`);
				if (!field) return;

				const value = this.getFieldValue(field);
				if (!value || value === '') {
					this.showError(field.closest('.openfields-field-wrapper'), 'This field is required');
					isValid = false;
				}
			});

			return isValid;
		},

		/**
		 * Get all field values from the form.
		 *
		 * @returns {Object} Object containing all field values.
		 */
		getFormValues() {
			const values = {};
			const inputs = document.querySelectorAll(
				'.openfields-meta-box input, .openfields-meta-box select, .openfields-meta-box textarea'
			);

			inputs.forEach(input => {
				if (input.name) {
					if (input.type === 'checkbox' || input.type === 'radio') {
						if (input.checked) {
							values[input.name] = input.value;
						}
					} else {
						values[input.name] = this.getFieldValue(input);
					}
				}
			});

			return values;
		},
	};

	/**
	 * Initialize when DOM is ready.
	 */
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => FieldsManager.init());
	} else {
		FieldsManager.init();
	}

	/**
	 * Export for testing or external use.
	 */
	window.OpenFieldsManager = FieldsManager;
})();
