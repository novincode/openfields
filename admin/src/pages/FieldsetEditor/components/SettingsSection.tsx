/**
 * Settings Section Component
 * 
 * Handles fieldset-level settings like active status, slug, and description.
 *
 * @package OpenFields
 */

import { __ } from '@wordpress/i18n';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';

interface SettingsSectionProps {
	isActive: boolean;
	slug: string;
	description: string;
	slugError?: string | null;
	onActiveChange: (value: boolean) => void;
	onSlugChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
}

export function SettingsSection({
	isActive,
	slug,
	description,
	slugError,
	onActiveChange,
	onSlugChange,
	onDescriptionChange,
}: SettingsSectionProps) {
	return (
		<div className="mb-8">
			<h2 className="text-lg font-semibold mb-4">{__('Settings', 'codeideal-open-fields')}</h2>
			<Card className="p-4">
				<div className="space-y-4">
					{/* Active Toggle */}
					<div className="flex items-center justify-between pb-4 border-b">
						<div>
							<Label htmlFor="active">{__('Active', 'codeideal-open-fields')}</Label>
							<p className="text-xs text-gray-500">
								{__('Enable or disable this fieldset', 'codeideal-open-fields')}
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
						<Label htmlFor="slug">{__('Fieldset Slug', 'codeideal-open-fields')}</Label>
						<Input
							id="slug"
							value={slug}
							onChange={(e) => onSlugChange(e.target.value)}
							placeholder="fieldset_slug"
							className={slugError ? 'border-red-500' : ''}
						/>
						{slugError ? (
							<p className="text-xs text-red-500 mt-1">{slugError}</p>
						) : (
							<p className="text-xs text-gray-500 mt-1">
								{__('Used for programmatic access. Must be unique.', 'codeideal-open-fields')}
							</p>
						)}
					</div>

					{/* Description */}
					<div>
						<Label htmlFor="description">{__('Description', 'codeideal-open-fields')}</Label>
						<Input
							id="description"
							value={description}
							onChange={(e) => onDescriptionChange(e.target.value)}
							placeholder={__('Optional description for this fieldset', 'codeideal-open-fields')}
						/>
					</div>
				</div>
			</Card>
		</div>
	);
}
