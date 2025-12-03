/**
 * Type-Specific Settings Component
 * 
 * Renders settings specific to each field type.
 * Uses the field registry to find and render the appropriate settings component.
 * Also includes GeneralFieldSettings that apply to ALL field types.
 *
 * @package OpenFields
 */

import { fieldRegistry } from '../../../lib/field-registry';
import { GeneralFieldSettings } from '../../../fields/GeneralFieldSettings';
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
	
	return (
		<>
			{/* General Settings - Apply to ALL fields */}
			<div className="border-t pt-4">
				<h4 className="text-sm font-medium mb-3">General Settings</h4>
				<GeneralFieldSettings
					field={field}
					onSettingsChange={onSettingsChange}
				/>
			</div>

			{/* Type-Specific Settings */}
			{SettingsComponent && (
				<div className="border-t pt-4">
					<h4 className="text-sm font-medium mb-3 capitalize">{field.type} Settings</h4>
					<SettingsComponent
						field={field}
						onSettingsChange={onSettingsChange}
					/>
				</div>
			)}
		</>
	);
}

