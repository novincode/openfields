/**
 * Settings Page Component
 *
 * @package OpenFields
 */

import { useEffect, useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { settingsApi, type PluginSettings } from '../api';

export default function Settings() {
	const [settings, setSettings] = useState<PluginSettings | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);

	useEffect(() => {
		loadSettings();
	}, []);

	const loadSettings = async () => {
		try {
			setIsLoading(true);
			const data = await settingsApi.get();
			setSettings(data);
		} catch (error) {
			console.error('Failed to load settings:', error);
			toast.error('Failed to load settings');
		} finally {
			setIsLoading(false);
		}
	};

	const handleSave = async () => {
		if (!settings) return;

		try {
			setIsSaving(true);
			await settingsApi.update({
				delete_data: settings.delete_data,
				enable_rest_api: settings.enable_rest_api,
				show_admin_column: settings.show_admin_column,
			});
			setHasChanges(false);
			toast.success('Settings saved successfully');
		} catch (error) {
			console.error('Failed to save settings:', error);
			toast.error('Failed to save settings');
		} finally {
			setIsSaving(false);
		}
	};

	const updateSetting = <K extends keyof PluginSettings>(key: K, value: PluginSettings[K]) => {
		if (!settings) return;
		setSettings({ ...settings, [key]: value });
		setHasChanges(true);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (!settings) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
				Failed to load settings
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Data Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Data Management</CardTitle>
					<CardDescription>
						Control how OpenFields handles your data
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="preserve-data" className="text-base font-medium">
								Keep Plugin Data After Uninstall
							</Label>
							<p className="text-sm text-muted-foreground">
								When enabled, your field groups and saved data will be preserved even if you uninstall the plugin. 
								Disable this only if you want to completely remove all OpenFields data.
							</p>
						</div>
						<Switch
							id="preserve-data"
							checked={!settings.delete_data}
							onCheckedChange={(checked) => updateSetting('delete_data', !checked)}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Save Button */}
			{hasChanges && (
				<div className="flex justify-end">
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving ? (
							<>
								<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
								Saving...
							</>
						) : (
							<>
								<Save className="h-4 w-4 mr-2" />
								Save Settings
							</>
						)}
					</Button>
				</div>
			)}
		</div>
	);
}
