<?php
/**
 * File field renderer.
 *
 * Renders a file field with WordPress media library integration.
 * Supports file type restrictions and return format options.
 *
 * @package OpenFields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Render file field.
 *
 * @param object $field      Field object.
 * @param mixed  $value      Current value (attachment ID).
 * @param string $field_id   Field HTML ID.
 * @param string $field_name Field HTML name.
 * @param array  $settings   Field settings.
 */
function openfields_render_file_field( $field, $value, $field_id, $field_name, $settings ) {
	$attachment_id = absint( $value );
	$library       = isset( $settings['library'] ) ? $settings['library'] : 'all';
	$mime_types    = isset( $settings['mime_types'] ) ? $settings['mime_types'] : '';
	$min_size      = isset( $settings['min_size'] ) ? $settings['min_size'] : '';
	$max_size      = isset( $settings['max_size'] ) ? $settings['max_size'] : '';

	// Get file data if we have an attachment.
	$file_url      = '';
	$file_name     = '';
	$file_size     = '';
	$file_type     = '';
	$file_icon     = 'dashicons-media-default';

	if ( $attachment_id ) {
		$file_path = get_attached_file( $attachment_id );
		$file_url  = wp_get_attachment_url( $attachment_id );
		$file_name = basename( $file_path );
		$mime_type = get_post_mime_type( $attachment_id );

		if ( $file_path && file_exists( $file_path ) ) {
			$file_size = size_format( filesize( $file_path ) );
		}

		// Determine icon based on mime type.
		if ( strpos( $mime_type, 'image/' ) === 0 ) {
			$file_icon = 'dashicons-format-image';
		} elseif ( strpos( $mime_type, 'video/' ) === 0 ) {
			$file_icon = 'dashicons-video-alt3';
		} elseif ( strpos( $mime_type, 'audio/' ) === 0 ) {
			$file_icon = 'dashicons-format-audio';
		} elseif ( strpos( $mime_type, 'application/pdf' ) === 0 ) {
			$file_icon = 'dashicons-pdf';
		} elseif ( strpos( $mime_type, 'application/zip' ) === 0 || strpos( $mime_type, 'application/x-' ) === 0 ) {
			$file_icon = 'dashicons-media-archive';
		} elseif ( strpos( $mime_type, 'text/' ) === 0 ) {
			$file_icon = 'dashicons-media-text';
		} elseif ( strpos( $mime_type, 'application/vnd' ) === 0 || strpos( $mime_type, 'application/msword' ) === 0 ) {
			$file_icon = 'dashicons-media-document';
		} elseif ( strpos( $mime_type, 'spreadsheet' ) !== false || strpos( $mime_type, 'excel' ) !== false ) {
			$file_icon = 'dashicons-media-spreadsheet';
		}

		// Get short mime type for display.
		$mime_parts = explode( '/', $mime_type );
		$file_type  = strtoupper( end( $mime_parts ) );
	}

	$has_file = ! empty( $file_url );
	?>
	<div class="openfields-file-field" 
		 data-field-type="file"
		 data-library="<?php echo esc_attr( $library ); ?>"
		 data-mime-types="<?php echo esc_attr( $mime_types ); ?>"
		 data-min-size="<?php echo esc_attr( $min_size ); ?>"
		 data-max-size="<?php echo esc_attr( $max_size ); ?>">
		
		<!-- Hidden input for value storage -->
		<input type="hidden" 
			   id="<?php echo esc_attr( $field_id ); ?>" 
			   name="<?php echo esc_attr( $field_name ); ?>" 
			   value="<?php echo esc_attr( $attachment_id ); ?>"
			   class="openfields-file-value" />

		<!-- File info container -->
		<div class="openfields-file-info <?php echo $has_file ? 'has-file' : 'no-file'; ?>">
			<?php if ( $has_file ) : ?>
				<div class="openfields-file-preview">
					<span class="openfields-file-icon dashicons <?php echo esc_attr( $file_icon ); ?>"></span>
					<div class="openfields-file-details">
						<a href="<?php echo esc_url( $file_url ); ?>" 
						   target="_blank" 
						   class="openfields-file-name"
						   title="<?php esc_attr_e( 'Open in new tab', 'openfields' ); ?>">
							<?php echo esc_html( $file_name ); ?>
						</a>
						<div class="openfields-file-meta">
							<?php if ( $file_type ) : ?>
								<span class="openfields-file-type"><?php echo esc_html( $file_type ); ?></span>
							<?php endif; ?>
							<?php if ( $file_size ) : ?>
								<span class="openfields-file-size"><?php echo esc_html( $file_size ); ?></span>
							<?php endif; ?>
						</div>
					</div>
				</div>
			<?php else : ?>
				<div class="openfields-file-placeholder">
					<span class="dashicons dashicons-media-default"></span>
					<span class="openfields-file-placeholder-text"><?php esc_html_e( 'No file selected', 'openfields' ); ?></span>
				</div>
			<?php endif; ?>
		</div>

		<!-- Action buttons -->
		<div class="openfields-file-actions">
			<button type="button" class="button openfields-file-select <?php echo $has_file ? 'hidden' : ''; ?>">
				<span class="dashicons dashicons-upload"></span>
				<?php esc_html_e( 'Select File', 'openfields' ); ?>
			</button>
			
			<button type="button" class="button openfields-file-change <?php echo $has_file ? '' : 'hidden'; ?>">
				<span class="dashicons dashicons-edit"></span>
				<?php esc_html_e( 'Change', 'openfields' ); ?>
			</button>
			
			<button type="button" class="button openfields-file-remove <?php echo $has_file ? '' : 'hidden'; ?>">
				<span class="dashicons dashicons-trash"></span>
				<?php esc_html_e( 'Remove', 'openfields' ); ?>
			</button>
		</div>
	</div>
	<?php
}

// Register the renderer.
add_action( 'openfields_render_field_file', 'openfields_render_file_field', 10, 5 );
