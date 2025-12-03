/**
 * Type-Specific Settings Component
 * 
 * Renders settings specific to each field type.
 * Uses the field registry to find and render the appropriate settings component.
 *
 * @package OpenFields
 */

import { fieldRegistry } from '../../../lib/field-registry';
import type { Field } from '../../../types';

interface TypeSpecificSettingsProps {
	field: Field;
	onSettingsChange: (settings: Record<string, unknown>) => void;
}

export function TypeSpecificSettings({
	field,
	onSettingsChange,
}: TypeSpecificSettingsProps) {
	// Direct call to singleton registry - not a hook, so no hook ordering issues
	const SettingsComponent = fieldRegistry.getSettingsComponent(field.type);
	
	if (!SettingsComponent) {
		// No custom settings for this field type yet
		return null;
	}
	
	return (
		<div className="border-t pt-4">
			<h4 className="text-sm font-medium mb-3 capitalize">{field.type} Settings</h4>
			<SettingsComponent
				field={field}
				onSettingsChange={onSettingsChange}
			/>
		</div>
	);
}

