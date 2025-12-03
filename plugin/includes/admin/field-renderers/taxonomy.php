<?php
/**
 * Taxonomy field renderer.
 *
 * Renders a dropdown/checkbox/radio for selecting taxonomy terms.
 *
 * @package OpenFields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Render taxonomy field.
 *
 * @param object $field      Field object.
 * @param mixed  $value      Current value (term ID or array of IDs).
 * @param string $field_id   Field HTML ID.
 * @param string $field_name Field HTML name.
 * @param array  $settings   Field settings.
 */
function openfields_render_taxonomy_field( $field, $value, $field_id, $field_name, $settings ) {
	$taxonomy   = $settings['taxonomy'] ?? 'category';
	$field_type = $settings['field_type'] ?? 'select';
	$multiple   = ! empty( $settings['multiple'] );
	$allow_null = true; // Taxonomies should always allow no selection.

	// Validate taxonomy.
	if ( ! taxonomy_exists( $taxonomy ) ) {
		echo '<p class="openfields-error">' . esc_html__( 'Invalid taxonomy.', 'openfields' ) . '</p>';
		return;
	}

	// Get all terms for this taxonomy.
	$terms = get_terms( array(
		'taxonomy'   => $taxonomy,
		'hide_empty' => false,
		'orderby'    => 'name',
		'order'      => 'ASC',
	) );

	if ( is_wp_error( $terms ) ) {
		echo '<p class="openfields-error">' . esc_html( $terms->get_error_message() ) . '</p>';
		return;
	}

	// Ensure value is array for comparison.
	$selected_values = $multiple ? (array) $value : array( $value );
	$selected_values = array_map( 'intval', array_filter( $selected_values ) );

	// Data attributes.
	$data_attrs = array(
		'data-field-type' => 'taxonomy',
		'data-taxonomy'   => $taxonomy,
		'data-multiple'   => $multiple ? '1' : '0',
	);

	$data_string = '';
	foreach ( $data_attrs as $key => $val ) {
		$data_string .= ' ' . $key . '="' . $val . '"';
	}

	switch ( $field_type ) {
		case 'checkbox':
			?>
			<div class="openfields-taxonomy-field openfields-taxonomy-checkbox" <?php echo $data_string; ?>>
				<fieldset>
					<?php foreach ( $terms as $term ) : ?>
						<label class="openfields-checkbox-label">
							<input 
								type="checkbox" 
								name="<?php echo esc_attr( $field_name ); ?>[]" 
								value="<?php echo esc_attr( $term->term_id ); ?>"
								<?php checked( in_array( $term->term_id, $selected_values, true ) ); ?>
							/>
							<?php echo esc_html( $term->name ); ?>
							<span class="openfields-term-count">(<?php echo esc_html( $term->count ); ?>)</span>
						</label>
					<?php endforeach; ?>
				</fieldset>
			</div>
			<?php
			break;

		case 'radio':
			?>
			<div class="openfields-taxonomy-field openfields-taxonomy-radio" <?php echo $data_string; ?>>
				<fieldset>
					<?php if ( $allow_null ) : ?>
						<label class="openfields-radio-label">
							<input 
								type="radio" 
								name="<?php echo esc_attr( $field_name ); ?>" 
								value=""
								<?php checked( empty( $selected_values ) ); ?>
							/>
							<?php esc_html_e( '— None —', 'openfields' ); ?>
						</label>
					<?php endif; ?>
					<?php foreach ( $terms as $term ) : ?>
						<label class="openfields-radio-label">
							<input 
								type="radio" 
								name="<?php echo esc_attr( $field_name ); ?>" 
								value="<?php echo esc_attr( $term->term_id ); ?>"
								<?php checked( in_array( $term->term_id, $selected_values, true ) ); ?>
							/>
							<?php echo esc_html( $term->name ); ?>
							<span class="openfields-term-count">(<?php echo esc_html( $term->count ); ?>)</span>
						</label>
					<?php endforeach; ?>
				</fieldset>
			</div>
			<?php
			break;

		case 'select':
		default:
			?>
			<div class="openfields-taxonomy-field openfields-taxonomy-select" <?php echo $data_string; ?>>
				<select 
					id="<?php echo esc_attr( $field_id ); ?>" 
					name="<?php echo esc_attr( $field_name ); ?><?php echo $multiple ? '[]' : ''; ?>"
					class="widefat openfields-searchable-select"
					<?php echo $multiple ? 'multiple' : ''; ?>
				>
					<?php if ( ! $multiple ) : ?>
						<option value=""><?php esc_html_e( '— Select —', 'openfields' ); ?></option>
					<?php endif; ?>
					<?php foreach ( $terms as $term ) : ?>
						<option 
							value="<?php echo esc_attr( $term->term_id ); ?>"
							<?php selected( in_array( $term->term_id, $selected_values, true ) ); ?>
						>
							<?php echo esc_html( $term->name ); ?> (<?php echo esc_html( $term->count ); ?>)
						</option>
					<?php endforeach; ?>
				</select>
			</div>
			<?php
			break;
	}
}

// Register the renderer.
add_action( 'openfields_render_field_taxonomy', 'openfields_render_taxonomy_field', 10, 5 );
