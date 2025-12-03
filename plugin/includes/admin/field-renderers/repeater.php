<?php
/**
 * Repeater Field Renderer
 *
 * Renders repeater fields with ACF-compatible data storage format.
 * Supports nested repeaters through recursive rendering.
 *
 * ACF Data Format:
 * - {field_name} = count (integer)
 * - {field_name}_{index}_{subfield} = value
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
 * @param mixed  $value       Current row count or array of values.
 * @param string $field_id    HTML field ID.
 * @param string $field_name  HTML field name (used for meta key).
 * @param array  $settings    Field settings array.
 * @param int    $post_id     Post ID for fetching sub-field values.
 */
function openfields_render_repeater_field( $field, $value, $field_id, $field_name, $settings, $post_id ) {
	global $wpdb;

	// Get sub-fields for this repeater (fields where parent_id = this field's id).
	$sub_fields = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT * FROM {$wpdb->prefix}openfields_fields WHERE parent_id = %d ORDER BY menu_order ASC",
			$field->id
		)
	);

	if ( empty( $sub_fields ) ) {
		echo '<p class="openfields-repeater-empty">' . esc_html__( 'No sub-fields configured. Add fields to this repeater in the field builder.', 'openfields' ) . '</p>';
		return;
	}

	// Get settings.
	$min          = isset( $settings['min'] ) ? absint( $settings['min'] ) : 0;
	$max          = isset( $settings['max'] ) ? absint( $settings['max'] ) : 0;
	$layout       = isset( $settings['layout'] ) ? $settings['layout'] : 'table';
	$button_label = isset( $settings['button_label'] ) ? $settings['button_label'] : __( 'Add Row', 'openfields' );

	// Determine row count from meta (ACF format: field stores count).
	// The $value passed here should be the count from ACF format, or we detect from existing meta keys.
	$row_count = 0;

	if ( is_numeric( $value ) ) {
		$row_count = absint( $value );
	} else {
		// Try to detect rows by checking existing meta keys.
		$row_count = openfields_detect_repeater_rows( $post_id, $field->name, $sub_fields );
	}

	// Ensure minimum rows.
	if ( $min > 0 && $row_count < $min ) {
		$row_count = $min;
	}

	// If still 0, start with 1 empty row.
	if ( $row_count === 0 ) {
		$row_count = 1;
	}

	$unique_id = 'openfields-repeater-' . esc_attr( $field->name ) . '-' . wp_rand( 1000, 9999 );
	?>
	<div 
		class="openfields-repeater"
		id="<?php echo esc_attr( $unique_id ); ?>"
		data-field-name="<?php echo esc_attr( $field->name ); ?>"
		data-field-id="<?php echo esc_attr( $field->id ); ?>"
		data-min="<?php echo esc_attr( $min ); ?>"
		data-max="<?php echo esc_attr( $max ); ?>"
		data-layout="<?php echo esc_attr( $layout ); ?>"
	>
		<!-- Hidden input for row count (ACF format) -->
		<input 
			type="hidden" 
			name="<?php echo esc_attr( $field_name ); ?>" 
			value="<?php echo esc_attr( $row_count ); ?>"
			class="openfields-repeater-count"
		/>

		<!-- Rows Container -->
		<div class="openfields-repeater-rows openfields-repeater-layout-<?php echo esc_attr( $layout ); ?>">
			<?php
			for ( $i = 0; $i < $row_count; $i++ ) {
				openfields_render_repeater_row(
					$field,
					$sub_fields,
					$i,
					$field_name,
					$layout,
					$post_id
				);
			}
			?>
		</div>

		<!-- Actions -->
		<div class="openfields-repeater-actions">
			<button 
				type="button" 
				class="button openfields-repeater-add"
				<?php echo ( $max > 0 && $row_count >= $max ) ? 'disabled' : ''; ?>
			>
				<span class="dashicons dashicons-plus-alt2"></span>
				<?php echo esc_html( $button_label ); ?>
			</button>
		</div>

		<!-- Row Template (for JS cloning) -->
		<script type="text/template" id="<?php echo esc_attr( $unique_id ); ?>-template">
			<?php
			openfields_render_repeater_row(
				$field,
				$sub_fields,
				'__INDEX__',
				$field_name,
				$layout,
				$post_id,
				true // Is template.
			);
			?>
		</script>
	</div>
	<?php
}

/**
 * Render a single repeater row.
 *
 * @param object $field       Parent repeater field object.
 * @param array  $sub_fields  Sub-field objects.
 * @param int    $row_index   Row index (0-based).
 * @param string $field_name  Parent field name.
 * @param string $layout      Layout type.
 * @param int    $post_id     Post ID.
 * @param bool   $is_template Whether rendering as template.
 */
function openfields_render_repeater_row( $field, $sub_fields, $row_index, $field_name, $layout, $post_id, $is_template = false ) {
	$row_class = 'openfields-repeater-row';
	?>
	<div class="<?php echo esc_attr( $row_class ); ?>" data-row-index="<?php echo esc_attr( $row_index ); ?>">
		<!-- Row Handle & Actions Header -->
		<div class="openfields-repeater-row-header">
			<span class="openfields-repeater-row-handle" title="<?php esc_attr_e( 'Drag to reorder', 'openfields' ); ?>">
				<span class="dashicons dashicons-menu"></span>
			</span>
			<span class="openfields-repeater-row-number"><?php echo is_numeric( $row_index ) ? ( $row_index + 1 ) : ''; ?></span>
			<span class="openfields-repeater-row-spacer"></span>
			<button type="button" class="openfields-repeater-row-remove" title="<?php esc_attr_e( 'Remove row', 'openfields' ); ?>">
				<span class="dashicons dashicons-trash"></span>
			</button>
		</div>

		<!-- Row Content (Sub-fields) -->
		<div class="openfields-repeater-row-content">
			<?php
			foreach ( $sub_fields as $sub_field ) {
				openfields_render_repeater_subfield(
					$sub_field,
					$row_index,
					$field_name,
					$post_id,
					$is_template
				);
			}
			?>
		</div>
	</div>
	<?php
}

/**
 * Render a sub-field within a repeater row.
 *
 * @param object $sub_field   Sub-field object.
 * @param int    $row_index   Row index.
 * @param string $parent_name Parent repeater field name.
 * @param int    $post_id     Post ID.
 * @param bool   $is_template Whether rendering as template.
 */
function openfields_render_repeater_subfield( $sub_field, $row_index, $parent_name, $post_id, $is_template = false ) {
	// Parse sub-field settings.
	$settings = array();
	if ( ! empty( $sub_field->field_config ) ) {
		$decoded  = json_decode( $sub_field->field_config, true );
		$settings = is_array( $decoded ) ? $decoded : array();
	}

	// ACF-compatible field naming: parent_rowIndex_subfield.
	$sub_field_name = $parent_name . '_' . $row_index . '_' . $sub_field->name;
	$sub_field_id   = str_replace( array( '[', ']' ), '_', $sub_field_name );

	// Get value from postmeta (ACF format).
	$value = '';
	if ( ! $is_template && $post_id && is_numeric( $row_index ) ) {
		$meta_key = 'of_' . $parent_name . '_' . $row_index . '_' . $sub_field->name;
		$value    = get_post_meta( $post_id, $meta_key, true );

		// Fallback: Try ACF format without of_ prefix (for ACF migration).
		if ( $value === '' ) {
			$acf_meta_key = $parent_name . '_' . $row_index . '_' . $sub_field->name;
			$value        = get_post_meta( $post_id, $acf_meta_key, true );
		}
	}

	// Use default value if empty and not a template.
	if ( ! $is_template && $value === '' && ! empty( $sub_field->default_value ) ) {
		$value = $sub_field->default_value;
	}

	// Get width from settings.
	$width = isset( $settings['wrapper']['width'] ) ? intval( $settings['wrapper']['width'] ) : 100;
	$width = max( 10, min( 100, $width ) );
	?>
	<div class="openfields-repeater-subfield" style="width: <?php echo intval( $width ); ?>%;">
		<?php if ( ! empty( $sub_field->label ) ) : ?>
			<label for="<?php echo esc_attr( $sub_field_id ); ?>" class="openfields-repeater-subfield-label">
				<?php echo esc_html( $sub_field->label ); ?>
				<?php if ( ! empty( $sub_field->required ) ) : ?>
					<span class="openfields-field-required">*</span>
				<?php endif; ?>
			</label>
		<?php endif; ?>

		<div class="openfields-repeater-subfield-input">
			<?php
			// Render the sub-field input using the unified renderer.
			openfields_render_field_input(
				$sub_field,
				$value,
				$sub_field_id,
				$sub_field_name,
				$settings,
				$post_id
			);
			?>
		</div>

		<?php if ( ! empty( $sub_field->instructions ) ) : ?>
			<p class="openfields-field-description"><?php echo wp_kses_post( $sub_field->instructions ); ?></p>
		<?php endif; ?>
	</div>
	<?php
}

/**
 * Unified field input renderer.
 *
 * Renders any field type input. Supports nested repeaters recursively.
 *
 * @param object $field      Field database object.
 * @param mixed  $value      Current value.
 * @param string $field_id   HTML ID attribute.
 * @param string $field_name HTML name attribute (without of_ prefix for POST).
 * @param array  $settings   Field settings from JSON.
 * @param int    $post_id    Post ID.
 */
function openfields_render_field_input( $field, $value, $field_id, $field_name, $settings, $post_id ) {
	// For nested repeaters, render recursively.
	if ( $field->type === 'repeater' ) {
		openfields_render_repeater_field( $field, $value, $field_id, $field_name, $settings, $post_id );
		return;
	}

	// Standard field types.
	switch ( $field->type ) {
		case 'text':
			$placeholder = ! empty( $field->placeholder ) ? $field->placeholder : '';
			$max_length  = isset( $settings['max_length'] ) ? absint( $settings['max_length'] ) : '';
			echo '<input type="text" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" placeholder="' . esc_attr( $placeholder ) . '" class="widefat"';
			if ( $max_length ) {
				echo ' maxlength="' . esc_attr( $max_length ) . '"';
			}
			echo ' />';
			break;

		case 'email':
			$placeholder = ! empty( $field->placeholder ) ? $field->placeholder : '';
			echo '<input type="email" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" placeholder="' . esc_attr( $placeholder ) . '" class="widefat" />';
			break;

		case 'url':
			$placeholder = ! empty( $field->placeholder ) ? $field->placeholder : '';
			echo '<input type="url" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" placeholder="' . esc_attr( $placeholder ) . '" class="widefat" />';
			break;

		case 'number':
			$min         = isset( $settings['min'] ) ? $settings['min'] : '';
			$max         = isset( $settings['max'] ) ? $settings['max'] : '';
			$step        = isset( $settings['step'] ) ? $settings['step'] : 1;
			$placeholder = ! empty( $field->placeholder ) ? $field->placeholder : '';

			echo '<input type="number" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" class="widefat"';
			if ( $min !== '' ) {
				echo ' min="' . esc_attr( $min ) . '"';
			}
			if ( $max !== '' ) {
				echo ' max="' . esc_attr( $max ) . '"';
			}
			if ( $step !== '' ) {
				echo ' step="' . esc_attr( $step ) . '"';
			}
			if ( $placeholder ) {
				echo ' placeholder="' . esc_attr( $placeholder ) . '"';
			}
			echo ' />';
			break;

		case 'textarea':
			$rows        = isset( $settings['rows'] ) ? absint( $settings['rows'] ) : 4;
			$placeholder = ! empty( $field->placeholder ) ? $field->placeholder : '';
			echo '<textarea id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" rows="' . esc_attr( $rows ) . '" placeholder="' . esc_attr( $placeholder ) . '" class="widefat">' . esc_textarea( $value ) . '</textarea>';
			break;

		case 'select':
			$choices  = isset( $settings['choices'] ) ? $settings['choices'] : array();
			$multiple = isset( $settings['multiple'] ) ? (bool) $settings['multiple'] : false;
			$name_att = $multiple ? $field_name . '[]' : $field_name;

			echo '<select id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $name_att ) . '" class="widefat"' . ( $multiple ? ' multiple' : '' ) . '>';
			if ( ! $multiple ) {
				echo '<option value="">-- ' . esc_html__( 'Select', 'openfields' ) . ' --</option>';
			}
			foreach ( $choices as $choice ) {
				$choice_value = is_array( $choice ) ? ( $choice['value'] ?? '' ) : $choice;
				$choice_label = is_array( $choice ) ? ( $choice['label'] ?? $choice_value ) : $choice;
				$selected     = is_array( $value ) ? in_array( $choice_value, $value, true ) : ( $value === $choice_value );
				echo '<option value="' . esc_attr( $choice_value ) . '"' . selected( $selected, true, false ) . '>' . esc_html( $choice_label ) . '</option>';
			}
			echo '</select>';
			break;

		case 'radio':
			$choices = isset( $settings['choices'] ) ? $settings['choices'] : array();
			echo '<fieldset class="openfields-radio-group">';
			foreach ( $choices as $i => $choice ) {
				$choice_value = is_array( $choice ) ? ( $choice['value'] ?? '' ) : $choice;
				$choice_label = is_array( $choice ) ? ( $choice['label'] ?? $choice_value ) : $choice;
				$radio_id     = $field_id . '-' . $i;
				$checked      = $value === $choice_value;
				echo '<label for="' . esc_attr( $radio_id ) . '" class="openfields-radio-label">';
				echo '<input type="radio" id="' . esc_attr( $radio_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $choice_value ) . '"' . checked( $checked, true, false ) . ' />';
				echo esc_html( $choice_label );
				echo '</label>';
			}
			echo '</fieldset>';
			break;

		case 'checkbox':
			$choices = isset( $settings['choices'] ) ? $settings['choices'] : array();
			if ( empty( $choices ) ) {
				// Single checkbox.
				$checked = ! empty( $value );
				echo '<label for="' . esc_attr( $field_id ) . '" class="openfields-checkbox-label">';
				echo '<input type="checkbox" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="1"' . checked( $checked, true, false ) . ' />';
				echo '</label>';
			} else {
				// Multiple checkboxes.
				$values = is_array( $value ) ? $value : array();
				echo '<fieldset class="openfields-checkbox-group">';
				foreach ( $choices as $i => $choice ) {
					$choice_value = is_array( $choice ) ? ( $choice['value'] ?? '' ) : $choice;
					$choice_label = is_array( $choice ) ? ( $choice['label'] ?? $choice_value ) : $choice;
					$checkbox_id  = $field_id . '-' . $i;
					$checked      = in_array( $choice_value, $values, true );
					echo '<label for="' . esc_attr( $checkbox_id ) . '" class="openfields-checkbox-label">';
					echo '<input type="checkbox" id="' . esc_attr( $checkbox_id ) . '" name="' . esc_attr( $field_name ) . '[]" value="' . esc_attr( $choice_value ) . '"' . checked( $checked, true, false ) . ' />';
					echo esc_html( $choice_label );
					echo '</label>';
				}
				echo '</fieldset>';
			}
			break;

		case 'switch':
			$checked = ! empty( $value ) && $value !== '0';
			echo '<div class="openfields-switch-wrapper">';
			echo '<input type="hidden" name="' . esc_attr( $field_name ) . '" value="0" />';
			echo '<input type="checkbox" class="openfields-switch-input" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="1"' . checked( $checked, true, false ) . ' />';
			echo '<label class="openfields-switch-track" for="' . esc_attr( $field_id ) . '">';
			echo '<span class="openfields-switch-thumb"></span>';
			echo '</label>';
			echo '</div>';
			break;

		case 'date':
			echo '<input type="date" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" class="widefat" />';
			break;

		case 'datetime':
			echo '<input type="datetime-local" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" class="widefat" />';
			break;

		case 'color':
			echo '<input type="color" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ?: '#000000' ) . '" />';
			break;

		case 'image':
		case 'file':
			$attachment_id = absint( $value );
			echo '<input type="hidden" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $attachment_id ) . '" class="openfields-media-input" />';
			if ( $field->type === 'image' && $attachment_id ) {
				$img = wp_get_attachment_image_url( $attachment_id, 'thumbnail' );
				if ( $img ) {
					echo '<img src="' . esc_url( $img ) . '" class="openfields-media-preview" style="max-width: 100px; height: auto; margin-bottom: 8px; display: block;" />';
				}
			} elseif ( $field->type === 'file' && $attachment_id ) {
				echo '<span class="openfields-file-name">' . esc_html( basename( get_attached_file( $attachment_id ) ) ) . '</span><br />';
			}
			echo '<button type="button" class="button openfields-media-select">' . esc_html__( 'Select', 'openfields' ) . '</button>';
			if ( $attachment_id ) {
				echo ' <button type="button" class="button openfields-media-remove">' . esc_html__( 'Remove', 'openfields' ) . '</button>';
			}
			break;

		case 'wysiwyg':
			$editor_id = preg_replace( '/[^a-z0-9_]/', '', strtolower( $field_id ) );
			wp_editor( $value, $editor_id, array(
				'textarea_name' => $field_name,
				'textarea_rows' => 8,
				'media_buttons' => true,
				'teeny'         => false,
			) );
			break;

		default:
			// Allow custom field types.
			do_action( 'openfields_render_field_' . $field->type, $field, $value, $field_id, $field_name, $settings, $post_id );
	}
}

/**
 * Detect number of existing repeater rows from postmeta.
 *
 * @param int    $post_id    Post ID.
 * @param string $field_name Repeater field name.
 * @param array  $sub_fields Sub-field objects.
 * @return int Number of rows detected.
 */
function openfields_detect_repeater_rows( $post_id, $field_name, $sub_fields ) {
	if ( ! $post_id || empty( $sub_fields ) ) {
		return 0;
	}

	global $wpdb;

	// Get first sub-field name for detection.
	$first_sub = $sub_fields[0]->name;

	// Query for meta keys matching pattern: of_{field}_{index}_{subfield}.
	$pattern = 'of_' . $field_name . '_%_' . $first_sub;
	$keys    = $wpdb->get_col(
		$wpdb->prepare(
			"SELECT meta_key FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key LIKE %s",
			$post_id,
			$wpdb->esc_like( 'of_' . $field_name . '_' ) . '%' . $wpdb->esc_like( '_' . $first_sub )
		)
	);

	// Also check ACF format without of_ prefix.
	$acf_keys = $wpdb->get_col(
		$wpdb->prepare(
			"SELECT meta_key FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key LIKE %s AND meta_key NOT LIKE %s",
			$post_id,
			$wpdb->esc_like( $field_name . '_' ) . '%' . $wpdb->esc_like( '_' . $first_sub ),
			$wpdb->esc_like( 'of_' ) . '%'
		)
	);

	$keys = array_merge( $keys, $acf_keys );

	if ( empty( $keys ) ) {
		return 0;
	}

	// Extract indices.
	$indices = array();
	foreach ( $keys as $key ) {
		// Pattern: of_{field}_{index}_{subfield} or {field}_{index}_{subfield}.
		if ( preg_match( '/^(?:of_)?' . preg_quote( $field_name, '/' ) . '_(\d+)_/', $key, $matches ) ) {
			$indices[] = (int) $matches[1];
		}
	}

	if ( empty( $indices ) ) {
		return 0;
	}

	// Return max index + 1 (since indices are 0-based).
	return max( $indices ) + 1;
}
