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
 * @package Codeideal_Open_Fields
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
 * @param int    $object_id   Object ID (post, term, or user ID).
 * @param string $object_type Object type: 'post', 'term', or 'user'.
 */
function cof_render_repeater_field( $field, $value, $field_id, $base_name, $settings, $object_id, $object_type = 'post' ) {
	global $wpdb;

	// Get sub-fields for this repeater.
	$sub_fields = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT * FROM {$wpdb->prefix}cof_fields WHERE parent_id = %d ORDER BY menu_order ASC",
			$field->id
		)
	);

	if ( empty( $sub_fields ) ) {
		echo '<p class="description">' . esc_html__( 'No sub-fields configured for this repeater.', 'codeideal-open-fields' ) . '</p>';
		return;
	}

	// Get settings.
	$min          = isset( $settings['min'] ) ? absint( $settings['min'] ) : 0;
	$max          = isset( $settings['max'] ) ? absint( $settings['max'] ) : 0;
	$layout       = isset( $settings['layout'] ) ? $settings['layout'] : 'block';
	$button_label = isset( $settings['button_label'] ) ? $settings['button_label'] : __( 'Add Row', 'codeideal-open-fields' );

	// Determine row count.
	$row_count = 0;
	if ( is_numeric( $value ) && $value > 0 ) {
		$row_count = absint( $value );
	} else {
		// Detect from existing meta.
		$row_count = cof_detect_repeater_rows( $object_id, $base_name, $sub_fields, $object_type );
	}

	// Ensure minimum.
	if ( $min > 0 && $row_count < $min ) {
		$row_count = $min;
	}

	$unique_id = 'repeater-' . sanitize_key( $base_name ) . '-' . wp_rand( 1000, 9999 );
	?>
	<div 
		class="cof-repeater"
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
			class="cof-repeater-count"
		/>

		<!-- Rows -->
		<div class="cof-repeater-rows" data-layout="<?php echo esc_attr( $layout ); ?>">
			<?php
			for ( $i = 0; $i < $row_count; $i++ ) {
				cof_render_repeater_row( $field, $sub_fields, $i, $base_name, $layout, $object_id, $object_type, false );
			}
			?>
		</div>

		<!-- Add Button -->
		<div class="cof-repeater-footer">
			<button 
				type="button" 
				class="button cof-repeater-add"
				<?php echo ( $max > 0 && $row_count >= $max ) ? 'disabled' : ''; ?>
			>
				<span class="dashicons dashicons-plus-alt2"></span>
				<?php echo esc_html( $button_label ); ?>
			</button>
		</div>

		<!-- Template for JS -->
		<template class="cof-repeater-template">
			<?php cof_render_repeater_row( $field, $sub_fields, '{{INDEX}}', $base_name, $layout, $object_id, $object_type, true ); ?>
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
 * @param int    $object_id   Object ID.
 * @param string $object_type Object type: 'post', 'term', or 'user'.
 * @param bool   $is_template Whether rendering as template.
 */
function cof_render_repeater_row( $field, $sub_fields, $index, $base_name, $layout, $object_id, $object_type = 'post', $is_template = false ) {
	$row_num = is_numeric( $index ) ? ( $index + 1 ) : '';
	?>
	<div class="cof-repeater-row" data-index="<?php echo esc_attr( $index ); ?>">
		<div class="cof-repeater-row-handle">
			<span class="dashicons dashicons-menu"></span>
			<span class="cof-repeater-row-index"><?php echo esc_html( $row_num ); ?></span>
		</div>

		<div class="cof-repeater-row-content">
			<?php
			foreach ( $sub_fields as $sub_field ) {
				cof_render_repeater_subfield( $sub_field, $index, $base_name, $object_id, $object_type, $is_template );
			}
			?>
		</div>

		<div class="cof-repeater-row-actions">
			<button type="button" class="cof-repeater-row-toggle" title="<?php esc_attr_e( 'Collapse', 'codeideal-open-fields' ); ?>">
				<span class="dashicons dashicons-arrow-up-alt2"></span>
			</button>
			<button type="button" class="cof-repeater-row-remove" title="<?php esc_attr_e( 'Remove', 'codeideal-open-fields' ); ?>">
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
function cof_get_raw_subfield_name( $sub_field_name, $parent_name ) {
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
 * @param int    $object_id   Object ID.
 * @param string $object_type Object type: 'post', 'term', or 'user'.
 * @param bool   $is_template Whether rendering as template.
 */
function cof_render_repeater_subfield( $sub_field, $index, $base_name, $object_id, $object_type = 'post', $is_template = false ) {
	// Parse field_config for field-specific settings (choices, layout, etc.)
	$field_settings = array();
	if ( ! empty( $sub_field->field_config ) ) {
		$decoded  = json_decode( $sub_field->field_config, true );
		$field_settings = is_array( $decoded ) ? $decoded : array();
	}

	// Parse wrapper_config for width, class, id
	$wrapper_config = array();
	if ( ! empty( $sub_field->wrapper_config ) ) {
		$decoded  = json_decode( $sub_field->wrapper_config, true );
		$wrapper_config = is_array( $decoded ) ? $decoded : array();
	}

	// Merge both configs - wrapper_config takes precedence
	$settings = array_merge( $field_settings, $wrapper_config );

	// Get the raw sub-field name (without parent prefix that DB might have).
	// The database stores sub-fields as "parent_subfield", we need just "subfield".
	$raw_name = cof_get_raw_subfield_name( $sub_field->name, $base_name );

	// Build the full field name: base_index_subfield
	// ACF format: repeater_0_subfield (no prefix)
	$full_name = $base_name . '_' . $index . '_' . $raw_name;
	
	// Build field ID - handle {{INDEX}} placeholder properly for templates
	if ( $is_template ) {
		// For templates, keep {{INDEX}} as-is for JavaScript replacement
		$field_id = 'field_' . $base_name . '_{{INDEX}}_' . $raw_name;
	} else {
		// For actual rows, use the numeric index
		$field_id = 'field_' . $base_name . '_' . $index . '_' . $raw_name;
	}
	// Clean up any remaining special characters
	$field_id = str_replace( array( '[', ']' ), '_', $field_id );

	// Get value (only for real rows, not template).
	$value = '';
	if ( ! $is_template && $object_id && is_numeric( $index ) ) {
		// Use appropriate meta function based on object type.
		switch ( $object_type ) {
			case 'term':
				$value = get_term_meta( $object_id, $full_name, true );
				break;
			case 'user':
				$value = get_user_meta( $object_id, $full_name, true );
				break;
			case 'post':
			default:
				$value = get_post_meta( $object_id, $full_name, true );
				break;
		}
	}

	// Default value.
	if ( ! $is_template && $value === '' && ! empty( $sub_field->default_value ) ) {
		$value = $sub_field->default_value;
	}

	// Width from wrapper_config - default to 100% if not specified
	$width = isset( $wrapper_config['width'] ) ? intval( $wrapper_config['width'] ) : 100;
	$width = max( 10, min( 100, $width ) ); // Constrain between 10-100%

	// Get optional CSS class and ID from wrapper_config
	$wrapper_class = isset( $wrapper_config['class'] ) ? sanitize_html_class( $wrapper_config['class'] ) : '';
	$wrapper_id = isset( $wrapper_config['id'] ) ? sanitize_html_class( $wrapper_config['id'] ) : '';
	
	// Build wrapper classes
	$classes = array( 'cof-repeater-subfield' );
	if ( $wrapper_class ) {
		$classes[] = $wrapper_class;
	}

	// Build ID attribute if present
	$id_attr = '';
	if ( $wrapper_id ) {
		$id_attr = ' id="' . esc_attr( $wrapper_id ) . '"';
	}

	// Build style with CSS custom property - no inline PHP in attributes
	$width_val = intval( $width );
	$field_id_attr = '';
	if ( ! empty( $sub_field->id ) ) {
		$field_id_attr = ' data-field-id="' . esc_attr( $sub_field->id ) . '"';
	}

	// Add conditional logic attribute if present
	$conditional_attr = '';
	if ( ! empty( $sub_field->conditional_logic ) ) {
		// Decode JSON string from database, then re-encode for safe HTML attribute
		$decoded_conditions = json_decode( $sub_field->conditional_logic, true );
		$conditions = is_array( $decoded_conditions ) ? $decoded_conditions : array();
		$conditional_attr = ' data-conditional-logic="' . esc_attr( wp_json_encode( $conditions ) ) . '"';
		$conditional_attr .= ' data-conditional-status="hidden"'; // Initially hidden, shown by JS if conditions met
	}
	
	echo '<div class="' . implode( ' ', array_map( 'esc_attr', $classes ) ) . '" style="--of-field-width: ' . $width_val . '%;" data-width="' . $width_val . '"' . $id_attr . $field_id_attr . $conditional_attr . '>';

	if ( ! empty( $sub_field->label ) ) {
		echo '<label class="cof-repeater-subfield-label" for="' . esc_attr( $field_id ) . '">';
		echo esc_html( $sub_field->label );
		if ( ! empty( $sub_field->required ) ) {
			echo '<span class="required">*</span>';
		}
		echo '</label>';
	}

	echo '<div class="cof-repeater-subfield-input">';
	cof_render_field_input( $sub_field, $value, $field_id, $full_name, $field_settings, $object_id, $object_type, $is_template, $base_name );
	echo '</div>';

	if ( ! empty( $sub_field->instructions ) ) {
		echo '<p class="description">' . wp_kses_post( $sub_field->instructions ) . '</p>';
	}

	echo '</div>';
}

/**
 * Unified field input renderer.
 *
 * Delegates to the centralized COF_Field_Renderer class for consistency.
 *
 * @param object $field       Field database object.
 * @param mixed  $value       Current value.
 * @param string $field_id    HTML ID attribute.
 * @param string $full_name   Full field name (parent_index_subfield format) - NO PREFIX.
 * @param array  $settings    Field settings.
 * @param int    $object_id   Object ID.
 * @param string $object_type Object type: 'post', 'term', or 'user'.
 * @param bool   $is_template Whether rendering as template.
 * @param string $parent_name Parent repeater name for nested repeaters.
 */
function cof_render_field_input( $field, $value, $field_id, $full_name, $settings, $object_id, $object_type = 'post', $is_template = false, $parent_name = '' ) {
	// Use the centralized field renderer.
	$context = array(
		'object_id'   => $object_id,
		'object_type' => $object_type,
		'parent_name' => $full_name,
		'is_template' => $is_template,
	);

	// For WYSIWYG in templates, render as textarea (JS will init editor).
	if ( $field->type === 'wysiwyg' && $is_template ) {
		echo '<textarea id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $full_name ) . '" class="widefat" rows="6">' . esc_textarea( $value ) . '</textarea>';
		return;
	}

	cof_render_field( $field, $value, $field_id, $full_name, $settings, $context );
}

/**
 * Detect existing repeater rows from meta.
 *
 * @param int    $object_id   Object ID (post, term, or user ID).
 * @param string $base_name   Repeater base name.
 * @param array  $sub_fields  Sub-field objects.
 * @param string $object_type Object type: 'post', 'term', or 'user'.
 * @return int
 */
function cof_detect_repeater_rows( $object_id, $base_name, $sub_fields, $object_type = 'post' ) {
	if ( ! $object_id || empty( $sub_fields ) ) {
		return 0;
	}

	global $wpdb;

	// Determine the correct meta table and ID column.
	switch ( $object_type ) {
		case 'term':
			$table     = $wpdb->termmeta;
			$id_column = 'term_id';
			break;
		case 'user':
			$table     = $wpdb->usermeta;
			$id_column = 'user_id';
			break;
		case 'post':
		default:
			$table     = $wpdb->postmeta;
			$id_column = 'post_id';
			break;
	}

	// Use first sub-field for detection.
	// Get raw name without parent prefix.
	$first_sub_raw = cof_get_raw_subfield_name( $sub_fields[0]->name, $base_name );

	// Pattern: {base}_{index}_{subfield} (no prefix)
	$keys = $wpdb->get_col(
		$wpdb->prepare(
			"SELECT meta_key FROM {$table} WHERE {$id_column} = %d AND meta_key REGEXP %s",
			$object_id,
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
