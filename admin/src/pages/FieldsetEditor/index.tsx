/**
 * Fieldset Editor Page - Main Entry Point
 *
 * This is the refactored, modular version of the fieldset editor.
 * Components are broken down for maintainability and scalability.
 *
 * @package OpenFields
 */

import { useEffect, useState } from 'react';
import { useFieldsetStore } from '../../stores/fieldset-store';
import { useUIStore } from '../../stores/ui-store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

// Sub-components
import { FieldsSection } from './components/FieldsSection';
import { SettingsSection } from './components/SettingsSection';
import { LocationsSection } from './components/LocationsSection';

import type { LocationGroup } from '../../types';

interface FieldsetEditorProps {
	fieldsetId?: number;
	isNew?: boolean;
}

export function FieldsetEditor({ fieldsetId, isNew }: FieldsetEditorProps) {
	// Use selectors to ensure proper subscription to store updates
	const currentFieldset = useFieldsetStore((state) => state.currentFieldset);
	const fetchFieldset = useFieldsetStore((state) => state.fetchFieldset);
	const createFieldset = useFieldsetStore((state) => state.createFieldset);
	const updateFieldset = useFieldsetStore((state) => state.updateFieldset);
	const unsavedChanges = useFieldsetStore((state) => state.unsavedChanges);
	const setUnsavedChanges = useFieldsetStore((state) => state.setUnsavedChanges);
	const saveAllChanges = useFieldsetStore((state) => state.saveAllChanges);
	const isLoading = useFieldsetStore((state) => state.isLoading);
	const { showToast } = useUIStore();

	// Local state for fieldset-level properties
	const [title, setTitle] = useState('');
	const [slug, setSlug] = useState('');
	const [description, setDescription] = useState('');
	const [isActive, setIsActive] = useState(true);
	const [locationGroups, setLocationGroups] = useState<LocationGroup[]>([
		{ id: '1', rules: [{ type: '', operator: '==', value: '' }] },
	]);
	
	const [isSaving, setIsSaving] = useState(false);
	const [initialized, setInitialized] = useState(false);

	// Fetch fieldset on mount if editing existing
	useEffect(() => {
		const init = async () => {
			if (fieldsetId && !isNew) {
				await fetchFieldset(fieldsetId);
			} else if (isNew) {
				try {
					const newFieldset = await createFieldset({ title: 'New Fieldset' });
					window.location.href = `admin.php?page=openfields&action=edit&id=${newFieldset.id}`;
				} catch {
					showToast('error', 'Failed to create fieldset');
				}
			}
			setInitialized(true);
		};
		init();
	}, [fieldsetId, isNew, fetchFieldset, createFieldset, showToast]);

	// Sync local state with current fieldset
	useEffect(() => {
		if (currentFieldset) {
			setTitle(currentFieldset.title);
			setSlug(
				currentFieldset.field_key ||
					currentFieldset.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')
			);
			setDescription(currentFieldset.description || '');
			setIsActive(currentFieldset.is_active !== false);
			setLocationGroups(
				currentFieldset.settings?.location_groups || [
					{ id: '1', rules: [{ type: '', operator: '==', value: '' }] },
				]
			);
		}
	}, [currentFieldset?.id]);

	// Track fieldset-level changes
	const handleTitleChange = (value: string) => {
		setTitle(value);
		setUnsavedChanges(true);
	};

	const handleSlugChange = (value: string) => {
		setSlug(value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
		setUnsavedChanges(true);
	};

	const handleDescriptionChange = (value: string) => {
		setDescription(value);
		setUnsavedChanges(true);
	};

	const handleActiveChange = (value: boolean) => {
		setIsActive(value);
		setUnsavedChanges(true);
	};

	const handleLocationGroupsChange = (groups: LocationGroup[]) => {
		setLocationGroups(groups);
		setUnsavedChanges(true);
	};

	// Save everything
	const handleSave = async () => {
		if (!currentFieldset) return;

		if (!title.trim()) {
			showToast('error', 'Fieldset title is required');
			return;
		}

		setIsSaving(true);
		try {
			// Save fieldset details
			await updateFieldset(currentFieldset.id, {
				title,
				field_key: slug,
				description,
				is_active: isActive,
				settings: {
					...(currentFieldset.settings || {}),
					location_groups: locationGroups,
				},
			});

			// Save all pending field changes
			await saveAllChanges();

			setUnsavedChanges(false);
			showToast('success', 'Fieldset saved successfully');
		} catch (error) {
			console.error('Save error:', error);
			showToast('error', 'Failed to save fieldset');
		} finally {
			setIsSaving(false);
		}
	};

	// Loading state
	if (!initialized || isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-gray-500">Loading...</p>
			</div>
		);
	}

	// Not found state
	if (!currentFieldset) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-gray-500">Fieldset not found</p>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col">
			{/* Sticky Header */}
			<div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
				<div className="flex items-center justify-between">
					<div className="flex-1 max-w-2xl">
						<Input
							value={title}
							onChange={(e) => handleTitleChange(e.target.value)}
							placeholder="Enter fieldset title"
							className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0"
						/>
					</div>
					<div className="flex items-center gap-3">
						<Button
							onClick={handleSave}
							disabled={isSaving || !unsavedChanges}
						>
							{isSaving ? 'Saving...' : 'Save Changes'}
						</Button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-auto px-6 py-6 max-w-5xl w-full mx-auto">
				{/* Fields Section */}
				<FieldsSection />

				{/* Settings Section */}
				<SettingsSection
					isActive={isActive}
					slug={slug}
					description={description}
					onActiveChange={handleActiveChange}
					onSlugChange={handleSlugChange}
					onDescriptionChange={handleDescriptionChange}
				/>

				{/* Location Rules Section */}
				<LocationsSection
					locationGroups={locationGroups}
					onLocationGroupsChange={handleLocationGroupsChange}
				/>
			</div>
		</div>
	);
}

export default FieldsetEditor;
