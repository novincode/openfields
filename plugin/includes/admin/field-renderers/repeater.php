<?php
/**
 * Repeater Field Renderer
 *
 * Renders repeater fields with ACF-compatible data storage format.
 * Supports nested repeaters through recursive rendering.
 *
 * ACF Data Format (no prefix, 0-based index):
 * - {field_name} = count (integer)
 * - {field_name}_{index}_{subfield} = value
 *
 * For nested repeaters:
 * - {parent}_{i}_{child} = count
 * - {parent}_{i}_{child}_{j}_{subfield} = value
 *
 * @package OpenFields
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Render a repeater field.
 *
 * @param object $field       Field object from database.
 * @param mixed  $value       Current row count.
 * @param string $field_id    HTML field ID.
 * @param string $base_name   Base name for this repeater.
 * @param array  $settings    Field settings array.
 * @param int    $post_id     Post ID for fetching sub-field values.
 */
function openfields_render_repeater_field( $field, $value, $field_id, $base_name, $settings, $post_id ) {
	global $wpdb;

	// Get sub-fields for this repeater.
	$sub_fields = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT * FROM {$wpdb->prefix}openfields_fields WHERE parent_id = %d ORDER BY menu_order ASC",
			$field->id
		)
	);

	if ( empty( $sub_fields ) ) {
		echo '<p class="description">' . esc_html__( 'No sub-fields configured for this repeater.', 'openfields' ) . '</p>';
		return;
	}

	// Get settings.
	$min          = isset( $settings['min'] ) ? absint( $settings['min'] ) : 0;
	$max          = isset( $settings['max'] ) ? absint( $settings['max'] ) : 0;
	$layout       = isset( $settings['layout'] ) ? $settings['layout'] : 'block';
	$button_label = isset( $settings['button_label'] ) ? $settings['button_label'] : __( 'Add Row', 'openfields' );

	// Determine row count.
	$row_count = 0;
	if ( is_numeric( $value ) && $value > 0 ) {
		$row_count = absint( $value );
	} else {
		// Detect from existing meta.
		$row_count = openfields_detect_repeater_rows( $post_id, $base_name, $sub_fields );
	}

	// Ensure minimum.
	if ( $min > 0 && $row_count < $min ) {
		$row_count = $min;
	}

	$unique_id = 'repeater-' . sanitize_key( $base_name ) . '-' . wp_rand( 1000, 9999 );
	?>
	<div 
		class="openfields-repeater"
		id="<?php echo esc_attr( $unique_id ); ?>"
		data-name="<?php echo esc_attr( $base_name ); ?>"
		data-min="<?php echo esc_attr( $min ); ?>"
		data-max="<?php echo esc_attr( $max ); ?>"
		data-layout="<?php echo esc_attr( $layout ); ?>"
	>
		<!-- Hidden count input - NO PREFIX for ACF compatibility -->
		<input 
			type="hidden" 
			name="<?php echo esc_attr( $base_name ); ?>" 
			value="<?php echo esc_attr( $row_count ); ?>"
			class="openfields-repeater-count"
		/>

		<!-- Rows -->
		<div class="openfields-repeater-rows" data-layout="<?php echo esc_attr( $layout ); ?>">
			<?php
			for ( $i = 0; $i < $row_count; $i++ ) {
				openfields_render_repeater_row( $field, $sub_fields, $i, $base_name, $layout, $post_id, false );
			}
			?>
		</div>

		<!-- Add Button -->
		<div class="openfields-repeater-footer">
			<button 
				type="button" 
				class="button openfields-repeater-add"
				<?php echo ( $max > 0 && $row_count >= $max ) ? 'disabled' : ''; ?>
			>
				<span class="dashicons dashicons-plus-alt2"></span>
				<?php echo esc_html( $button_label ); ?>
			</button>
		</div>

		<!-- Template for JS -->
		<template class="openfields-repeater-template">
			<?php openfields_render_repeater_row( $field, $sub_fields, '{{INDEX}}', $base_name, $layout, $post_id, true ); ?>
		</template>
	</div>
	<?php
}

/**
 * Render a single repeater row.
 *
 * @param object $field       Parent repeater field object.
 * @param array  $sub_fields  Sub-field objects.
 * @param mixed  $index       Row index (int or '{{INDEX}}' for template).
 * @param string $base_name   Base name for this repeater.
 * @param string $layout      Layout type.
 * @param int    $post_id     Post ID.
 * @param bool   $is_template Whether rendering as template.
 */
function openfields_render_repeater_row( $field, $sub_fields, $index, $base_name, $layout, $post_id, $is_template = false ) {
	$row_num = is_numeric( $index ) ? ( $index + 1 ) : '';
	?>
	<div class="openfields-repeater-row" data-index="<?php echo esc_attr( $index ); ?>">
		<div class="openfields-repeater-row-handle">
			<span class="dashicons dashicons-menu"></span>
			<span class="openfields-repeater-row-index"><?php echo esc_html( $row_num ); ?></span>
		</div>

		<div class="openfields-repeater-row-content">
			<?php
			foreach ( $sub_fields as $sub_field ) {
				openfields_render_repeater_subfield( $sub_field, $index, $base_name, $post_id, $is_template );
			}
			?>
		</div>

		<div class="openfields-repeater-row-actions">
			<button type="button" class="openfields-repeater-row-toggle" title="<?php esc_attr_e( 'Collapse', 'openfields' ); ?>">
				<span class="dashicons dashicons-arrow-up-alt2"></span>
			</button>
			<button type="button" class="openfields-repeater-row-remove" title="<?php esc_attr_e( 'Remove', 'openfields' ); ?>">
				<span class="dashicons dashicons-trash"></span>
			</button>
		</div>
	</div>
	<?php
}

/**
 * Get raw sub-field name (without parent prefix).
 *
 * Sub-fields in the database are stored with parent prefix (e.g., "field_3_field_1").
 * For ACF-compatible data format, we need the raw name (e.g., "field_1").
 *
 * @param string $sub_field_name Full sub-field name from database.
 * @param string $parent_name    Parent repeater name.
 * @return string Raw sub-field name.
 */
function openfields_get_raw_subfield_name( $sub_field_name, $parent_name ) {
	// If the sub-field name starts with parent name + underscore, strip it.
	$prefix = $parent_name . '_';
	if ( strpos( $sub_field_name, $prefix ) === 0 ) {
		return substr( $sub_field_name, strlen( $prefix ) );
	}
	return $sub_field_name;
}

/**
 * Render a sub-field within a repeater row.
 *
 * @param object $sub_field   Sub-field object.
 * @param mixed  $index       Row index.
 * @param string $base_name   Parent repeater base name.
 * @param int    $post_id     Post ID.
 * @param bool   $is_template Whether rendering as template.
 */
function openfields_render_repeater_subfield( $sub_field, $index, $base_name, $post_id, $is_template = false ) {
	$settings = array();
	if ( ! empty( $sub_field->field_config ) ) {
		$decoded  = json_decode( $sub_field->field_config, true );
		$settings = is_array( $decoded ) ? $decoded : array();
	}

	// Get the raw sub-field name (without parent prefix that DB might have).
	// The database stores sub-fields as "parent_subfield", we need just "subfield".
	$raw_name = openfields_get_raw_subfield_name( $sub_field->name, $base_name );

	// Build the full field name: base_index_subfield
	// ACF format: repeater_0_subfield (no prefix)
	$full_name = $base_name . '_' . $index . '_' . $raw_name;
	$field_id  = 'field_' . str_replace( array( '[', ']', '{{', '}}' ), '_', $full_name );

	// Get value (only for real rows, not template).
	$value = '';
	if ( ! $is_template && $post_id && is_numeric( $index ) ) {
		// ACF format (no prefix).
		$value = get_post_meta( $post_id, $full_name, true );
	}

	// Default value.
	if ( ! $is_template && $value === '' && ! empty( $sub_field->default_value ) ) {
		$value = $sub_field->default_value;
	}

	// Width from settings.
	$width = 100;
	if ( isset( $settings['width'] ) ) {
		$width = max( 10, min( 100, intval( $settings['width'] ) ) );
	}
	?>
	<div class="openfields-repeater-subfield" style="flex: 0 0 <?php echo intval( $width ); ?>%; max-width: <?php echo intval( $width ); ?>%;">
		<?php if ( ! empty( $sub_field->label ) ) : ?>
			<label class="openfields-repeater-subfield-label" for="<?php echo esc_attr( $field_id ); ?>">
				<?php echo esc_html( $sub_field->label ); ?>
				<?php if ( ! empty( $sub_field->required ) ) : ?>
					<span class="required">*</span>
				<?php endif; ?>
			</label>
		<?php endif; ?>

		<div class="openfields-repeater-subfield-input">
			<?php
			openfields_render_field_input( $sub_field, $value, $field_id, $full_name, $settings, $post_id, $is_template, $base_name );
			?>
		</div>

		<?php if ( ! empty( $sub_field->instructions ) ) : ?>
			<p class="description"><?php echo wp_kses_post( $sub_field->instructions ); ?></p>
		<?php endif; ?>
	</div>
	<?php
}

/**
 * Unified field input renderer.
 *
 * @param object $field       Field database object.
 * @param mixed  $value       Current value.
 * @param string $field_id    HTML ID attribute.
 * @param string $full_name   Full field name (parent_index_subfield format) - NO PREFIX.
 * @param array  $settings    Field settings.
 * @param int    $post_id     Post ID.
 * @param bool   $is_template Whether rendering as template.
 * @param string $parent_name Parent repeater name for nested repeaters.
 */
function openfields_render_field_input( $field, $value, $field_id, $full_name, $settings, $post_id, $is_template = false, $parent_name = '' ) {
	// The HTML name attribute is the full_name directly (no prefix for ACF compatibility).
	$html_name = $full_name;

	// Nested repeater - recurse.
	if ( $field->type === 'repeater' ) {
		openfields_render_repeater_field( $field, $value, $field_id, $full_name, $settings, $post_id );
		return;
	}

	switch ( $field->type ) {
		case 'text':
			$placeholder = ! empty( $field->placeholder ) ? $field->placeholder : '';
			printf(
				'<input type="text" id="%s" name="%s" value="%s" placeholder="%s" class="widefat" />',
				esc_attr( $field_id ),
				esc_attr( $html_name ),
				esc_attr( $value ),
				esc_attr( $placeholder )
			);
			break;

		case 'email':
			$placeholder = ! empty( $field->placeholder ) ? $field->placeholder : '';
			echo '<div class="openfields-input-with-icon openfields-input-icon-left">';
			echo '<span class="openfields-input-icon dashicons dashicons-email"></span>';
			printf(
				'<input type="email" id="%s" name="%s" value="%s" placeholder="%s" class="widefat openfields-input-has-icon" data-validate="email" />',
				esc_attr( $field_id ),
				esc_attr( $html_name ),
				esc_attr( $value ),
				esc_attr( $placeholder ?: 'email@example.com' )
			);
			echo '</div>';
			break;

		case 'url':
			$placeholder = ! empty( $field->placeholder ) ? $field->placeholder : '';
			echo '<div class="openfields-input-with-icon openfields-input-icon-left">';
			echo '<span class="openfields-input-icon dashicons dashicons-admin-links"></span>';
			printf(
				'<input type="url" id="%s" name="%s" value="%s" placeholder="%s" class="widefat openfields-input-has-icon" data-validate="url" />',
				esc_attr( $field_id ),
				esc_attr( $html_name ),
				esc_attr( $value ),
				esc_attr( $placeholder ?: 'https://' )
			);
			echo '</div>';
			break;

		case 'number':
			$min  = isset( $settings['min'] ) ? $settings['min'] : '';
			$max  = isset( $settings['max'] ) ? $settings['max'] : '';
			$step = isset( $settings['step'] ) ? $settings['step'] : 1;
			printf(
				'<input type="number" id="%s" name="%s" value="%s" class="widefat" %s %s %s data-validate="number" />',
				esc_attr( $field_id ),
				esc_attr( $html_name ),
				esc_attr( $value ),
				$min !== '' ? 'min="' . esc_attr( $min ) . '"' : '',
				$max !== '' ? 'max="' . esc_attr( $max ) . '"' : '',
				$step !== '' ? 'step="' . esc_attr( $step ) . '"' : ''
			);
			break;

		case 'textarea':
			$rows = isset( $settings['rows'] ) ? absint( $settings['rows'] ) : 4;
			$placeholder = ! empty( $field->placeholder ) ? $field->placeholder : '';
			printf(
				'<textarea id="%s" name="%s" rows="%d" placeholder="%s" class="widefat">%s</textarea>',
				esc_attr( $field_id ),
				esc_attr( $html_name ),
				$rows,
				esc_attr( $placeholder ),
				esc_textarea( $value )
			);
			break;

		case 'select':
			$choices  = isset( $settings['choices'] ) ? $settings['choices'] : array();
			$multiple = ! empty( $settings['multiple'] );
			$name_attr = $multiple ? $html_name . '[]' : $html_name;
			echo '<select id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $name_attr ) . '" class="widefat"' . ( $multiple ? ' multiple' : '' ) . '>';
			if ( ! $multiple ) {
				echo '<option value="">' . esc_html__( '— Select —', 'openfields' ) . '</option>';
			}
			foreach ( $choices as $choice ) {
				$choice_value = is_array( $choice ) ? ( $choice['value'] ?? '' ) : $choice;
				$choice_label = is_array( $choice ) ? ( $choice['label'] ?? $choice_value ) : $choice;
				$selected = is_array( $value ) ? in_array( $choice_value, $value, true ) : ( $value === $choice_value );
				echo '<option value="' . esc_attr( $choice_value ) . '"' . selected( $selected, true, false ) . '>' . esc_html( $choice_label ) . '</option>';
			}
			echo '</select>';
			break;

		case 'radio':
			$choices = isset( $settings['choices'] ) ? $settings['choices'] : array();
			echo '<div class="openfields-radio-group">';
			foreach ( $choices as $i => $choice ) {
				$choice_value = is_array( $choice ) ? ( $choice['value'] ?? '' ) : $choice;
				$choice_label = is_array( $choice ) ? ( $choice['label'] ?? $choice_value ) : $choice;
				$radio_id = $field_id . '_' . $i;
				$checked = $value === $choice_value;
				echo '<label for="' . esc_attr( $radio_id ) . '">';
				echo '<input type="radio" id="' . esc_attr( $radio_id ) . '" name="' . esc_attr( $html_name ) . '" value="' . esc_attr( $choice_value ) . '"' . checked( $checked, true, false ) . ' />';
				echo ' ' . esc_html( $choice_label );
				echo '</label>';
			}
			echo '</div>';
			break;

		case 'checkbox':
			$choices = isset( $settings['choices'] ) ? $settings['choices'] : array();
			if ( empty( $choices ) ) {
				$checked = ! empty( $value );
				echo '<label for="' . esc_attr( $field_id ) . '">';
				echo '<input type="checkbox" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $html_name ) . '" value="1"' . checked( $checked, true, false ) . ' />';
				echo '</label>';
			} else {
				$values = is_array( $value ) ? $value : array();
				echo '<div class="openfields-checkbox-group">';
				foreach ( $choices as $i => $choice ) {
					$choice_value = is_array( $choice ) ? ( $choice['value'] ?? '' ) : $choice;
					$choice_label = is_array( $choice ) ? ( $choice['label'] ?? $choice_value ) : $choice;
					$cb_id = $field_id . '_' . $i;
					$checked = in_array( $choice_value, $values, true );
					echo '<label for="' . esc_attr( $cb_id ) . '">';
					echo '<input type="checkbox" id="' . esc_attr( $cb_id ) . '" name="' . esc_attr( $html_name ) . '[]" value="' . esc_attr( $choice_value ) . '"' . checked( $checked, true, false ) . ' />';
					echo ' ' . esc_html( $choice_label );
					echo '</label>';
				}
				echo '</div>';
			}
			break;

		case 'switch':
			$checked = ! empty( $value ) && $value !== '0';
			echo '<input type="hidden" name="' . esc_attr( $html_name ) . '" value="0" />';
			echo '<input type="checkbox" class="openfields-switch-input" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $html_name ) . '" value="1"' . checked( $checked, true, false ) . ' />';
			echo '<label class="openfields-switch-track" for="' . esc_attr( $field_id ) . '"><span class="openfields-switch-thumb"></span></label>';
			break;

		case 'date':
			printf( '<input type="date" id="%s" name="%s" value="%s" class="widefat" />', esc_attr( $field_id ), esc_attr( $html_name ), esc_attr( $value ) );
			break;

		case 'datetime':
			printf( '<input type="datetime-local" id="%s" name="%s" value="%s" class="widefat" />', esc_attr( $field_id ), esc_attr( $html_name ), esc_attr( $value ) );
			break;

		case 'color':
			printf( '<input type="color" id="%s" name="%s" value="%s" />', esc_attr( $field_id ), esc_attr( $html_name ), esc_attr( $value ?: '#000000' ) );
			break;

		case 'image':
		case 'file':
			$attachment_id = absint( $value );
			echo '<input type="hidden" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $html_name ) . '" value="' . esc_attr( $attachment_id ) . '" class="openfields-media-input" />';
			if ( $field->type === 'image' && $attachment_id ) {
				$img = wp_get_attachment_image_url( $attachment_id, 'thumbnail' );
				if ( $img ) {
					echo '<img src="' . esc_url( $img ) . '" class="openfields-media-preview" />';
				}
			}
			echo '<button type="button" class="button openfields-media-select">' . esc_html__( 'Select', 'openfields' ) . '</button>';
			if ( $attachment_id ) {
				echo ' <button type="button" class="button openfields-media-remove">' . esc_html__( 'Remove', 'openfields' ) . '</button>';
			}
			break;

		case 'wysiwyg':
			if ( ! $is_template ) {
				$editor_id = preg_replace( '/[^a-z0-9_]/', '', strtolower( $field_id ) );
				wp_editor( $value, $editor_id, array(
					'textarea_name' => $html_name,
					'textarea_rows' => 6,
					'media_buttons' => true,
					'teeny'         => false,
				) );
			} else {
				// Placeholder for template - JS will init editor.
				echo '<textarea id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $html_name ) . '" class="widefat" rows="6">' . esc_textarea( $value ) . '</textarea>';
			}
			break;

		default:
			do_action( 'openfields_render_field_' . $field->type, $field, $value, $field_id, $html_name, $settings, $post_id );
	}
}

/**
 * Detect existing repeater rows from postmeta.
 *
 * @param int    $post_id    Post ID.
 * @param string $base_name  Repeater base name.
 * @param array  $sub_fields Sub-field objects.
 * @return int
 */
function openfields_detect_repeater_rows( $post_id, $base_name, $sub_fields ) {
	if ( ! $post_id || empty( $sub_fields ) ) {
		return 0;
	}

	global $wpdb;

	// Use first sub-field for detection.
	// Get raw name without parent prefix.
	$first_sub_raw = openfields_get_raw_subfield_name( $sub_fields[0]->name, $base_name );

	// Pattern: {base}_{index}_{subfield} (no prefix)
	$keys = $wpdb->get_col(
		$wpdb->prepare(
			"SELECT meta_key FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key REGEXP %s",
			$post_id,
			'^' . preg_quote( $base_name, '/' ) . '_[0-9]+_' . preg_quote( $first_sub_raw, '/' ) . '$'
		)
	);

	if ( empty( $keys ) ) {
		return 0;
	}

	// Extract max index.
	$max_index = -1;
	foreach ( $keys as $key ) {
		if ( preg_match( '/^' . preg_quote( $base_name, '/' ) . '_(\d+)_/', $key, $m ) ) {
			$idx = (int) $m[1];
			if ( $idx > $max_index ) {
				$max_index = $idx;
			}
		}
	}

	return $max_index + 1;
}
