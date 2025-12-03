/**
 * Settings Section Component
 * 
 * Handles fieldset-level settings like active status, slug, and description.
 *
 * @package OpenFields
 */

import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';

interface SettingsSectionProps {
	isActive: boolean;
	slug: string;
	description: string;
	onActiveChange: (value: boolean) => void;
	onSlugChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
}

export function SettingsSection({
	isActive,
	slug,
	description,
	onActiveChange,
	onSlugChange,
	onDescriptionChange,
}: SettingsSectionProps) {
	return (
		<div className="mb-8">
			<h2 className="text-lg font-semibold mb-4">Settings</h2>
			<Card className="p-4">
				<div className="space-y-4">
					{/* Active Toggle */}
					<div className="flex items-center justify-between pb-4 border-b">
						<div>
							<Label htmlFor="active">Active</Label>
							<p className="text-xs text-gray-500">
								Enable or disable this fieldset
							</p>
						</div>
						<Switch
							id="active"
							checked={isActive}
							onCheckedChange={onActiveChange}
						/>
					</div>

					{/* Slug */}
					<div>
						<Label htmlFor="slug">Fieldset Slug</Label>
						<Input
							id="slug"
							value={slug}
							onChange={(e) => onSlugChange(e.target.value)}
							placeholder="fieldset_slug"
						/>
						<p className="text-xs text-gray-500 mt-1">
							Used for programmatic access
						</p>
					</div>

					{/* Description */}
					<div>
						<Label htmlFor="description">Description</Label>
						<Input
							id="description"
							value={description}
							onChange={(e) => onDescriptionChange(e.target.value)}
							placeholder="Optional description for this fieldset"
						/>
					</div>
				</div>
			</Card>
		</div>
	);
}
