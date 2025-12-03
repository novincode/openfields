/**
 * OpenFields Meta Box JavaScript
 *
 * Handles client-side functionality for meta box fields on post edit screens.
 *
 * @package OpenFields
 * @since   1.0.0
 */

(function($) {
	'use strict';

	// Initialize when DOM is ready
	$(document).ready(function() {
		OpenFieldsMetaBox.init();
	});

	/**
	 * OpenFields Meta Box Handler
	 */
	var OpenFieldsMetaBox = {
		/**
		 * Initialize all field handlers
		 */
		init: function() {
			this.initImageFields();
			this.initFileFields();
			this.initColorPickers();
			this.initConditionalLogic();
		},

		/**
		 * Initialize image field uploaders
		 */
		initImageFields: function() {
			var self = this;

			// Select image button
			$(document).on('click', '.openfields-image-select', function(e) {
				e.preventDefault();
				
				var $button = $(this);
				var $field = $button.closest('.openfields-image-field');
				var $input = $field.find('input[type="hidden"]');
				var $preview = $field.find('.openfields-image-preview');
				var $removeBtn = $field.find('.openfields-image-remove');

				// Create media frame
				var frame = wp.media({
					title: openfieldsMetaBox.i18n.selectImage || 'Select Image',
					button: {
						text: openfieldsMetaBox.i18n.useImage || 'Use this image'
					},
					multiple: false,
					library: {
						type: 'image'
					}
				});

				// Handle selection
				frame.on('select', function() {
					var attachment = frame.state().get('selection').first().toJSON();
					
					$input.val(attachment.id).trigger('change');
					
					var imgUrl = attachment.sizes && attachment.sizes.thumbnail 
						? attachment.sizes.thumbnail.url 
						: attachment.url;
					
					$preview.html('<img src="' + imgUrl + '" alt="" />');
					$removeBtn.show();
				});

				frame.open();
			});

			// Remove image button
			$(document).on('click', '.openfields-image-remove', function(e) {
				e.preventDefault();
				
				var $button = $(this);
				var $field = $button.closest('.openfields-image-field');
				var $input = $field.find('input[type="hidden"]');
				var $preview = $field.find('.openfields-image-preview');

				$input.val('').trigger('change');
				$preview.html('');
				$button.hide();
			});
		},

		/**
		 * Initialize file field uploaders
		 */
		initFileFields: function() {
			var self = this;

			// Select file button
			$(document).on('click', '.openfields-file-select', function(e) {
				e.preventDefault();
				
				var $button = $(this);
				var $field = $button.closest('.openfields-file-field');
				var $input = $field.find('input[type="hidden"]');
				var $filename = $field.find('.openfields-file-name');
				var $removeBtn = $field.find('.openfields-file-remove');

				// Create media frame
				var frame = wp.media({
					title: openfieldsMetaBox.i18n.selectFile || 'Select File',
					button: {
						text: openfieldsMetaBox.i18n.useFile || 'Use this file'
					},
					multiple: false
				});

				// Handle selection
				frame.on('select', function() {
					var attachment = frame.state().get('selection').first().toJSON();
					
					$input.val(attachment.id).trigger('change');
					$filename.text(attachment.filename);
					$removeBtn.show();
				});

				frame.open();
			});

			// Remove file button
			$(document).on('click', '.openfields-file-remove', function(e) {
				e.preventDefault();
				
				var $button = $(this);
				var $field = $button.closest('.openfields-file-field');
				var $input = $field.find('input[type="hidden"]');
				var $filename = $field.find('.openfields-file-name');

				$input.val('').trigger('change');
				$filename.text('');
				$button.hide();
			});
		},

		/**
		 * Initialize color picker fields
		 */
		initColorPickers: function() {
			if ($.fn.wpColorPicker) {
				$('.openfields-color-picker').wpColorPicker();
			}
		},

		/**
		 * Initialize conditional logic
		 */
		initConditionalLogic: function() {
			var self = this;

			// Find all fields with conditional logic
			$('.openfields-field--has-conditional').each(function() {
				var $field = $(this);
				self.evaluateConditionalLogic($field);
			});

			// Re-evaluate on field changes
			$(document).on('change input', '.openfields-meta-box input, .openfields-meta-box select, .openfields-meta-box textarea', function() {
				$('.openfields-field--has-conditional').each(function() {
					self.evaluateConditionalLogic($(this));
				});
			});
		},

		/**
		 * Evaluate conditional logic for a field
		 *
		 * @param {jQuery} $field The field element
		 */
		evaluateConditionalLogic: function($field) {
			var fieldName = $field.data('field');
			var conditionalData = $field.data('conditional');

			if (!conditionalData || !conditionalData.enabled) {
				return;
			}

			var rules = conditionalData.rules || [];
			var action = conditionalData.action || 'show';
			var relation = conditionalData.relation || 'and';
			var results = [];

			// Evaluate each rule
			for (var i = 0; i < rules.length; i++) {
				var rule = rules[i];
				var result = this.evaluateRule(rule);
				results.push(result);
			}

			// Combine results based on relation
			var shouldShow;
			if (relation === 'and') {
				shouldShow = results.every(function(r) { return r; });
			} else {
				shouldShow = results.some(function(r) { return r; });
			}

			// Apply action
			if (action === 'hide') {
				shouldShow = !shouldShow;
			}

			// Toggle visibility
			if (shouldShow) {
				$field.removeClass('openfields-field--hidden');
			} else {
				$field.addClass('openfields-field--hidden');
			}
		},

		/**
		 * Evaluate a single conditional logic rule
		 *
		 * @param {Object} rule The rule to evaluate
		 * @return {boolean} Whether the rule passes
		 */
		evaluateRule: function(rule) {
			var fieldValue = this.getFieldValue(rule.field);
			var ruleValue = rule.value;
			var operator = rule.operator;

			switch (operator) {
				case '==':
				case '===':
					return fieldValue == ruleValue;
				case '!=':
				case '!==':
					return fieldValue != ruleValue;
				case '>':
					return parseFloat(fieldValue) > parseFloat(ruleValue);
				case '<':
					return parseFloat(fieldValue) < parseFloat(ruleValue);
				case '>=':
					return parseFloat(fieldValue) >= parseFloat(ruleValue);
				case '<=':
					return parseFloat(fieldValue) <= parseFloat(ruleValue);
				case 'contains':
					return String(fieldValue).indexOf(ruleValue) !== -1;
				case 'not_contains':
					return String(fieldValue).indexOf(ruleValue) === -1;
				case 'empty':
					return !fieldValue || fieldValue === '' || 
						(Array.isArray(fieldValue) && fieldValue.length === 0);
				case 'not_empty':
					return fieldValue && fieldValue !== '' && 
						(!Array.isArray(fieldValue) || fieldValue.length > 0);
				default:
					return false;
			}
		},

		/**
		 * Get the value of a field by name
		 *
		 * @param {string} fieldName The field name
		 * @return {*} The field value
		 */
		getFieldValue: function(fieldName) {
			var $input = $('[name="openfields[' + fieldName + ']"]');
			
			if ($input.length === 0) {
				// Check for array field names (checkboxes)
				$input = $('[name="openfields[' + fieldName + '][]"]');
			}

			if ($input.length === 0) {
				return '';
			}

			// Handle different input types
			if ($input.is(':checkbox')) {
				if ($input.length === 1) {
					return $input.is(':checked') ? $input.val() : '';
				}
				// Multiple checkboxes
				return $input.filter(':checked').map(function() {
					return $(this).val();
				}).get();
			}

			if ($input.is(':radio')) {
				return $input.filter(':checked').val() || '';
			}

			return $input.val();
		}
	};

	// Expose to global scope for extensibility
	window.OpenFieldsMetaBox = OpenFieldsMetaBox;

})(jQuery);
