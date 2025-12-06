<?php
/**
 * Switch Field Renderer
 *
 * @package OpenFields
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Render a switch field
 *
 * @param object $field    Field object from database.
 * @param mixed  $value    Current field value.
 * @param string $field_id HTML field ID.
 * @param string $field_name HTML field name.
 * @param array  $settings Field settings array.
 */
function openfields_render_switch_field( $field, $value, $field_id, $field_name, $settings ) {
	$checked  = ! empty( $value );
	$on_text  = OpenFields_Field_Settings::get_setting( $settings, 'on_text', 'Yes' );
	$off_text = OpenFields_Field_Settings::get_setting( $settings, 'off_text', 'No' );
	
	$toggle_class = $checked ? 'openfields-switch-toggle active' : 'openfields-switch-toggle';
	?>
	<label class="openfields-switch-wrapper" data-on-text="<?php echo esc_attr( $on_text ); ?>" data-off-text="<?php echo esc_attr( $off_text ); ?>">
		<input 
			type="checkbox" 
			id="<?php echo esc_attr( $field_id ); ?>" 
			name="<?php echo esc_attr( $field_name ); ?>" 
			value="1" 
			class="openfields-switch-input"
			<?php checked( $checked, true ); ?>
		/>
		<span class="<?php echo esc_attr( $toggle_class ); ?>"></span>
		<span class="openfields-switch-label">
			<?php echo esc_html( $checked ? $on_text : $off_text ); ?>
		</span>
	</label>
	<?php
	// Enqueue the switch handler script once.
	openfields_enqueue_switch_script();
}

/**
 * Enqueue the switch field JavaScript handler.
 *
 * Uses a static flag to ensure the script is only enqueued once.
 *
 * @since 1.0.0
 */
function openfields_enqueue_switch_script() {
	static $enqueued = false;
	
	if ( $enqueued ) {
		return;
	}
	$enqueued = true;

	$inline_script = "
		(function() {
			document.addEventListener('DOMContentLoaded', function() {
				document.querySelectorAll('.openfields-switch-wrapper').forEach(function(wrapper) {
					var checkbox = wrapper.querySelector('.openfields-switch-input');
					if (!checkbox) return;
					
					var onText = wrapper.getAttribute('data-on-text') || 'Yes';
					var offText = wrapper.getAttribute('data-off-text') || 'No';
					
					var updateSwitch = function() {
						var toggle = wrapper.querySelector('.openfields-switch-toggle');
						var label = wrapper.querySelector('.openfields-switch-label');
						
						if (checkbox.checked) {
							toggle.classList.add('active');
							if (label) label.textContent = onText;
						} else {
							toggle.classList.remove('active');
							if (label) label.textContent = offText;
						}
					};
					
					checkbox.addEventListener('change', updateSwitch);
				});
			});
		})();
	";
	
	wp_register_script( 'openfields-switch-handler', false, array(), OPENFIELDS_VERSION, true );
	wp_enqueue_script( 'openfields-switch-handler' );
	wp_add_inline_script( 'openfields-switch-handler', $inline_script );
}
