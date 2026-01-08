<?php
/**
 * User field renderer.
 *
 * Renders a searchable dropdown for selecting users.
 *
 * @package Codeideal_Open_Fields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Render user field.
 *
 * @param object $field      Field object.
 * @param mixed  $value      Current value (user ID or array of IDs).
 * @param string $field_id   Field HTML ID.
 * @param string $field_name Field HTML name.
 * @param array  $settings   Field settings.
 */
function cof_render_user_field( $field, $value, $field_id, $field_name, $settings ) {
	$multiple   = ! empty( $settings['multiple'] );
	$allow_null = ! empty( $settings['allow_null'] );
	$roles      = $settings['role'] ?? array();

	// Ensure roles is an array.
	if ( ! is_array( $roles ) ) {
		$roles = array_filter( array( $roles ) );
	}

	// Get selected users for display.
	$selected_users = array();
	if ( ! empty( $value ) ) {
		$ids = $multiple ? (array) $value : array( $value );
		foreach ( $ids as $user_id ) {
			$user = get_userdata( $user_id );
			if ( $user ) {
				$selected_users[] = array(
					'id'           => $user->ID,
					'display_name' => $user->display_name,
					'avatar'       => get_avatar_url( $user->ID, array( 'size' => 32 ) ),
				);
			}
		}
	}

	// Data attributes for JS.
	$data_attrs = array(
		'data-field-type' => 'user',
		'data-multiple'   => $multiple ? '1' : '0',
		'data-allow-null' => $allow_null ? '1' : '0',
		'data-roles'      => esc_attr( implode( ',', $roles ) ),
	);

	// Build escaped data attributes string.
	$data_parts = array();
	foreach ( $data_attrs as $key => $val ) {
		$data_parts[] = esc_attr( $key ) . '="' . esc_attr( $val ) . '"';
	}
	$data_string = implode( ' ', $data_parts );

	?>
	<?php // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $data_string is pre-escaped above. ?>
	<div class="cof-user-field" <?php echo $data_string; ?>>
		<?php if ( $multiple ) : ?>
			<input type="hidden" id="<?php echo esc_attr( $field_id ); ?>" name="<?php echo esc_attr( $field_name ); ?>" value="<?php echo esc_attr( implode( ',', array_column( $selected_users, 'id' ) ) ); ?>" />
		<?php else : ?>
			<input type="hidden" id="<?php echo esc_attr( $field_id ); ?>" name="<?php echo esc_attr( $field_name ); ?>" value="<?php echo esc_attr( $value ); ?>" />
		<?php endif; ?>

		<!-- Selected items display -->
		<div class="cof-selected-items">
			<?php foreach ( $selected_users as $user ) : ?>
				<div class="cof-selected-item" data-id="<?php echo esc_attr( $user['id'] ); ?>">
					<img src="<?php echo esc_url( $user['avatar'] ); ?>" alt="" class="cof-user-avatar" />
					<span class="cof-item-title"><?php echo esc_html( $user['display_name'] ); ?></span>
					<button type="button" class="cof-remove-item" title="<?php esc_attr_e( 'Remove', 'codeideal-open-fields' ); ?>">
						<span class="dashicons dashicons-no-alt"></span>
					</button>
				</div>
			<?php endforeach; ?>
		</div>

		<!-- Search input -->
		<div class="cof-search-container">
			<input 
				type="text" 
				class="cof-search-input" 
				placeholder="<?php esc_attr_e( 'Search users...', 'codeideal-open-fields' ); ?>"
				autocomplete="off"
			/>
			<div class="cof-search-results"></div>
		</div>
	</div>
	<?php
}

// Register the renderer.
add_action( 'cof_render_field_user', 'cof_render_user_field', 10, 5 );
