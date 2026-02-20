<?php
/**
 * Gallery field renderer.
 *
 * Renders a gallery field with WordPress media library integration.
 * Supports multiple image selection, drag-and-drop reordering, and preview display.
 *
 * @package Codeideal_Open_Fields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Render gallery field.
 *
 * @param object $field      Field object.
 * @param mixed  $value      Current value (array of attachment IDs or comma-separated string).
 * @param string $field_id   Field HTML ID.
 * @param string $field_name Field HTML name.
 * @param array  $settings   Field settings.
 */
function cofld_render_gallery_field( $field, $value, $field_id, $field_name, $settings ) {
	// Normalize value to array.
	$attachment_ids = array();
	if ( is_array( $value ) ) {
		$attachment_ids = array_filter( array_map( 'absint', $value ) );
	} elseif ( is_string( $value ) && ! empty( $value ) ) {
		// Could be comma-separated or serialized.
		if ( strpos( $value, ',' ) !== false ) {
			$attachment_ids = array_filter( array_map( 'absint', explode( ',', $value ) ) );
		} else {
			$attachment_ids = array( absint( $value ) );
		}
	}

	$preview_size = isset( $settings['preview_size'] ) ? $settings['preview_size'] : 'thumbnail';
	$library      = isset( $settings['library'] ) ? $settings['library'] : 'all';
	$min          = isset( $settings['min'] ) ? absint( $settings['min'] ) : 0;
	$max          = isset( $settings['max'] ) ? absint( $settings['max'] ) : 0;
	$insert       = isset( $settings['insert'] ) ? $settings['insert'] : 'append';

	$has_images = ! empty( $attachment_ids );
	?>
	<div class="cofld-gallery-field" 
		 data-field-type="gallery"
		 data-library="<?php echo esc_attr( $library ); ?>"
		 data-min="<?php echo esc_attr( $min ); ?>"
		 data-max="<?php echo esc_attr( $max ); ?>"
		 data-insert="<?php echo esc_attr( $insert ); ?>"
		 data-preview-size="<?php echo esc_attr( $preview_size ); ?>">
		
		<!-- Hidden input for value storage (comma-separated IDs) -->
		<input type="hidden" 
			   id="<?php echo esc_attr( $field_id ); ?>" 
			   name="<?php echo esc_attr( $field_name ); ?>" 
			   value="<?php echo esc_attr( implode( ',', $attachment_ids ) ); ?>"
			   class="cofld-gallery-value" />

		<!-- Gallery preview grid -->
		<div class="cofld-gallery-grid <?php echo esc_attr( $has_images ? 'has-images' : 'no-images' ); ?>">
			<?php if ( $has_images ) : ?>
				<?php foreach ( $attachment_ids as $attachment_id ) : ?>
					<?php
					$image_url = wp_get_attachment_image_url( $attachment_id, $preview_size );
					$image_alt = get_post_meta( $attachment_id, '_wp_attachment_image_alt', true );
					if ( ! $image_url ) {
						continue;
					}
					?>
					<div class="cofld-gallery-item" data-attachment-id="<?php echo esc_attr( $attachment_id ); ?>">
						<div class="cofld-gallery-thumb">
							<img src="<?php echo esc_url( $image_url ); ?>" alt="<?php echo esc_attr( $image_alt ); ?>" />
						</div>
						<div class="cofld-gallery-item-actions">
							<button type="button" class="cofld-gallery-item-remove" title="<?php esc_attr_e( 'Remove', 'codeideal-open-fields' ); ?>">
								<span class="dashicons dashicons-no-alt"></span>
							</button>
						</div>
						<div class="cofld-gallery-item-drag" title="<?php esc_attr_e( 'Drag to reorder', 'codeideal-open-fields' ); ?>">
							<span class="dashicons dashicons-move"></span>
						</div>
					</div>
				<?php endforeach; ?>
			<?php endif; ?>

			<!-- Add button (shown inside grid) -->
			<div class="cofld-gallery-add-item">
				<button type="button" class="cofld-gallery-add" title="<?php esc_attr_e( 'Add Images', 'codeideal-open-fields' ); ?>">
					<span class="dashicons dashicons-plus-alt2"></span>
					<span class="cofld-gallery-add-text"><?php esc_html_e( 'Add', 'codeideal-open-fields' ); ?></span>
				</button>
			</div>
		</div>

		<?php if ( ! $has_images ) : ?>
		<!-- Empty state placeholder -->
		<div class="cofld-gallery-placeholder">
			<span class="dashicons dashicons-images-alt2"></span>
			<span class="cofld-gallery-placeholder-text"><?php esc_html_e( 'No images selected', 'codeideal-open-fields' ); ?></span>
			<button type="button" class="button cofld-gallery-select">
				<span class="dashicons dashicons-upload"></span>
				<?php esc_html_e( 'Add Images', 'codeideal-open-fields' ); ?>
			</button>
		</div>
		<?php endif; ?>

		<!-- Limits display -->
		<?php if ( $min > 0 || $max > 0 ) : ?>
		<div class="cofld-gallery-limits">
			<?php
			$count = count( $attachment_ids );
			if ( $min > 0 && $max > 0 ) {
				printf(
					/* translators: %1$d: current count, %2$d: min, %3$d: max */
					esc_html__( '%1$d images selected (min: %2$d, max: %3$d)', 'codeideal-open-fields' ),
					absint( $count ),
					absint( $min ),
					absint( $max )
				);
			} elseif ( $min > 0 ) {
				printf(
					/* translators: %1$d: current count, %2$d: min */
					esc_html__( '%1$d images selected (min: %2$d)', 'codeideal-open-fields' ),
					absint( $count ),
					absint( $min )
				);
			} elseif ( $max > 0 ) {
				printf(
					/* translators: %1$d: current count, %2$d: max */
					esc_html__( '%1$d images selected (max: %2$d)', 'codeideal-open-fields' ),
					absint( $count ),
					absint( $max )
				);
			}
			?>
		</div>
		<?php endif; ?>
	</div>
	<?php
}

// Register the renderer.
add_action( 'cofld_render_field_gallery', 'cofld_render_gallery_field', 10, 5 );
