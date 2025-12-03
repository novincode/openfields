/**
 * OpenFields Admin JS
 *
 * Comprehensive field interactions including:
 * - Switch field toggle behavior with Yes/No labels
 * - Conditional logic visibility management
 * - Field validation and error handling
 * - File upload preview management
 * - Dynamic field interactions
 * - Headless validation system (reusable everywhere)
 *
 * @package OpenFields
 * @since   1.0.0
 */

(function() {
	'use strict';

	/**
	 * OpenFields Validator
	 *
	 * Headless, scalable validation system that works with:
	 * - Classic Editor meta boxes
	 * - Gutenberg sidebar panels
	 * - Taxonomy term forms
	 * - User profile fields
	 * - Frontend forms
	 *
	 * Uses native HTML5 validation API + custom validators.
	 */
	const Validator = {
		/**
		 * Validation rules registry.
		 */
		rules: {
			email: {
				pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
				message: 'Please enter a valid email address',
			},
			url: {
				pattern: /^https?:\/\/.+/,
				message: 'Please enter a valid URL starting with http:// or https://',
			},
			number: {
				validate: (value, settings) => {
					if (value === '') return true; // Empty is handled by required
					const num = parseFloat(value);
					if (isNaN(num)) return false;
					if (settings?.min !== undefined && num < settings.min) return false;
					if (settings?.max !== undefined && num > settings.max) return false;
					return true;
				},
				message: 'Please enter a valid number',
			},
			required: {
				validate: (value) => value !== null && value !== undefined && String(value).trim() !== '',
				message: 'This field is required',
			},
			minLength: {
				validate: (value, settings) => !value || String(value).length >= (settings?.minLength || 0),
				message: 'Value is too short',
			},
			maxLength: {
				validate: (value, settings) => !value || String(value).length <= (settings?.maxLength || Infinity),
				message: 'Value is too long',
			},
			phone: {
				pattern: /^[\d\s\-+()]{7,20}$/,
				message: 'Please enter a valid phone number',
			},
		},

		/**
		 * Register a custom validation rule.
		 *
		 * @param {string} name - Rule name.
		 * @param {Object} rule - Rule object with pattern/validate and message.
		 */
		registerRule(name, rule) {
			this.rules[name] = rule;
		},

		/**
		 * Validate a single value against a rule.
		 *
		 * @param {*} value - The value to validate.
		 * @param {string} ruleName - The rule to use.
		 * @param {Object} settings - Optional settings for the rule.
		 * @returns {Object} { valid: boolean, message: string }
		 */
		validate(value, ruleName, settings = {}) {
			const rule = this.rules[ruleName];
			if (!rule) {
				console.warn(`[OpenFields] Unknown validation rule: ${ruleName}`);
				return { valid: true, message: '' };
			}

			let isValid = true;

			if (rule.pattern) {
				isValid = rule.pattern.test(String(value || ''));
			} else if (rule.validate) {
				isValid = rule.validate(value, settings);
			}

			return {
				valid: isValid,
				message: isValid ? '' : rule.message,
			};
		},

		/**
		 * Validate a form element based on data-validate attribute.
		 *
		 * @param {HTMLElement} element - The input element.
		 * @returns {Object} { valid: boolean, errors: string[] }
		 */
		validateElement(element) {
			const errors = [];
			const value = element.value;
			const validationType = element.dataset.validate;

			// Check required first
			if (element.hasAttribute('required') || element.dataset.required === 'true') {
				const result = this.validate(value, 'required');
				if (!result.valid) {
					errors.push(result.message);
					return { valid: false, errors };
				}
			}

			// If empty and not required, skip other validations
			if (!value || value.trim() === '') {
				return { valid: true, errors: [] };
			}

			// Validate based on type
			if (validationType) {
				const types = validationType.split(',').map(t => t.trim());
				for (const type of types) {
					const settings = this.getElementSettings(element);
					const result = this.validate(value, type, settings);
					if (!result.valid) {
						errors.push(result.message);
					}
				}
			}

			// Use native HTML5 validation as fallback
			if (element.validity && !element.validity.valid) {
				if (element.validationMessage && !errors.includes(element.validationMessage)) {
					errors.push(element.validationMessage);
				}
			}

			return {
				valid: errors.length === 0,
				errors,
			};
		},

		/**
		 * Extract settings from element attributes.
		 *
		 * @param {HTMLElement} element - The input element.
		 * @returns {Object} Settings object.
		 */
		getElementSettings(element) {
			return {
				min: element.hasAttribute('min') ? parseFloat(element.min) : undefined,
				max: element.hasAttribute('max') ? parseFloat(element.max) : undefined,
				minLength: element.hasAttribute('minlength') ? parseInt(element.minLength, 10) : undefined,
				maxLength: element.hasAttribute('maxlength') ? parseInt(element.maxLength, 10) : undefined,
			};
		},

		/**
		 * Apply validation state to an element (add/remove classes).
		 *
		 * @param {HTMLElement} element - The input element.
		 * @param {Object} result - Validation result { valid, errors }.
		 */
		applyValidationState(element, result) {
			const wrapper = element.closest('.openfields-field-wrapper') ||
			                element.closest('.openfields-repeater-subfield') ||
			                element.parentElement;

			// Remove existing states
			element.classList.remove('is-valid', 'is-invalid');

			// Remove existing messages
			const existingMsg = wrapper?.querySelector('.openfields-validation-message');
			if (existingMsg) {
				existingMsg.remove();
			}

			if (result.valid) {
				if (element.value && element.value.trim() !== '') {
					element.classList.add('is-valid');
				}
			} else {
				element.classList.add('is-invalid');

				// Add error message
				if (wrapper && result.errors.length > 0) {
					const msgEl = document.createElement('div');
					msgEl.className = 'openfields-validation-message is-error';
					msgEl.textContent = result.errors[0];
					
					const inputContainer = element.closest('.openfields-field-input') ||
					                        element.closest('.openfields-repeater-subfield-input') ||
					                        element.parentElement;
					if (inputContainer) {
						inputContainer.appendChild(msgEl);
					}
				}
			}

			return result.valid;
		},

		/**
		 * Validate all fields in a container and prevent form submission if invalid.
		 *
		 * @param {HTMLElement} container - The container to validate.
		 * @returns {boolean} Whether all fields are valid.
		 */
		validateContainer(container) {
			const inputs = container.querySelectorAll('[data-validate], [required]');
			let allValid = true;

			inputs.forEach(input => {
				const result = this.validateElement(input);
				if (!result.valid) {
					allValid = false;
					this.applyValidationState(input, result);
				}
			});

			return allValid;
		},

		/**
		 * Setup live validation on inputs.
		 *
		 * @param {HTMLElement} container - Container to setup validation in.
		 */
		setupLiveValidation(container) {
			const inputs = container.querySelectorAll('[data-validate], input[type="email"], input[type="url"], input[type="number"]');

			inputs.forEach(input => {
				// Validate on blur (when leaving field)
				input.addEventListener('blur', () => {
					const result = this.validateElement(input);
					this.applyValidationState(input, result);
				});

				// Clear invalid state on input
				input.addEventListener('input', () => {
					if (input.classList.contains('is-invalid')) {
						input.classList.remove('is-invalid');
						const wrapper = input.closest('.openfields-field-wrapper') ||
						                input.closest('.openfields-repeater-subfield') ||
						                input.parentElement;
						const msg = wrapper?.querySelector('.openfields-validation-message');
						if (msg) msg.remove();
					}
				});
			});
		},
	};

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
			this.initValidation();
			this.bindEvents();

			console.log('[OpenFields] Fields manager initialized');
		},

		/**
		 * Initialize validation on all meta boxes.
		 */
		initValidation() {
			const metaBoxes = document.querySelectorAll('.openfields-meta-box');
			
			metaBoxes.forEach(box => {
				Validator.setupLiveValidation(box);
			});

			// Also setup on any repeater containers
			const repeaters = document.querySelectorAll('.openfields-repeater');
			repeaters.forEach(repeater => {
				Validator.setupLiveValidation(repeater);
			});

			// Intercept form submission to validate
			this.setupFormSubmitValidation();

			console.log('[OpenFields] Validation system initialized');
		},

		/**
		 * Setup form submission validation.
		 */
		setupFormSubmitValidation() {
			const form = document.getElementById('post') || document.querySelector('form.edit-form');
			if (!form) return;

			form.addEventListener('submit', (e) => {
				const metaBoxes = form.querySelectorAll('.openfields-meta-box');
				let isValid = true;

				metaBoxes.forEach(box => {
					if (!Validator.validateContainer(box)) {
						isValid = false;
					}
				});

				if (!isValid) {
					e.preventDefault();
					
					// Scroll to first error
					const firstError = form.querySelector('.is-invalid');
					if (firstError) {
						firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
						firstError.focus();
					}

					// Show notice
					this.showNotice('Please fix the validation errors before saving.', 'error');
				}
			});
		},

		/**
		 * Show a WordPress-style admin notice.
		 *
		 * @param {string} message - The message to show.
		 * @param {string} type - Notice type: 'error', 'warning', 'success', 'info'.
		 */
		showNotice(message, type = 'info') {
			// Remove existing OpenFields notices
			const existing = document.querySelectorAll('.openfields-notice');
			existing.forEach(n => n.remove());

			const notice = document.createElement('div');
			notice.className = `notice notice-${type} is-dismissible openfields-notice`;
			notice.innerHTML = `<p>${message}</p><button type="button" class="notice-dismiss"><span class="screen-reader-text">Dismiss</span></button>`;

			const heading = document.querySelector('.wrap > h1, .wrap > h2');
			if (heading) {
				heading.after(notice);
			} else {
				document.querySelector('.wrap')?.prepend(notice);
			}

			// Add dismiss handler
			notice.querySelector('.notice-dismiss')?.addEventListener('click', () => {
				notice.remove();
			});

			// Auto-dismiss after 5 seconds
			setTimeout(() => {
				if (notice.parentElement) {
					notice.style.opacity = '0';
					setTimeout(() => notice.remove(), 300);
				}
			}, 5000);
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
	window.OpenFieldsValidator = Validator;
})();
