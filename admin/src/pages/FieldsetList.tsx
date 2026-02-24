/**
 * Fieldset List Page - Redesigned
 *
 * @package OpenFields
 */

import { useEffect, useState, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
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
	MoreVertical,
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
	post_type: __('Post Type', 'codeideal-open-fields'),
	page_template: __('Page Template', 'codeideal-open-fields'),
	page_type: __('Page Type', 'codeideal-open-fields'),
	page: __('Page', 'codeideal-open-fields'),
	post: __('Post', 'codeideal-open-fields'),
	post_category: __('Post Category', 'codeideal-open-fields'),
	post_taxonomy: __('Post Taxonomy', 'codeideal-open-fields'),
	post_status: __('Post Status', 'codeideal-open-fields'),
	post_format: __('Post Format', 'codeideal-open-fields'),
	taxonomy: __('Taxonomy', 'codeideal-open-fields'),
	attachment: __('Attachment', 'codeideal-open-fields'),
	user_form: __('User Form', 'codeideal-open-fields'),
	user_role: __('User Role', 'codeideal-open-fields'),
	options_page: __('Options Page', 'codeideal-open-fields'),
	block: __('Block', 'codeideal-open-fields'),
	nav_menu: __('Nav Menu', 'codeideal-open-fields'),
	nav_menu_item: __('Nav Menu Item', 'codeideal-open-fields'),
	widget: __('Widget', 'codeideal-open-fields'),
	comment: __('Comment', 'codeideal-open-fields'),
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
			toast.success(__('Field group deleted successfully', 'codeideal-open-fields'));
		} catch (error) {
			console.error('Delete error:', error);
			toast.error(__('Failed to delete field group', 'codeideal-open-fields'));
		}
	};

	const handleDuplicate = async (id: number) => {
		try {
			await duplicateFieldset(id);
			toast.success(__('Field group duplicated successfully', 'codeideal-open-fields'));
		} catch (error) {
			console.error('Duplicate error:', error);
			toast.error(__('Failed to duplicate field group', 'codeideal-open-fields'));
		}
	};

	const navigateToEdit = (id: number) => {
		const adminUrl = window.cofldAdmin?.adminUrl || '/wp-admin/';
		window.location.href = `${adminUrl}admin.php?page=codeideal-open-fields&action=edit&id=${id}`;
	};

	const navigateToNew = () => {
		const adminUrl = window.cofldAdmin?.adminUrl || '/wp-admin/';
		window.location.href = `${adminUrl}admin.php?page=codeideal-open-fields&action=new`;
	};

	// Get location summary for a fieldset
	const getLocationSummary = (locations?: LocationRule[]) => {
		if (!locations || locations.length === 0) {
			return <span className="text-gray-400 italic">{__('No location rules', 'codeideal-open-fields')}</span>;
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
						{idx > 0 && <span className="text-gray-400 text-xs mx-1">{__('or', 'codeideal-open-fields')}</span>}
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
					<span className="text-xs text-gray-500">+{groupArray.length - 2} {__('more', 'codeideal-open-fields')}</span>
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
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
					{/* Search */}
					<div className="relative w-full sm:w-64">
						<Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							type="text"
							placeholder={__('Search field groups...', 'codeideal-open-fields')}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="ps-9"
						/>
					</div>

					{/* Location Filter */}
					{locationTypes.length > 0 && (
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" size="sm" className="gap-2 justify-between sm:justify-start">
									<Filter className="h-4 w-4" />
									<span className="truncate">
										{locationFilter
											? LOCATION_LABELS[locationFilter] || locationFilter
											: __('Filter by location', 'codeideal-open-fields')}
									</span>
									<ChevronDown className="h-3 w-3 flex-shrink-0" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-48 p-2">
								<button
									onClick={() => setLocationFilter('')}
									className={`w-full text-start px-3 py-2 text-sm rounded hover:bg-gray-100 ${
										!locationFilter ? 'bg-gray-100 font-medium' : ''
									}`}
								>
									{__('All locations', 'codeideal-open-fields')}
								</button>
								{locationTypes.map((type) => (
									<button
										key={type}
										onClick={() => setLocationFilter(type)}
										className={`w-full text-start px-3 py-2 text-sm rounded hover:bg-gray-100 ${
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

				<Button onClick={navigateToNew} className="w-full sm:w-auto">
					<Plus className="h-4 w-4 me-2" />
					{__('Add Field Group', 'codeideal-open-fields')}
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
							? __('No matching field groups', 'codeideal-open-fields')
							: __('No field groups yet', 'codeideal-open-fields')}
					</h3>
					<p className="text-gray-500 mb-6 max-w-sm mx-auto">
						{searchTerm || locationFilter
							? __('Try adjusting your search or filter', 'codeideal-open-fields')
							: __('Get started by creating your first field group to add custom fields to your content.', 'codeideal-open-fields')}
					</p>
					{!searchTerm && !locationFilter && (
						<Button onClick={navigateToNew}>
							<Plus className="h-4 w-4 me-2" />
						{__('Create Field Group', 'codeideal-open-fields')}
						</Button>
					)}
				</div>
			)}

			{/* Table - Desktop */}
			{!isLoading && filteredFieldsets.length > 0 && (
				<>
					{/* Mobile Card View */}
					<div className="block md:hidden space-y-3">
						{filteredFieldsets.map((fieldset) => (
							<div
								key={fieldset.id}
								className="bg-white rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow"
								onClick={() => navigateToEdit(fieldset.id)}
							>
								<div className="flex items-start justify-between gap-3">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<span className="font-medium text-gray-900 truncate">
												{fieldset.title}
											</span>
											{fieldset.is_active ? (
												<CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
											) : (
												<XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
											)}
										</div>
										<div className="flex items-center gap-2 text-sm text-gray-500">
											<span>{fieldCounts[fieldset.id] ?? 0} {__('fields', 'codeideal-open-fields')}</span>
										</div>
										<div className="mt-2">
											{getLocationSummary(fieldset.locations)}
										</div>
									</div>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 flex-shrink-0"
												onClick={(e) => e.stopPropagation()}
											>
												<MoreVertical className="h-4 w-4" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-40 p-1" align="end" onClick={(e) => e.stopPropagation()}>
											<button
												onClick={() => navigateToEdit(fieldset.id)}
												className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-gray-100"
											>
												<Edit className="h-4 w-4" />
												{__('Edit', 'codeideal-open-fields')}
											</button>
											<button
												onClick={() => handleDuplicate(fieldset.id)}
												className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-gray-100"
											>
												<Copy className="h-4 w-4" />
												{__('Duplicate', 'codeideal-open-fields')}
											</button>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<button className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-gray-100 text-red-600">
														<Trash2 className="h-4 w-4" />
													{__('Delete', 'codeideal-open-fields')}
													</button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
													<AlertDialogTitle>{__('Delete Field Group', 'codeideal-open-fields')}</AlertDialogTitle>
													<AlertDialogDescription>
														{__('Are you sure you want to delete', 'codeideal-open-fields')} "{fieldset.title}"?
														{__('This action cannot be undone.', 'codeideal-open-fields')}
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>{__('Cancel', 'codeideal-open-fields')}</AlertDialogCancel>
													<AlertDialogAction
														className="bg-red-600 hover:bg-red-700"
														onClick={() => handleDelete(fieldset.id)}
													>
														{__('Delete', 'codeideal-open-fields')}
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</PopoverContent>
									</Popover>
								</div>
							</div>
						))}
					</div>

					{/* Desktop Table View */}
					<div className="hidden md:block bg-white rounded-lg border overflow-hidden">
						<table className="w-full">
							<thead className="bg-gray-50 border-b">
								<tr>
									<th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
									{__('Title', 'codeideal-open-fields')}
								</th>
								<th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
									{__('Key', 'codeideal-open-fields')}
								</th>
								<th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
									{__('Location', 'codeideal-open-fields')}
								</th>
								<th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 w-20">
									{__('Fields', 'codeideal-open-fields')}
								</th>
								<th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 w-20">
									{__('Status', 'codeideal-open-fields')}
								</th>
								<th className="text-end text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 w-24">
									{__('Actions', 'codeideal-open-fields')}
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
										<td className="px-4 py-3 text-end">
											<div
												className="flex items-center justify-end gap-1"
												onClick={(e) => e.stopPropagation()}
											>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={() => navigateToEdit(fieldset.id)}
													title={__('Edit', 'codeideal-open-fields')}
												>
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={() => handleDuplicate(fieldset.id)}
													title={__('Duplicate', 'codeideal-open-fields')}
												>
													<Copy className="h-4 w-4" />
												</Button>
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
															title={__('Delete', 'codeideal-open-fields')}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>{__('Delete Field Group', 'codeideal-open-fields')}</AlertDialogTitle>
															<AlertDialogDescription>
																{__('Are you sure you want to delete', 'codeideal-open-fields')} "{fieldset.title}"?
																{__('This action cannot be undone.', 'codeideal-open-fields')}
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>{__('Cancel', 'codeideal-open-fields')}</AlertDialogCancel>
															<AlertDialogAction
																className="bg-red-600 hover:bg-red-700"
																onClick={() => handleDelete(fieldset.id)}
															>
																{__('Delete', 'codeideal-open-fields')}
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
				</>
			)}
		</div>
	);
}
