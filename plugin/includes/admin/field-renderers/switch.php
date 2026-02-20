<?php
/**
 * Switch Field Renderer
 *
 * @package Codeideal_Open_Fields
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
function cofld_render_switch_field( $field, $value, $field_id, $field_name, $settings ) {
	$checked  = ! empty( $value );
	$on_text  = COFLD_Field_Settings::get_setting( $settings, 'on_text', 'Yes' );
	$off_text = COFLD_Field_Settings::get_setting( $settings, 'off_text', 'No' );
	?>
	<input 
		type="checkbox" 
		id="<?php echo esc_attr( $field_id ); ?>" 
		name="<?php echo esc_attr( $field_name ); ?>" 
		value="1" 
		class="cofld-switch-checkbox"
		<?php checked( $checked, true ); ?>
	/>
	<label for="<?php echo esc_attr( $field_id ); ?>" class="cofld-switch-container">
		<div><?php echo esc_html( $off_text ); ?></div>
		<div><?php echo esc_html( $on_text ); ?></div>
	</label>
	<?php
}
