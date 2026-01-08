<?php
/**
 * Group Field Renderer
 *
 * Renders group fields with sub-fields in ACF-compatible data storage format.
 * Groups are like repeaters but without repetition - just a single container for sub-fields.
 *
 * ACF Data Format:
 * - {field_name}_{subfield} = value
 *
 * @package Codeideal_Open_Fields
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Render a group field.
 *
 * @param object $field       Field object from database.
 * @param mixed  $value       Current value (unused for groups, sub-fields have their own values).
 * @param string $field_id    HTML field ID.
 * @param string $base_name   Base name for this group.
 * @param array  $settings    Field settings array.
 * @param int    $object_id   Object ID (post, term, or user ID).
 * @param string $object_type Object type: 'post', 'term', or 'user'.
 */
function cof_render_group_field( $field, $value, $field_id, $base_name, $settings, $object_id, $object_type = 'post' ) {
	global $wpdb;

	// Get sub-fields for this group.
	$sub_fields = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT * FROM {$wpdb->prefix}cof_fields WHERE parent_id = %d ORDER BY menu_order ASC",
			$field->id
		)
	);

	if ( empty( $sub_fields ) ) {
		echo '<p class="description">' . esc_html__( 'No sub-fields configured for this group.', 'codeideal-open-fields' ) . '</p>';
		return;
	}

	// Get layout setting.
	$layout = isset( $settings['layout'] ) ? $settings['layout'] : 'block';

	$unique_id = 'group-' . sanitize_key( $base_name ) . '-' . wp_rand( 1000, 9999 );
	?>
	<div 
		class="cof-group"
		id="<?php echo esc_attr( $unique_id ); ?>"
		data-name="<?php echo esc_attr( $base_name ); ?>"
		data-layout="<?php echo esc_attr( $layout ); ?>"
	>
		<div class="cof-group-content" data-layout="<?php echo esc_attr( $layout ); ?>">
			<?php
			foreach ( $sub_fields as $sub_field ) {
				cof_render_group_subfield( $sub_field, $base_name, $object_id, $object_type );
			}
			?>
		</div>
	</div>
	<?php
}

/**
 * Render a single group sub-field.
 *
 * @param object $sub_field    Sub-field object from database.
 * @param string $parent_name  Parent group name.
 * @param int    $object_id    Object ID (post, term, or user ID).
 * @param string $object_type  Object type: 'post', 'term', or 'user'.
 */
function cof_render_group_subfield( $sub_field, $parent_name, $object_id, $object_type = 'post' ) {
	// Get the raw sub-field name (strip parent prefix if present in database).
	$raw_sub_name = cof_get_raw_group_subfield_name( $sub_field->name, $parent_name );
	
	// Sub-field meta key: {parent}_{subfield}
	$sub_meta_key = $parent_name . '_' . $raw_sub_name;
	
	// Get value based on object type.
	switch ( $object_type ) {
		case 'term':
			$sub_value = get_term_meta( $object_id, $sub_meta_key, true );
			break;
		case 'user':
			$sub_value = get_user_meta( $object_id, $sub_meta_key, true );
			break;
		case 'post':
		default:
			$sub_value = get_post_meta( $object_id, $sub_meta_key, true );
			break;
	}

	// Get settings.
	$sub_settings = array();
	if ( ! empty( $sub_field->field_config ) ) {
		$decoded      = json_decode( $sub_field->field_config, true );
		$sub_settings = is_array( $decoded ) ? $decoded : array();
	}

	// Get wrapper config.
	$wrapper_config = array();
	if ( ! empty( $sub_field->wrapper_config ) ) {
		$decoded        = json_decode( $sub_field->wrapper_config, true );
		$wrapper_config = is_array( $decoded ) ? $decoded : array();
	}

	// Get conditional logic.
	$conditional_logic = array();
	if ( ! empty( $sub_field->conditional_logic ) ) {
		$decoded           = json_decode( $sub_field->conditional_logic, true );
		$conditional_logic = is_array( $decoded ) ? $decoded : array();
	}

	// Calculate wrapper width.
	$wrapper_width = isset( $wrapper_config['width'] ) ? intval( $wrapper_config['width'] ) : 100;
	$wrapper_width = max( 10, min( 100, $wrapper_width ) );
	$wrapper_class = isset( $wrapper_config['class'] ) ? sanitize_html_class( $wrapper_config['class'] ) : '';
	$wrapper_id    = isset( $wrapper_config['id'] ) ? sanitize_html_class( $wrapper_config['id'] ) : '';

	?>
	<div class="cof-group-subfield cof-field-wrapper cof-field-wrapper--width-<?php echo intval( $wrapper_width ); ?><?php echo $wrapper_class ? ' ' . esc_attr( $wrapper_class ) : ''; ?>" 
		style="--of-field-width: <?php echo intval( $wrapper_width ); ?>%;"
		data-width="<?php echo intval( $wrapper_width ); ?>"
		data-subfield-name="<?php echo esc_attr( $sub_field->name ); ?>"
		<?php if ( ! empty( $sub_field->id ) ) : ?>
			data-field-id="<?php echo esc_attr( $sub_field->id ); ?>"
		<?php endif; ?>
		<?php if ( $wrapper_id ) : ?>
			id="<?php echo esc_attr( $wrapper_id ); ?>"
		<?php endif; ?>
		<?php if ( ! empty( $conditional_logic ) ) : ?>
			data-conditional-logic="<?php echo esc_attr( wp_json_encode( $conditional_logic ) ); ?>"
			data-conditional-status="hidden"
		<?php endif; ?>
	>
		<?php if ( ! empty( $sub_field->label ) ) : ?>
			<div class="cof-field-label">
				<label for="<?php echo esc_attr( $sub_meta_key ); ?>">
					<?php echo esc_html( $sub_field->label ); ?>
					<?php if ( ! empty( $sub_settings['required'] ) || ! empty( $sub_field->required ) ) : ?>
						<span class="cof-field-required" aria-label="required">*</span>
					<?php endif; ?>
				</label>
			</div>
		<?php endif; ?>

		<div class="cof-field-input">
			<?php
			cof_render_group_subfield_input( $sub_field, $sub_value, $sub_meta_key, $sub_meta_key, $sub_settings, $object_id, $object_type, $parent_name );
			?>
		</div>

		<?php if ( ! empty( $sub_settings['instructions'] ) || ! empty( $sub_field->instructions ) ) : ?>
			<p class="cof-field-description">
				<?php echo wp_kses_post( $sub_settings['instructions'] ?? $sub_field->instructions ); ?>
			</p>
		<?php endif; ?>
	</div>
	<?php
}

/**
 * Get raw sub-field name without parent prefix.
 *
 * Sub-fields in the database are stored with parent prefix (e.g., "group_subfield").
 * For ACF-compatible data format, we need the raw name (e.g., "subfield").
 *
 * @since 1.0.0
 * @param string $sub_field_name Full sub-field name from database.
 * @param string $parent_name    Parent group name.
 * @return string Raw sub-field name.
 */
function cof_get_raw_group_subfield_name( $sub_field_name, $parent_name ) {
	// If the sub-field name starts with parent name + underscore, strip it.
	$prefix = $parent_name . '_';
	if ( strpos( $sub_field_name, $prefix ) === 0 ) {
		return substr( $sub_field_name, strlen( $prefix ) );
	}
	return $sub_field_name;
}

/**
 * Render the input for a group sub-field.
 *
 * Delegates to the centralized COF_Field_Renderer class for consistency.
 *
 * @param object $sub_field    Sub-field object.
 * @param mixed  $value        Current value.
 * @param string $field_id     HTML ID attribute.
 * @param string $field_name   HTML name attribute.
 * @param array  $settings     Field settings.
 * @param int    $object_id    Object ID.
 * @param string $object_type  Object type.
 * @param string $parent_name  Parent group name.
 */
function cof_render_group_subfield_input( $sub_field, $value, $field_id, $field_name, $settings, $object_id, $object_type, $parent_name ) {
	// Get the raw sub-field name for proper nesting.
	$raw_sub_name = cof_get_raw_group_subfield_name( $sub_field->name, $parent_name );
	
	// Use the centralized field renderer.
	$context = array(
		'object_id'   => $object_id,
		'object_type' => $object_type,
		'parent_name' => $parent_name . '_' . $raw_sub_name,
	);

	cof_render_field( $sub_field, $value, $field_id, $field_name, $settings, $context );
}
