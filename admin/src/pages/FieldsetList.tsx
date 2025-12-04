/**
 * Fieldset List Page - Redesigned
 *
 * @package OpenFields
 */

import { useEffect, useState, useMemo } from 'react';
import {
	Plus,
	Copy,
	Trash2,
	Edit,
	Search,
	Filter,
	ChevronDown,
	FileText,
	CheckCircle2,
	XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '../components/ui/popover';
import { useFieldsetStore } from '../stores';
import { fieldApi } from '../api';
import type { Fieldset } from '../types';

interface LocationRule {
	param: string;
	operator: string;
	value: string;
	group_id: number;
}

interface FieldsetWithMeta extends Fieldset {
	locations?: LocationRule[];
	fieldCount?: number;
}

// Map location params to human-readable labels
const LOCATION_LABELS: Record<string, string> = {
	post_type: 'Post Type',
	page_template: 'Page Template',
	page_type: 'Page Type',
	page: 'Page',
	post: 'Post',
	post_category: 'Post Category',
	post_taxonomy: 'Post Taxonomy',
	post_status: 'Post Status',
	post_format: 'Post Format',
	taxonomy: 'Taxonomy',
	attachment: 'Attachment',
	user_form: 'User Form',
	user_role: 'User Role',
	options_page: 'Options Page',
	block: 'Block',
	nav_menu: 'Nav Menu',
	nav_menu_item: 'Nav Menu Item',
	widget: 'Widget',
	comment: 'Comment',
};

export default function FieldsetList() {
	const {
		fieldsets,
		isLoading,
		error,
		fetchFieldsets,
		deleteFieldset,
		duplicateFieldset,
	} = useFieldsetStore();
	const [searchTerm, setSearchTerm] = useState('');
	const [locationFilter, setLocationFilter] = useState<string>('');
	const [fieldCounts, setFieldCounts] = useState<Record<number, number>>({});

	useEffect(() => {
		fetchFieldsets();
	}, [fetchFieldsets]);

	// Fetch field counts for all fieldsets
	useEffect(() => {
		const loadFieldCounts = async () => {
			const counts: Record<number, number> = {};
			for (const fs of fieldsets) {
				try {
					const fields = await fieldApi.getByFieldset(fs.id);
					counts[fs.id] = fields.length;
				} catch (error) {
					console.error(`Failed to fetch fields for fieldset ${fs.id}:`, error);
					counts[fs.id] = 0;
				}
			}
			setFieldCounts(counts);
		};

		if (fieldsets.length > 0) {
			loadFieldCounts();
		}
	}, [fieldsets]);

	// Get unique location types for filter
	const locationTypes = useMemo(() => {
		const types = new Set<string>();
		fieldsets.forEach((fs: FieldsetWithMeta) => {
			fs.locations?.forEach((loc) => {
				types.add(loc.param);
			});
		});
		return Array.from(types).sort();
	}, [fieldsets]);

	const filteredFieldsets = useMemo(() => {
		return (fieldsets as FieldsetWithMeta[]).filter((fs) => {
			// Search filter
			const matchesSearch =
				!searchTerm ||
				fs.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				fs.field_key.toLowerCase().includes(searchTerm.toLowerCase());

			// Location filter
			const matchesLocation =
				!locationFilter ||
				fs.locations?.some((loc) => loc.param === locationFilter);

			return matchesSearch && matchesLocation;
		});
	}, [fieldsets, searchTerm, locationFilter]);

	const handleDelete = async (id: number) => {
		try {
			await deleteFieldset(id);
			toast.success('Field group deleted successfully');
		} catch (error) {
			console.error('Delete error:', error);
			toast.error('Failed to delete field group');
		}
	};

	const handleDuplicate = async (id: number) => {
		try {
			await duplicateFieldset(id);
			toast.success('Field group duplicated successfully');
		} catch (error) {
			console.error('Duplicate error:', error);
			toast.error('Failed to duplicate field group');
		}
	};

	const navigateToEdit = (id: number) => {
		const adminUrl = window.openfieldsAdmin?.adminUrl || '/wp-admin/';
		window.location.href = `${adminUrl}admin.php?page=openfields&action=edit&id=${id}`;
	};

	const navigateToNew = () => {
		const adminUrl = window.openfieldsAdmin?.adminUrl || '/wp-admin/';
		window.location.href = `${adminUrl}admin.php?page=openfields&action=new`;
	};

	// Get location summary for a fieldset
	const getLocationSummary = (locations?: LocationRule[]) => {
		if (!locations || locations.length === 0) {
			return <span className="text-gray-400 italic">No location rules</span>;
		}

		// Group by group_id
		const groups: Record<number, LocationRule[]> = {};
		locations.forEach((loc) => {
			const groupId = loc.group_id || 0;
			if (!groups[groupId]) groups[groupId] = [];
			groups[groupId].push(loc);
		});

		const groupArray = Object.values(groups);

		return (
			<div className="flex flex-wrap gap-1">
				{groupArray.slice(0, 2).map((group, idx) => (
					<span key={idx} className="inline-flex items-center gap-1">
						{idx > 0 && <span className="text-gray-400 text-xs mx-1">or</span>}
						{group.slice(0, 2).map((loc, locIdx) => (
							<Badge key={locIdx} variant="secondary" className="text-xs font-normal">
								{LOCATION_LABELS[loc.param] || loc.param}:{' '}
								{loc.operator === '==' ? '' : '≠ '}
								{loc.value}
							</Badge>
						))}
						{group.length > 2 && (
							<span className="text-xs text-gray-500">+{group.length - 2}</span>
						)}
					</span>
				))}
				{groupArray.length > 2 && (
					<span className="text-xs text-gray-500">+{groupArray.length - 2} more</span>
				)}
			</div>
		);
	};

	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
				{error}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					{/* Search */}
					<div className="relative w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							type="text"
							placeholder="Search field groups..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-9"
						/>
					</div>

					{/* Location Filter */}
					{locationTypes.length > 0 && (
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" size="sm" className="gap-2">
									<Filter className="h-4 w-4" />
									{locationFilter
										? LOCATION_LABELS[locationFilter] || locationFilter
										: 'Filter by location'}
									<ChevronDown className="h-3 w-3" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-48 p-2">
								<button
									onClick={() => setLocationFilter('')}
									className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
										!locationFilter ? 'bg-gray-100 font-medium' : ''
									}`}
								>
									All locations
								</button>
								{locationTypes.map((type) => (
									<button
										key={type}
										onClick={() => setLocationFilter(type)}
										className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
											locationFilter === type ? 'bg-gray-100 font-medium' : ''
										}`}
									>
										{LOCATION_LABELS[type] || type}
									</button>
								))}
							</PopoverContent>
						</Popover>
					)}
				</div>

				<Button onClick={navigateToNew}>
					<Plus className="h-4 w-4 mr-2" />
					Add Field Group
				</Button>
			</div>

			{/* Loading State */}
			{isLoading && (
				<div className="flex items-center justify-center py-12">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
				</div>
			)}

			{/* Empty State */}
			{!isLoading && filteredFieldsets.length === 0 && (
				<div className="bg-white rounded-lg border p-12 text-center">
					<div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
						<FileText className="h-6 w-6 text-gray-400" />
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						{searchTerm || locationFilter
							? 'No matching field groups'
							: 'No field groups yet'}
					</h3>
					<p className="text-gray-500 mb-6 max-w-sm mx-auto">
						{searchTerm || locationFilter
							? 'Try adjusting your search or filter'
							: 'Get started by creating your first field group to add custom fields to your content.'}
					</p>
					{!searchTerm && !locationFilter && (
						<Button onClick={navigateToNew}>
							<Plus className="h-4 w-4 mr-2" />
							Create Field Group
						</Button>
					)}
				</div>
			)}

			{/* Table */}
			{!isLoading && filteredFieldsets.length > 0 && (
				<div className="bg-white rounded-lg border overflow-hidden">
					<table className="w-full">
						<thead className="bg-gray-50 border-b">
							<tr>
								<th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
									Title
								</th>
								<th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
									Key
								</th>
								<th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
									Location
								</th>
								<th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 w-20">
									Fields
								</th>
								<th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 w-20">
									Status
								</th>
								<th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 w-24">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{filteredFieldsets.map((fieldset) => (
								<tr
									key={fieldset.id}
									className="hover:bg-gray-50 cursor-pointer transition-colors"
									onClick={() => navigateToEdit(fieldset.id)}
								>
									<td className="px-4 py-3">
										<span className="font-medium text-gray-900">
											{fieldset.title}
										</span>
									</td>
									<td className="px-4 py-3">
										<code className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
											{fieldset.field_key}
										</code>
									</td>
									<td className="px-4 py-3">
										{getLocationSummary(fieldset.locations)}
									</td>
									<td className="px-4 py-3 text-center">
										<span className="text-sm text-gray-600">
											{fieldCounts[fieldset.id] ?? '-'}
										</span>
									</td>
									<td className="px-4 py-3 text-center">
										{fieldset.is_active ? (
											<span className="inline-flex items-center gap-1 text-green-700">
												<CheckCircle2 className="h-4 w-4" />
											</span>
										) : (
											<span className="inline-flex items-center gap-1 text-gray-400">
												<XCircle className="h-4 w-4" />
											</span>
										)}
									</td>
									<td className="px-4 py-3 text-right">
										<div
											className="flex items-center justify-end gap-1"
											onClick={(e) => e.stopPropagation()}
										>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={() => navigateToEdit(fieldset.id)}
												title="Edit"
											>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={() => handleDuplicate(fieldset.id)}
												title="Duplicate"
											>
												<Copy className="h-4 w-4" />
											</Button>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
														title="Delete"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>Delete Field Group</AlertDialogTitle>
														<AlertDialogDescription>
															Are you sure you want to delete "{fieldset.title}"?
															This action cannot be undone.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancel</AlertDialogCancel>
														<AlertDialogAction
															className="bg-red-600 hover:bg-red-700"
															onClick={() => handleDelete(fieldset.id)}
														>
															Delete
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
