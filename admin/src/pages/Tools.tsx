/**
 * Tools Page
 *
 * @package OpenFields
 */

import { useState } from 'react';
import { Download, Upload, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { fieldsetApi } from '../api';

export default function Tools() {
	const [isExporting, setIsExporting] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [importResult, setImportResult] = useState<string | null>(null);

	const handleExport = async () => {
		setIsExporting(true);
		try {
			// Get all fieldsets
			const fieldsets = await fieldsetApi.getAll();
			
			// Export each fieldset individually to get clean, optimized data
			const exportFieldsets = await Promise.all(
				fieldsets.map(fs => fieldsetApi.export(fs.id))
			);

			const exportData = {
				version: '1.0.0',
				plugin: 'openfields',
				fieldsets: exportFieldsets,
				exported_at: new Date().toISOString(),
			};

			// Download as JSON file
			const blob = new Blob([JSON.stringify(exportData, null, 2)], {
				type: 'application/json',
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `openfields-export-${Date.now()}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Export failed:', error);
		} finally {
			setIsExporting(false);
		}
	};

	const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setIsImporting(true);
		setImportResult(null);

		try {
			const text = await file.text();
			const data = JSON.parse(text);

			// Handle batch export format (array of individual exports)
			if (Array.isArray(data.fieldsets)) {
				let importedCount = 0;
				let failedCount = 0;

				for (const exportData of data.fieldsets) {
					try {
						await fieldsetApi.import(exportData);
						importedCount++;
					} catch (error) {
						console.error('Failed to import fieldset:', error);
						failedCount++;
					}
				}

				let message = `Successfully imported ${importedCount} field group(s).`;
				if (failedCount > 0) {
					message += ` (${failedCount} failed)`;
				}
				setImportResult(message);
			} else {
				// Handle single export format
				await fieldsetApi.import(data);
				setImportResult(`Successfully imported 1 field group.`);
			}
		} catch (error) {
			setImportResult(
				`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setIsImporting(false);
			// Reset file input
			event.target.value = '';
		}
	};

	return (
		<div className="space-y-6">
			<div className="grid gap-6 md:grid-cols-2">
				{/* Export */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Download className="h-5 w-5" />
							Export
						</CardTitle>
						<CardDescription>
							Export all field groups as a JSON file
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-600 mb-4">
							Download all your field groups, including fields and settings,
							as a portable JSON file that can be imported into another site.
						</p>
						<Button onClick={handleExport} disabled={isExporting}>
							{isExporting ? (
								<>
									<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
									Exporting...
								</>
							) : (
								<>
									<Download className="h-4 w-4 mr-2" />
									Export Field Groups
								</>
							)}
						</Button>
					</CardContent>
				</Card>

				{/* Import */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Upload className="h-5 w-5" />
							Import
						</CardTitle>
						<CardDescription>
							Import field groups from a JSON file
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-600 mb-4">
							Upload a previously exported JSON file to import field groups.
							Existing groups with the same key will be skipped.
						</p>
						<div>
							<input
								type="file"
								accept=".json"
								onChange={handleImport}
								disabled={isImporting}
								className="hidden"
								id="import-file"
							/>
							<Button asChild disabled={isImporting}>
								<label htmlFor="import-file" className="cursor-pointer">
									{isImporting ? (
										<>
											<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
											Importing...
										</>
									) : (
										<>
											<Upload className="h-4 w-4 mr-2" />
											Choose File
										</>
									)}
								</label>
							</Button>
						</div>
						{importResult && (
							<p
								className={`mt-4 text-sm ${
									importResult.includes('failed')
										? 'text-red-600'
										: 'text-green-600'
								}`}
							>
								{importResult}
							</p>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Info */}
		</div>
	);
}
