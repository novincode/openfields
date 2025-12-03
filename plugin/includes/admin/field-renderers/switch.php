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
	<label class="openfields-switch-wrapper">
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
	<script>
		(function() {
			const checkbox = document.getElementById('<?php echo esc_js( $field_id ); ?>');
			if ( ! checkbox ) return;
			
			const updateSwitch = () => {
				const wrapper = checkbox.closest('.openfields-switch-wrapper');
				if ( ! wrapper ) return;
				
				const toggle = wrapper.querySelector('.openfields-switch-toggle');
				const label = wrapper.querySelector('.openfields-switch-label');
				
				if ( checkbox.checked ) {
					toggle.classList.add('active');
					label.textContent = <?php echo wp_json_encode( $on_text ); ?>;
				} else {
					toggle.classList.remove('active');
					label.textContent = <?php echo wp_json_encode( $off_text ); ?>;
				}
			};
			
			checkbox.addEventListener('change', updateSwitch);
			// Initial state
			updateSwitch();
		})();
	</script>
	<?php
}
