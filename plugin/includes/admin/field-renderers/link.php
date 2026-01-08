<?php
/**
 * Link field renderer.
 *
 * Renders a link field with URL, title, and target options.
 *
 * @package Codeideal_Open_Fields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Render link field.
 *
 * @param object $field      Field object.
 * @param mixed  $value      Current value (array with url, title, target).
 * @param string $field_id   Field HTML ID.
 * @param string $field_name Field HTML name.
 * @param array  $settings   Field settings.
 */
function cof_render_link_field( $field, $value, $field_id, $field_name, $settings ) {
	// Parse value.
	$link_data = array(
		'url'    => '',
		'title'  => '',
		'target' => '',
	);

	if ( is_array( $value ) ) {
		$link_data = wp_parse_args( $value, $link_data );
	} elseif ( is_string( $value ) && ! empty( $value ) ) {
		// Maybe it's just a URL string.
		$link_data['url'] = $value;
	}

	$show_title  = ! isset( $settings['show_title'] ) || $settings['show_title'];
	$show_target = ! isset( $settings['show_target'] ) || $settings['show_target'];

	?>
	<div class="cof-link-field" data-field-type="link">
		<!-- URL Input -->
		<div class="cof-link-row">
			<label class="cof-link-label">
				<span class="dashicons dashicons-admin-links"></span>
				<?php esc_html_e( 'URL', 'codeideal-open-fields' ); ?>
			</label>
			<input 
				type="url" 
				id="<?php echo esc_attr( $field_id ); ?>_url"
				name="<?php echo esc_attr( $field_name ); ?>[url]" 
				value="<?php echo esc_url( $link_data['url'] ); ?>"
				class="widefat cof-link-url"
				placeholder="<?php esc_attr_e( 'https://example.com', 'codeideal-open-fields' ); ?>"
			/>
		</div>

		<?php if ( $show_title ) : ?>
		<!-- Title Input -->
		<div class="cof-link-row">
			<label class="cof-link-label">
				<?php esc_html_e( 'Link Text', 'codeideal-open-fields' ); ?>
			</label>
			<input 
				type="text" 
				id="<?php echo esc_attr( $field_id ); ?>_title"
				name="<?php echo esc_attr( $field_name ); ?>[title]" 
				value="<?php echo esc_attr( $link_data['title'] ); ?>"
				class="widefat cof-link-title"
				placeholder="<?php esc_attr_e( 'Link text', 'codeideal-open-fields' ); ?>"
			/>
		</div>
		<?php endif; ?>

		<?php if ( $show_target ) : ?>
		<!-- Target Checkbox -->
		<div class="cof-link-row cof-link-target-row">
			<label class="cof-checkbox-inline">
				<input 
					type="checkbox" 
					id="<?php echo esc_attr( $field_id ); ?>_target"
					name="<?php echo esc_attr( $field_name ); ?>[target]" 
					value="_blank"
					<?php checked( $link_data['target'], '_blank' ); ?>
				/>
				<?php esc_html_e( 'Open in new tab', 'codeideal-open-fields' ); ?>
			</label>
		</div>
		<?php endif; ?>
	</div>
	<?php
}

// Register the renderer.
add_action( 'cof_render_field_link', 'cof_render_link_field', 10, 5 );
