<?php
/**
 * Image field renderer.
 *
 * Renders an image field with WordPress media library integration.
 * Supports preview size selection, return format options, and preview display.
 *
 * @package OpenFields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Render image field.
 *
 * @param object $field      Field object.
 * @param mixed  $value      Current value (attachment ID).
 * @param string $field_id   Field HTML ID.
 * @param string $field_name Field HTML name.
 * @param array  $settings   Field settings.
 */
function openfields_render_image_field( $field, $value, $field_id, $field_name, $settings ) {
	$attachment_id  = absint( $value );
	$preview_size   = isset( $settings['preview_size'] ) ? $settings['preview_size'] : 'medium';
	$library        = isset( $settings['library'] ) ? $settings['library'] : 'all';
	$min_width      = isset( $settings['min_width'] ) ? absint( $settings['min_width'] ) : 0;
	$min_height     = isset( $settings['min_height'] ) ? absint( $settings['min_height'] ) : 0;
	$max_width      = isset( $settings['max_width'] ) ? absint( $settings['max_width'] ) : 0;
	$max_height     = isset( $settings['max_height'] ) ? absint( $settings['max_height'] ) : 0;

	// Get image data if we have an attachment.
	$image_url  = '';
	$image_alt  = '';
	$image_name = '';

	if ( $attachment_id ) {
		$image_url  = wp_get_attachment_image_url( $attachment_id, $preview_size );
		$image_alt  = get_post_meta( $attachment_id, '_wp_attachment_image_alt', true );
		$image_name = get_the_title( $attachment_id );
	}

	$has_image = ! empty( $image_url );
	?>
	<div class="openfields-image-field" 
		 data-field-type="image"
		 data-library="<?php echo esc_attr( $library ); ?>"
		 data-min-width="<?php echo esc_attr( $min_width ); ?>"
		 data-min-height="<?php echo esc_attr( $min_height ); ?>"
		 data-max-width="<?php echo esc_attr( $max_width ); ?>"
		 data-max-height="<?php echo esc_attr( $max_height ); ?>">
		
		<!-- Hidden input for value storage -->
		<input type="hidden" 
			   id="<?php echo esc_attr( $field_id ); ?>" 
			   name="<?php echo esc_attr( $field_name ); ?>" 
			   value="<?php echo esc_attr( $attachment_id ); ?>"
			   class="openfields-image-value" />

		<!-- Preview container -->
		<div class="openfields-image-preview <?php echo $has_image ? 'has-image' : 'no-image'; ?>">
			<?php if ( $has_image ) : ?>
				<img src="<?php echo esc_url( $image_url ); ?>" 
					 alt="<?php echo esc_attr( $image_alt ); ?>" 
					 class="openfields-image-thumb" />
				<div class="openfields-image-info">
					<span class="openfields-image-name"><?php echo esc_html( $image_name ); ?></span>
				</div>
			<?php else : ?>
				<div class="openfields-image-placeholder">
					<span class="dashicons dashicons-format-image"></span>
					<span class="openfields-image-placeholder-text"><?php esc_html_e( 'No image selected', 'openfields' ); ?></span>
				</div>
			<?php endif; ?>
		</div>

		<!-- Action buttons -->
		<div class="openfields-image-actions">
			<button type="button" class="button openfields-image-select <?php echo $has_image ? 'hidden' : ''; ?>">
				<span class="dashicons dashicons-upload"></span>
				<?php esc_html_e( 'Select Image', 'openfields' ); ?>
			</button>
			
			<button type="button" class="button openfields-image-change <?php echo $has_image ? '' : 'hidden'; ?>">
				<span class="dashicons dashicons-edit"></span>
				<?php esc_html_e( 'Change', 'openfields' ); ?>
			</button>
			
			<button type="button" class="button openfields-image-remove <?php echo $has_image ? '' : 'hidden'; ?>">
				<span class="dashicons dashicons-trash"></span>
				<?php esc_html_e( 'Remove', 'openfields' ); ?>
			</button>
		</div>
	</div>
	<?php
}

// Register the renderer.
add_action( 'openfields_render_field_image', 'openfields_render_image_field', 10, 5 );
