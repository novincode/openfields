/**
 * OpenFields Gutenberg Block
 *
 * A block to display custom field values in the block editor.
 *
 * @package OpenFields
 */

( function( wp ) {
	'use strict';

	const { registerBlockType } = wp.blocks;
	const { createElement: el, Fragment } = wp.element;
	const { InspectorControls, useBlockProps } = wp.blockEditor;
	const { PanelBody, SelectControl, TextControl, ToggleControl, Placeholder, Spinner } = wp.components;
	const ServerSideRender = wp.serverSideRender;
	const { __ } = wp.i18n;

	// Get available fields from localized data.
	const availableFields = window.cofldBlock?.fields || [];

	// Group fields by fieldset.
	const groupedFields = availableFields.reduce( ( groups, field ) => {
		const group = field.fieldset || __( 'Ungrouped', 'openfields' );
		if ( ! groups[ group ] ) {
			groups[ group ] = [];
		}
		groups[ group ].push( field );
		return groups;
	}, {} );

	// Create options for SelectControl.
	const fieldOptions = [ { value: '', label: __( '— Select a field —', 'openfields' ) } ];
	Object.keys( groupedFields ).forEach( ( group ) => {
		groupedFields[ group ].forEach( ( field ) => {
			fieldOptions.push( {
				value: field.value,
				label: group + ': ' + field.label,
			} );
		} );
	} );

	// Format options.
	const formatOptions = [
		{ value: 'text', label: __( 'Plain Text', 'openfields' ) },
		{ value: 'html', label: __( 'HTML', 'openfields' ) },
		{ value: 'link', label: __( 'Link', 'openfields' ) },
		{ value: 'image', label: __( 'Image', 'openfields' ) },
	];

	registerBlockType( 'openfields/field', {
		title: __( 'OpenFields Field', 'openfields' ),
		description: __( 'Display a custom field value.', 'openfields' ),
		category: 'widgets',
		icon: 'forms',
		keywords: [ 'field', 'custom', 'meta', 'acf', 'openfields' ],
		supports: {
			html: false,
			align: true,
		},

		edit: function( props ) {
			const { attributes, setAttributes } = props;
			const { fieldName, fieldLabel, showLabel, format, className } = attributes;
			const blockProps = useBlockProps();

			// Find selected field info.
			const selectedField = availableFields.find( ( f ) => f.value === fieldName );

			// Auto-set label from field when field changes.
			const onFieldChange = ( value ) => {
				setAttributes( { fieldName: value } );
				const field = availableFields.find( ( f ) => f.value === value );
				if ( field && ! fieldLabel ) {
					setAttributes( { fieldLabel: field.label.split( ' (' )[ 0 ] } );
				}
			};

			return el(
				Fragment,
				{},
				el(
					InspectorControls,
					{},
					el(
						PanelBody,
						{ title: __( 'Field Settings', 'openfields' ), initialOpen: true },
						el( SelectControl, {
							label: __( 'Field', 'openfields' ),
							value: fieldName,
							options: fieldOptions,
							onChange: onFieldChange,
							help: selectedField ? __( 'Type: ', 'openfields' ) + selectedField.type : '',
						} ),
						el( TextControl, {
							label: __( 'Label', 'openfields' ),
							value: fieldLabel,
							onChange: ( value ) => setAttributes( { fieldLabel: value } ),
							help: __( 'Label shown above the field value.', 'openfields' ),
						} ),
						el( ToggleControl, {
							label: __( 'Show Label', 'openfields' ),
							checked: showLabel,
							onChange: ( value ) => setAttributes( { showLabel: value } ),
						} ),
						el( SelectControl, {
							label: __( 'Format', 'openfields' ),
							value: format,
							options: formatOptions,
							onChange: ( value ) => setAttributes( { format: value } ),
							help: __( 'How to display the field value.', 'openfields' ),
						} )
					)
				),
				el(
					'div',
					blockProps,
					fieldName
						? el( ServerSideRender, {
								block: 'openfields/field',
								attributes: attributes,
								EmptyResponsePlaceholder: function() {
									return el(
										'div',
										{ className: 'cofld-block-placeholder cofld-block-empty' },
										__( 'No value found for this field.', 'openfields' )
									);
								},
						  } )
						: el(
								'div',
								{ className: 'cofld-block-placeholder' },
								el( 'span', { className: 'dashicons dashicons-forms' } ),
								el( 'p', {}, __( 'Select a field from the sidebar.', 'openfields' ) )
						  )
				)
			);
		},

		save: function() {
			// Dynamic block - rendered on server.
			return null;
		},
	} );
} )( window.wp );
