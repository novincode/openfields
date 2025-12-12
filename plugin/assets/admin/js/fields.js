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
				// Skip if already initialized to prevent duplicate event listeners.
				if (input.dataset.ofValidationInitialized) {
					return;
				}
				input.dataset.ofValidationInitialized = 'true';

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
			this.initMediaFields();
			this.bindEvents();

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

		},

		/**
		 * Setup form submission validation.
		 */
		setupFormSubmitValidation() {
			const form = document.getElementById('post') || document.querySelector('form.edit-form');
			if (!form) return;

			// Prevent duplicate submit handlers
			if (form.dataset.ofSubmitValidationInit) return;
			form.dataset.ofSubmitValidationInit = 'true';

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
				// Skip if already initialized to prevent duplicate event listeners.
				if (switchInput.dataset.ofInitialized) {
					return;
				}
				switchInput.dataset.ofInitialized = 'true';

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
		},

		/**
		 * Setup event listeners for conditional logic evaluation.
		 */
		setupConditionalListeners() {
			// Use event delegation on meta-box wrapper so new repeater rows trigger updates too
			const metaBox = document.querySelector('.openfields-meta-box');
			if (!metaBox) return;

			// Single listener on parent element catches all bubbling change/input events
			metaBox.addEventListener('change', (e) => {
				// Check if this is a field input that should trigger conditional evaluation
				const target = e.target;
				if (this.isFieldInput(target)) {
					this.evaluateAllConditions();
				}
			}, true); // Use capture phase to catch all events

			metaBox.addEventListener('input', (e) => {
				const target = e.target;
				if (this.isFieldInput(target)) {
					this.evaluateAllConditions();
				}
			}, true); // Use capture phase
		},

		/**
		 * Check if an element is a field input that should trigger conditional evaluation.
		 *
		 * @param {HTMLElement} element - The element to check.
		 * @returns {boolean} Whether this is a field input.
		 */
		isFieldInput(element) {
			// Check if it's an input, select, or textarea
			if (!element || !element.tagName) return false;
			
			const tag = element.tagName.toLowerCase();
			if (['input', 'select', 'textarea'].includes(tag)) {
				return true;
			}

			// Check if it's a switch or custom field input
			if (element.classList && (
				element.classList.contains('openfields-switch-checkbox') ||
				element.classList.contains('openfields-toggle-input') ||
				element.classList.contains('openfields-field-input')
			)) {
				return true;
			}

			return false;
		},

		/**
		 * Evaluate all conditional logic rules in the document.
		 * Scopes repeater subfields to their parent row for proper field lookup.
		 */
		evaluateAllConditions() {
			const fieldsWithConditions = document.querySelectorAll('[data-conditional-logic]');
			
			console.debug(`[OpenFields] Found ${fieldsWithConditions.length} fields with conditional logic`);

		fieldsWithConditions.forEach(field => {
			const conditionsJson = field.dataset.conditionalLogic;
			if (!conditionsJson) return;

			const fieldId = field.getAttribute('data-field-id');
			console.debug(`[OpenFields] Evaluating conditions for field ${fieldId}. Raw JSON: ${conditionsJson}`);

			try {
				// Decode HTML entities if present (from PHP esc_attr)
				let decodedJson = conditionsJson;
				if (decodedJson.includes('&quot;')) {
					const textarea = document.createElement('textarea');
					textarea.innerHTML = decodedJson;
					decodedJson = textarea.value;
					console.debug(`[OpenFields] Decoded JSON for field ${fieldId}: ${decodedJson}`);
				}
				
				const conditions = JSON.parse(decodedJson);					// Determine scope: if this field is in a repeater row, scope to that row
					// Otherwise, null scope means global field lookup
					let scopeElement = null;
					const repeaterRow = field.closest('.openfields-repeater-row');
					if (repeaterRow) {
						// Field is inside a repeater row - scope to this row
						scopeElement = repeaterRow;
						console.debug(`[OpenFields] Field ${fieldId} is in repeater row, scoping to row`);
					}
					
					const shouldShow = this.evaluateCondition(conditions, scopeElement);

					// Update visibility with smooth transition.
					if (shouldShow) {
						field.dataset.conditionalStatus = 'visible';
						field.style.display = '';
						field.style.opacity = '1';
						field.style.visibility = 'visible';
						field.style.pointerEvents = 'auto';
						field.style.height = '';
						field.style.margin = '';
						field.style.padding = '';
						field.style.overflow = '';
					} else {
						field.dataset.conditionalStatus = 'hidden';
						field.style.display = 'none';
						field.style.opacity = '0';
						field.style.visibility = 'hidden';
						field.style.pointerEvents = 'none';
					}
				} catch (e) {
					console.warn('[OpenFields] Failed to parse conditional logic:', e);
				}
			});
		},

		/**
		 * Evaluate conditional logic rules.
		 *
		 * Structure is: [[{field, operator, value}, ...], ...] 
		 * - Outer array: OR groups (any group must pass)
		 * - Inner array: AND rules (all rules in group must pass)
		 *
		 * @param {Array} conditions - The conditions to evaluate.
		 * @param {HTMLElement} scopeElement - Optional element to scope field lookup within (for repeater rows).
		 * @returns {boolean} Whether the conditions are met.
		 */
		evaluateCondition(conditions, scopeElement = null) {
			if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
				return true;
			}

			// Check if this is a flat array of rules (single AND group).
			// [[{field, op, val}]] vs [{field, op, val}]
			const firstItem = conditions[0];
			
			// If first item is an object with 'field', it's a flat array of AND rules.
			if (firstItem && typeof firstItem === 'object' && 'field' in firstItem) {
				return this.evaluateRuleGroup(conditions, scopeElement);
			}

			// Otherwise, it's OR groups: [[rules], [rules], ...]
			// ANY group must pass (OR logic between groups).
			return conditions.some(group => {
				if (!Array.isArray(group)) return true;
				// ALL rules in group must pass (AND logic within group).
				return this.evaluateRuleGroup(group, scopeElement);
			});
		},

		/**
		 * Evaluate a group of AND rules.
		 *
		 * @param {Array} rules - Array of rule objects.
		 * @returns {boolean} Whether all rules pass.
		 */
		evaluateRuleGroup(rules, scopeElement = null) {
			if (!rules || rules.length === 0) return true;

			return rules.every(rule => {
				if (!rule || !rule.field) return true;

				// rule.field is now a FIELD ID (immutable UUID/identifier)
				const fieldId = rule.field;
				let fieldElement = null;

				// If we have a scope element (e.g., repeater row), search within it first
				if (scopeElement) {
					fieldElement = scopeElement.querySelector(`[data-field-id="${fieldId}"]`);
					
					// Debug logging for repeater fields
					if (!fieldElement) {
						console.debug(`[OpenFields] Field ${fieldId} not found in scope (repeater row), searching globally`);
					}
				}

			// If not found in scope, search globally (for root fields)
			if (!fieldElement) {
				fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
			}			if (fieldElement) {
				// Found by field ID - this is the preferred method
				// Look for the actual input element within this wrapper
				// For repeater subfields, the wrapper is .openfields-repeater-subfield
				// and the input is inside .openfields-repeater-subfield-input
				const inputContainer = fieldElement.querySelector('.openfields-repeater-subfield-input');
				if (inputContainer) {
					// Look for input in the subfield container (prioritize visible inputs)
					const input = inputContainer.querySelector('input:not([type="hidden"]), select, textarea');
					if (input) {
						fieldElement = input;
					}
				} else {
					// Fallback for non-repeater fields - look in field-input wrapper
					const fieldInputWrapper = fieldElement.querySelector('.openfields-field-input');
					if (fieldInputWrapper) {
						const input = fieldInputWrapper.querySelector('input, select, textarea');
						if (input) {
							fieldElement = input;
						}
					} else {
						// Last fallback - direct child input
						const input = fieldElement.querySelector('input, select, textarea');
						if (input) {
							fieldElement = input;
						}
					}
				}
			}
			
			// Fallback: try to find by field name (backwards compatibility)
			// This is for fields created before data-field-id was implemented
			if (!fieldElement) {
				const fieldName = rule.field;
				const selector = 
					`[name="${fieldName}"], [name="${fieldName}[]"], ` +
					`[name="openfields_${fieldName}"], [name="openfields_${fieldName}[]"], ` +
					`[data-field="${fieldName}"], [id="${fieldName}"]`;
				
				if (scopeElement) {
					fieldElement = scopeElement.querySelector(selector);
				}
				if (!fieldElement) {
					fieldElement = document.querySelector(selector);
				}
			}
			
			if (!fieldElement) {
				console.warn(`[OpenFields] Conditional field not found: ${fieldId}`);
				return true; // If field not found, don't block (assume condition passes).
			}

			const currentValue = this.getFieldValue(fieldElement);
			const result = this.compareValues(currentValue, rule.operator, rule.value);
			
			// Debug logging for conditional logic
			console.debug(`[OpenFields] Condition check: field=${fieldId}, value="${currentValue}", operator=${rule.operator}, expected="${rule.value}", result=${result}`);
			
			return result;
		});
	},		/**
		 * Get the current value of a field element.
		 *
		 * @param {HTMLElement} element - The field element.
		 * @returns {*} The field value.
		 */
		getFieldValue(element) {
			// Handle checkboxes - return '1' if checked, '0' if not (boolean-like values)
			if (element.type === 'checkbox') {
				return element.checked ? '1' : '0';
			}
			// Handle radio buttons
			if (element.type === 'radio') {
				// Find the checked radio in the same group
				const checkedRadio = document.querySelector(`[name="${element.name}"]:checked`);
				return checkedRadio ? checkedRadio.value : '';
			}
			// Handle switch fields (they use hidden checkbox)
			if (element.classList.contains('openfields-switch-checkbox') || element.classList.contains('openfields-switch-input')) {
				return element.checked ? '1' : '0';
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
			// For boolean checks (switch/checkbox fields return '1' or '0')
			if (operator === 'empty' || operator === 'is_empty') {
				// A field is "empty" if value is '' or '0' (unchecked)
				return value1 === '' || value1 === '0';
			}
			
			if (operator === 'not_empty' || operator === 'is_not_empty') {
				// A field is "not empty" if value is not '' and not '0'
				return value1 !== '' && value1 !== '0';
			}
			
			// For other operators, normalize values
			const val1 = value1 === null || value1 === undefined ? '' : String(value1).trim();
			const val2 = value2 === null || value2 === undefined ? '' : String(value2).trim();
			
			switch (operator) {
				case '==':
				case 'equals':
					return val1 === val2;
				case '!=':
				case 'not_equals':
					return val1 !== val2;
				case 'contains':
					return val1.includes(val2);
				case 'not_contains':
					return !val1.includes(val2);
				case '>':
				case 'greater_than':
					return parseFloat(val1) > parseFloat(val2);
				case '<':
				case 'less_than':
					return parseFloat(val1) < parseFloat(val2);
				case '>=':
				case 'greater_than_or_equal':
					return parseFloat(val1) >= parseFloat(val2);
				case '<=':
				case 'less_than_or_equal':
					return parseFloat(val1) <= parseFloat(val2);
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
				// Skip if already initialized to prevent duplicate event listeners.
				if (input.dataset.ofInitialized) {
					return;
				}
				input.dataset.ofInitialized = 'true';

				input.addEventListener('change', (e) => this.handleFileSelect(e));
			});

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
		 * Initialize media library fields (image, file, gallery).
		 */
		initMediaFields() {
			this.initImageFields();
			this.initFileMediaFields();
			this.initGalleryFields();
			
		},

		/**
		 * Initialize image field media library interactions.
		 */
		initImageFields() {
			const imageFields = document.querySelectorAll('.openfields-image-field');
			
			imageFields.forEach(field => {
				// Skip if already initialized to prevent duplicate event listeners.
				if (field.dataset.ofInitialized) {
					return;
				}
				field.dataset.ofInitialized = 'true';

				const selectBtn = field.querySelector('.openfields-image-select');
				const changeBtn = field.querySelector('.openfields-image-change');
				const removeBtn = field.querySelector('.openfields-image-remove');
				
				if (selectBtn) {
					selectBtn.addEventListener('click', () => this.openImageMediaLibrary(field));
				}
				if (changeBtn) {
					changeBtn.addEventListener('click', () => this.openImageMediaLibrary(field));
				}
				if (removeBtn) {
					removeBtn.addEventListener('click', () => this.removeImage(field));
				}
			});
		},

		/**
		 * Open WordPress media library for image selection.
		 *
		 * @param {HTMLElement} field - The image field container.
		 */
		openImageMediaLibrary(field) {
			if (!wp || !wp.media) {
				console.error('[OpenFields] WordPress media library not available');
				return;
			}

			const frame = wp.media({
				title: 'Select Image',
				button: { text: 'Use this image' },
				library: { type: 'image' },
				multiple: false,
			});

			frame.on('select', () => {
				const attachment = frame.state().get('selection').first().toJSON();
				this.setImageValue(field, attachment);
			});

			frame.open();
		},

		/**
		 * Set image field value after selection.
		 *
		 * @param {HTMLElement} field - The image field container.
		 * @param {Object} attachment - WordPress attachment object.
		 */
		setImageValue(field, attachment) {
			const input = field.querySelector('.openfields-image-value');
			const preview = field.querySelector('.openfields-image-preview');
			const selectBtn = field.querySelector('.openfields-image-select');
			const changeBtn = field.querySelector('.openfields-image-change');
			const removeBtn = field.querySelector('.openfields-image-remove');

			// Update hidden input.
			if (input) input.value = attachment.id;

			// Update preview.
			const size = attachment.sizes?.medium || attachment.sizes?.thumbnail || { url: attachment.url };
			
			preview.innerHTML = `
				<img src="${size.url}" alt="${attachment.alt || ''}" class="openfields-image-thumb" />
				<div class="openfields-image-info">
					<span class="openfields-image-name">${attachment.title || attachment.filename}</span>
				</div>
			`;
			preview.classList.remove('no-image');
			preview.classList.add('has-image');

			// Toggle buttons.
			if (selectBtn) selectBtn.classList.add('hidden');
			if (changeBtn) changeBtn.classList.remove('hidden');
			if (removeBtn) removeBtn.classList.remove('hidden');
		},

		/**
		 * Remove image from field.
		 *
		 * @param {HTMLElement} field - The image field container.
		 */
		removeImage(field) {
			const input = field.querySelector('.openfields-image-value');
			const preview = field.querySelector('.openfields-image-preview');
			const selectBtn = field.querySelector('.openfields-image-select');
			const changeBtn = field.querySelector('.openfields-image-change');
			const removeBtn = field.querySelector('.openfields-image-remove');

			// Clear hidden input.
			if (input) input.value = '';

			// Reset preview.
			preview.innerHTML = `
				<div class="openfields-image-placeholder">
					<span class="dashicons dashicons-format-image"></span>
					<span class="openfields-image-placeholder-text">No image selected</span>
				</div>
			`;
			preview.classList.remove('has-image');
			preview.classList.add('no-image');

			// Toggle buttons.
			if (selectBtn) selectBtn.classList.remove('hidden');
			if (changeBtn) changeBtn.classList.add('hidden');
			if (removeBtn) removeBtn.classList.add('hidden');
		},

		/**
		 * Initialize file field media library interactions.
		 */
		initFileMediaFields() {
			const fileFields = document.querySelectorAll('.openfields-file-field');
			
			fileFields.forEach(field => {
				// Skip if already initialized to prevent duplicate event listeners.
				if (field.dataset.ofInitialized) {
					return;
				}
				field.dataset.ofInitialized = 'true';

				const selectBtn = field.querySelector('.openfields-file-select');
				const changeBtn = field.querySelector('.openfields-file-change');
				const removeBtn = field.querySelector('.openfields-file-remove');
				
				if (selectBtn) {
					selectBtn.addEventListener('click', () => this.openFileMediaLibrary(field));
				}
				if (changeBtn) {
					changeBtn.addEventListener('click', () => this.openFileMediaLibrary(field));
				}
				if (removeBtn) {
					removeBtn.addEventListener('click', () => this.removeFile(field));
				}
			});
		},

		/**
		 * Open WordPress media library for file selection.
		 *
		 * @param {HTMLElement} field - The file field container.
		 */
		openFileMediaLibrary(field) {
			if (!wp || !wp.media) {
				console.error('[OpenFields] WordPress media library not available');
				return;
			}

			const mimeTypes = field.dataset.mimeTypes;
			const libraryConfig = { type: null }; // All types by default
			
			if (mimeTypes) {
				libraryConfig.type = mimeTypes.split(',').map(t => t.trim());
			}

			const frame = wp.media({
				title: 'Select File',
				button: { text: 'Use this file' },
				library: libraryConfig,
				multiple: false,
			});

			frame.on('select', () => {
				const attachment = frame.state().get('selection').first().toJSON();
				this.setFileValue(field, attachment);
			});

			frame.open();
		},

		/**
		 * Set file field value after selection.
		 *
		 * @param {HTMLElement} field - The file field container.
		 * @param {Object} attachment - WordPress attachment object.
		 */
		setFileValue(field, attachment) {
			const input = field.querySelector('.openfields-file-value');
			const info = field.querySelector('.openfields-file-info');
			const selectBtn = field.querySelector('.openfields-file-select');
			const changeBtn = field.querySelector('.openfields-file-change');
			const removeBtn = field.querySelector('.openfields-file-remove');

			// Update hidden input.
			if (input) input.value = attachment.id;

			// Determine file icon.
			let iconClass = 'dashicons-media-default';
			const mime = attachment.mime || '';
			if (mime.startsWith('image/')) iconClass = 'dashicons-format-image';
			else if (mime.startsWith('video/')) iconClass = 'dashicons-video-alt3';
			else if (mime.startsWith('audio/')) iconClass = 'dashicons-format-audio';
			else if (mime === 'application/pdf') iconClass = 'dashicons-pdf';
			else if (mime.includes('zip') || mime.includes('archive')) iconClass = 'dashicons-media-archive';
			else if (mime.startsWith('text/')) iconClass = 'dashicons-media-text';
			else if (mime.includes('spreadsheet') || mime.includes('excel')) iconClass = 'dashicons-media-spreadsheet';
			else if (mime.includes('document') || mime.includes('word')) iconClass = 'dashicons-media-document';

			// Get file type for display.
			const mimeShort = mime.split('/').pop().toUpperCase();

			// Update info display.
			info.innerHTML = `
				<div class="openfields-file-preview">
					<span class="openfields-file-icon dashicons ${iconClass}"></span>
					<div class="openfields-file-details">
						<a href="${attachment.url}" target="_blank" class="openfields-file-name" title="Open in new tab">
							${attachment.filename || attachment.title}
						</a>
						<div class="openfields-file-meta">
							<span class="openfields-file-type">${mimeShort}</span>
							${attachment.filesizeHumanReadable ? `<span class="openfields-file-size">${attachment.filesizeHumanReadable}</span>` : ''}
						</div>
					</div>
				</div>
			`;
			info.classList.remove('no-file');
			info.classList.add('has-file');

			// Toggle buttons.
			if (selectBtn) selectBtn.classList.add('hidden');
			if (changeBtn) changeBtn.classList.remove('hidden');
			if (removeBtn) removeBtn.classList.remove('hidden');
		},

		/**
		 * Remove file from field.
		 *
		 * @param {HTMLElement} field - The file field container.
		 */
		removeFile(field) {
			const input = field.querySelector('.openfields-file-value');
			const info = field.querySelector('.openfields-file-info');
			const selectBtn = field.querySelector('.openfields-file-select');
			const changeBtn = field.querySelector('.openfields-file-change');
			const removeBtn = field.querySelector('.openfields-file-remove');

			// Clear hidden input.
			if (input) input.value = '';

			// Reset info display.
			info.innerHTML = `
				<div class="openfields-file-placeholder">
					<span class="dashicons dashicons-media-default"></span>
					<span class="openfields-file-placeholder-text">No file selected</span>
				</div>
			`;
			info.classList.remove('has-file');
			info.classList.add('no-file');

			// Toggle buttons.
			if (selectBtn) selectBtn.classList.remove('hidden');
			if (changeBtn) changeBtn.classList.add('hidden');
			if (removeBtn) removeBtn.classList.add('hidden');
		},

		/**
		 * Initialize gallery field interactions.
		 */
		initGalleryFields() {
			const galleryFields = document.querySelectorAll('.openfields-gallery-field');
			
			galleryFields.forEach(field => {
				// Skip if already initialized to prevent duplicate event listeners.
				if (field.dataset.ofInitialized) {
					return;
				}
				field.dataset.ofInitialized = 'true';

				// Add buttons.
				const addBtns = field.querySelectorAll('.openfields-gallery-add, .openfields-gallery-select');
				addBtns.forEach(btn => {
					btn.addEventListener('click', () => this.openGalleryMediaLibrary(field));
				});

				// Remove buttons for individual items.
				this.bindGalleryItemRemove(field);

				// Initialize drag and drop.
				this.initGalleryDragDrop(field);
			});
		},

		/**
		 * Open WordPress media library for gallery selection.
		 *
		 * @param {HTMLElement} field - The gallery field container.
		 */
		openGalleryMediaLibrary(field) {
			if (!wp || !wp.media) {
				console.error('[OpenFields] WordPress media library not available');
				return;
			}

			const maxImages = parseInt(field.dataset.max) || 0;
			const currentCount = field.querySelectorAll('.openfields-gallery-item').length;

			const frame = wp.media({
				title: 'Select Images',
				button: { text: 'Add to gallery' },
				library: { type: 'image' },
				multiple: true,
			});

			frame.on('select', () => {
				const selection = frame.state().get('selection').toJSON();
				
				// Check max limit.
				let imagesToAdd = selection;
				if (maxImages > 0) {
					const available = maxImages - currentCount;
					if (available <= 0) {
						alert(`Maximum of ${maxImages} images allowed.`);
						return;
					}
					imagesToAdd = selection.slice(0, available);
				}

				this.addGalleryImages(field, imagesToAdd);
			});

			frame.open();
		},

		/**
		 * Add images to gallery.
		 *
		 * @param {HTMLElement} field - The gallery field container.
		 * @param {Array} attachments - Array of attachment objects.
		 */
		addGalleryImages(field, attachments) {
			const grid = field.querySelector('.openfields-gallery-grid');
			const input = field.querySelector('.openfields-gallery-value');
			const placeholder = field.querySelector('.openfields-gallery-placeholder');
			const addItem = grid.querySelector('.openfields-gallery-add-item');
			const previewSize = field.dataset.previewSize || 'thumbnail';

			// Get current IDs.
			const currentIds = input.value ? input.value.split(',').filter(id => id) : [];

			// Add new images.
			attachments.forEach(attachment => {
				if (currentIds.includes(String(attachment.id))) return; // Skip duplicates.

				currentIds.push(String(attachment.id));

				const size = attachment.sizes?.[previewSize] || attachment.sizes?.thumbnail || { url: attachment.url };
				
				const item = document.createElement('div');
				item.className = 'openfields-gallery-item';
				item.dataset.attachmentId = attachment.id;
				item.innerHTML = `
					<div class="openfields-gallery-thumb">
						<img src="${size.url}" alt="${attachment.alt || ''}" />
					</div>
					<div class="openfields-gallery-item-actions">
						<button type="button" class="openfields-gallery-item-remove" title="Remove">
							<span class="dashicons dashicons-no-alt"></span>
						</button>
					</div>
					<div class="openfields-gallery-item-drag" title="Drag to reorder">
						<span class="dashicons dashicons-move"></span>
					</div>
				`;

				// Insert before the add button.
				if (addItem) {
					grid.insertBefore(item, addItem);
				} else {
					grid.appendChild(item);
				}

				// Bind remove handler.
				item.querySelector('.openfields-gallery-item-remove').addEventListener('click', () => {
					this.removeGalleryItem(field, item);
				});
			});

			// Update hidden input.
			input.value = currentIds.join(',');

			// Hide placeholder, show grid.
			if (placeholder) placeholder.style.display = 'none';
			grid.classList.remove('no-images');
			grid.classList.add('has-images');

			// Update limits display.
			this.updateGalleryLimits(field);
		},

		/**
		 * Remove an item from gallery.
		 *
		 * @param {HTMLElement} field - The gallery field container.
		 * @param {HTMLElement} item - The item to remove.
		 */
		removeGalleryItem(field, item) {
			const grid = field.querySelector('.openfields-gallery-grid');
			const input = field.querySelector('.openfields-gallery-value');
			const placeholder = field.querySelector('.openfields-gallery-placeholder');
			const attachmentId = item.dataset.attachmentId;

			// Remove from DOM.
			item.remove();

			// Update hidden input.
			const currentIds = input.value ? input.value.split(',').filter(id => id && id !== attachmentId) : [];
			input.value = currentIds.join(',');

			// Show placeholder if empty.
			if (currentIds.length === 0) {
				if (placeholder) placeholder.style.display = '';
				grid.classList.remove('has-images');
				grid.classList.add('no-images');
			}

			// Update limits display.
			this.updateGalleryLimits(field);
		},

		/**
		 * Bind remove handlers for existing gallery items.
		 *
		 * @param {HTMLElement} field - The gallery field container.
		 */
		bindGalleryItemRemove(field) {
			const items = field.querySelectorAll('.openfields-gallery-item');
			items.forEach(item => {
				const removeBtn = item.querySelector('.openfields-gallery-item-remove');
				if (removeBtn) {
					removeBtn.addEventListener('click', () => {
						this.removeGalleryItem(field, item);
					});
				}
			});
		},

		/**
		 * Initialize drag and drop for gallery items.
		 *
		 * @param {HTMLElement} field - The gallery field container.
		 */
		initGalleryDragDrop(field) {
			const grid = field.querySelector('.openfields-gallery-grid');
			let draggedItem = null;

			grid.addEventListener('dragstart', (e) => {
				if (e.target.classList.contains('openfields-gallery-item')) {
					draggedItem = e.target;
					e.target.classList.add('is-dragging');
					e.dataTransfer.effectAllowed = 'move';
				}
			});

			grid.addEventListener('dragend', (e) => {
				if (draggedItem) {
					draggedItem.classList.remove('is-dragging');
					draggedItem = null;
					this.updateGalleryOrder(field);
				}
			});

			grid.addEventListener('dragover', (e) => {
				e.preventDefault();
				e.dataTransfer.dropEffect = 'move';

				const target = e.target.closest('.openfields-gallery-item');
				if (target && target !== draggedItem) {
					const rect = target.getBoundingClientRect();
					const midX = rect.left + rect.width / 2;
					
					if (e.clientX < midX) {
						target.parentNode.insertBefore(draggedItem, target);
					} else {
						target.parentNode.insertBefore(draggedItem, target.nextSibling);
					}
				}
			});

			// Make items draggable.
			const items = grid.querySelectorAll('.openfields-gallery-item');
			items.forEach(item => {
				item.setAttribute('draggable', 'true');
			});
		},

		/**
		 * Update gallery order after drag and drop.
		 *
		 * @param {HTMLElement} field - The gallery field container.
		 */
		updateGalleryOrder(field) {
			const input = field.querySelector('.openfields-gallery-value');
			const items = field.querySelectorAll('.openfields-gallery-item');
			const ids = Array.from(items).map(item => item.dataset.attachmentId);
			input.value = ids.join(',');
		},

		/**
		 * Update gallery limits display.
		 *
		 * @param {HTMLElement} field - The gallery field container.
		 */
		updateGalleryLimits(field) {
			const limits = field.querySelector('.openfields-gallery-limits');
			if (!limits) return;

			const min = parseInt(field.dataset.min) || 0;
			const max = parseInt(field.dataset.max) || 0;
			const count = field.querySelectorAll('.openfields-gallery-item').length;

			if (min > 0 && max > 0) {
				limits.textContent = `${count} images selected (min: ${min}, max: ${max})`;
			} else if (min > 0) {
				limits.textContent = `${count} images selected (min: ${min})`;
			} else if (max > 0) {
				limits.textContent = `${count} images selected (max: ${max})`;
			}
		},

		/**
		 * Bind global event handlers.
		 */
		bindEvents() {
			// Listen for custom switch toggle events if needed elsewhere.
			// Other components can subscribe to these events.
			// document.addEventListener('switchToggled', (e) => { ... });

			// Listen for file selected events if needed elsewhere.
			// document.addEventListener('fileSelected', (e) => { ... });
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
	 * For Gutenberg, we also need to watch for meta box loads.
	 */
	function initOpenFields() {
		// Check if we have any meta boxes
		const metaBoxes = document.querySelectorAll('.openfields-meta-box');
		
		if (metaBoxes.length > 0) {
			FieldsManager.init();
		} else {
		}
	}

	// Initial load
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initOpenFields);
	} else {
		initOpenFields();
	}

	// For Gutenberg: Watch for meta boxes being added dynamically
	// The meta boxes are loaded via AJAX in Gutenberg
	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (node.nodeType === 1) { // Element node
					// Check if this is a meta box or contains meta boxes
					if (node.classList?.contains('openfields-meta-box') || 
					    node.querySelector?.('.openfields-meta-box')) {
						// Small delay to ensure DOM is fully rendered
						setTimeout(() => FieldsManager.init(), 100);
					}
				}
			});
		});
	});

	// Start observing once DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			observer.observe(document.body, { childList: true, subtree: true });
		});
	} else {
		observer.observe(document.body, { childList: true, subtree: true });
	}

	// Also re-init when window loads (for lazy-loaded iframes, etc.)
	window.addEventListener('load', () => {
		setTimeout(initOpenFields, 500);
	});

	/**
	 * Export for testing or external use.
	 */
	window.OpenFieldsManager = FieldsManager;
	window.OpenFieldsValidator = Validator;
})();
