<?php
/**
 * Post Object field renderer.
 *
 * Renders a searchable dropdown for selecting posts.
 *
 * @package OpenFields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Render post object field.
 *
 * @param object $field      Field object.
 * @param mixed  $value      Current value (post ID or array of IDs).
 * @param string $field_id   Field HTML ID.
 * @param string $field_name Field HTML name.
 * @param array  $settings   Field settings.
 */
function openfields_render_post_object_field( $field, $value, $field_id, $field_name, $settings ) {
	$multiple   = ! empty( $settings['multiple'] );
	$allow_null = ! empty( $settings['allow_null'] );
	$post_types = $settings['post_type'] ?? array( 'post' );

	// Ensure post_types is an array.
	if ( ! is_array( $post_types ) ) {
		$post_types = array( $post_types );
	}

	// Get selected posts for display.
	$selected_posts = array();
	if ( ! empty( $value ) ) {
		$ids = $multiple ? (array) $value : array( $value );
		foreach ( $ids as $post_id ) {
			$post = get_post( $post_id );
			if ( $post ) {
				$selected_posts[] = array(
					'id'    => $post->ID,
					'title' => $post->post_title,
					'type'  => get_post_type_object( $post->post_type )->labels->singular_name ?? $post->post_type,
				);
			}
		}
	}

	// Data attributes for JS.
	$data_attrs = array(
		'data-field-type' => 'post_object',
		'data-multiple'   => $multiple ? '1' : '0',
		'data-allow-null' => $allow_null ? '1' : '0',
		'data-post-types' => esc_attr( implode( ',', $post_types ) ),
	);

	// Build escaped data attributes string.
	$data_parts = array();
	foreach ( $data_attrs as $key => $val ) {
		$data_parts[] = esc_attr( $key ) . '="' . esc_attr( $val ) . '"';
	}
	$data_string = implode( ' ', $data_parts );

	?>
	<?php // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $data_string is pre-escaped above. ?>
	<div class="openfields-post-object-field" <?php echo $data_string; ?>>
		<?php if ( $multiple ) : ?>
			<input type="hidden" id="<?php echo esc_attr( $field_id ); ?>" name="<?php echo esc_attr( $field_name ); ?>" value="<?php echo esc_attr( implode( ',', array_column( $selected_posts, 'id' ) ) ); ?>" />
		<?php else : ?>
			<input type="hidden" id="<?php echo esc_attr( $field_id ); ?>" name="<?php echo esc_attr( $field_name ); ?>" value="<?php echo esc_attr( $value ); ?>" />
		<?php endif; ?>

		<!-- Selected items display -->
		<div class="openfields-selected-items">
			<?php foreach ( $selected_posts as $post ) : ?>
				<div class="openfields-selected-item" data-id="<?php echo esc_attr( $post['id'] ); ?>">
					<span class="openfields-item-title"><?php echo esc_html( $post['title'] ); ?></span>
					<span class="openfields-item-type"><?php echo esc_html( $post['type'] ); ?></span>
					<button type="button" class="openfields-remove-item" title="<?php esc_attr_e( 'Remove', 'openfields' ); ?>">
						<span class="dashicons dashicons-no-alt"></span>
					</button>
				</div>
			<?php endforeach; ?>
		</div>

		<!-- Search input -->
		<div class="openfields-search-container">
			<input 
				type="text" 
				class="openfields-search-input" 
				placeholder="<?php esc_attr_e( 'Search...', 'openfields' ); ?>"
				autocomplete="off"
			/>
			<div class="openfields-search-results"></div>
		</div>
	</div>
	<?php
}

// Register the renderer.
add_action( 'openfields_render_field_post_object', 'openfields_render_post_object_field', 10, 5 );
