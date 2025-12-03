/**
 * Fieldset List Page
 *
 * @package OpenFields
 */

import { useEffect, useState } from 'react';
import { Plus, Copy, Trash2, Edit, MoreVertical, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '../components/ui/card';
import { useFieldsetStore } from '../stores';
import { fieldApi } from '../api';
import type { Fieldset } from '../types';

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
	const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
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

	const filteredFieldsets = fieldsets.filter(
		(fs) =>
			fs.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			fs.field_key.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const handleDelete = async (id: number) => {
		if (deleteConfirm === id) {
			await deleteFieldset(id);
			setDeleteConfirm(null);
		} else {
			setDeleteConfirm(id);
			setTimeout(() => setDeleteConfirm(null), 3000);
		}
	};

	const handleDuplicate = async (id: number) => {
		await duplicateFieldset(id);
	};

	const navigateToEdit = (id: number) => {
		const adminUrl = window.openfieldsAdmin?.adminUrl || '/wp-admin/';
		window.location.href = `${adminUrl}admin.php?page=openfields&action=edit&id=${id}`;
	};

	const navigateToNew = () => {
		const adminUrl = window.openfieldsAdmin?.adminUrl || '/wp-admin/';
		window.location.href = `${adminUrl}admin.php?page=openfields&action=new`;
	};

	if (error) {
		return (
			<div className="p-6">
				<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
					{error}
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 max-w-6xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Field Groups</h1>
					<p className="text-gray-600 mt-1">
						Manage your custom field groups
					</p>
				</div>
				<Button onClick={navigateToNew}>
					<Plus className="h-4 w-4 mr-2" />
					Add Field Group
				</Button>
			</div>

			{/* Search */}
			<div className="mb-6">
				<div className="relative max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input
						type="text"
						placeholder="Search field groups..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
			</div>

			{/* Loading State */}
			{isLoading && (
				<div className="flex items-center justify-center py-12">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
				</div>
			)}

			{/* Empty State */}
			{!isLoading && filteredFieldsets.length === 0 && (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<div className="rounded-full bg-gray-100 p-4 mb-4">
							<Plus className="h-8 w-8 text-gray-400" />
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							{searchTerm
								? 'No matching field groups'
								: 'No field groups yet'}
						</h3>
						<p className="text-gray-500 mb-4 text-center max-w-sm">
							{searchTerm
								? 'Try adjusting your search term'
								: 'Get started by creating your first field group'}
						</p>
						{!searchTerm && (
							<Button onClick={navigateToNew}>
								<Plus className="h-4 w-4 mr-2" />
								Create Field Group
							</Button>
						)}
					</CardContent>
				</Card>
			)}

			{/* Fieldset Grid */}
			{!isLoading && filteredFieldsets.length > 0 && (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{filteredFieldsets.map((fieldset) => (
						<FieldsetCard
							key={fieldset.id}
							fieldset={fieldset}
							fieldCount={fieldCounts[fieldset.id] || 0}
							onEdit={() => navigateToEdit(fieldset.id)}
							onDuplicate={() => handleDuplicate(fieldset.id)}
							onDelete={() => handleDelete(fieldset.id)}
							isDeleteConfirm={deleteConfirm === fieldset.id}
						/>
					))}
				</div>
			)}
		</div>
	);
}

interface FieldsetCardProps {
	fieldset: Fieldset;
	fieldCount: number;
	onEdit: () => void;
	onDuplicate: () => void;
	onDelete: () => void;
	isDeleteConfirm: boolean;
}

function FieldsetCard({
	fieldset,
	fieldCount,
	onEdit,
	onDuplicate,
	onDelete,
	isDeleteConfirm,
}: FieldsetCardProps) {
	const [showMenu, setShowMenu] = useState(false);

	return (
		<Card
			className={`group cursor-pointer transition-shadow hover:shadow-md ${
				!fieldset.is_active ? 'opacity-60' : ''
			}`}
			onClick={onEdit}
		>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between">
					<div className="flex-1 min-w-0">
						<CardTitle className="text-base truncate">
							{fieldset.title}
						</CardTitle>
						<CardDescription className="truncate">
							{fieldset.field_key}
						</CardDescription>
					</div>
					<div className="relative ml-2">
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 opacity-0 group-hover:opacity-100"
							onClick={(e) => {
								e.stopPropagation();
								setShowMenu(!showMenu);
							}}
						>
							<MoreVertical className="h-4 w-4" />
						</Button>
						{showMenu && (
							<div
								className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[140px]"
								onClick={(e) => e.stopPropagation()}
							>
								<button
									className="flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-gray-50"
									onClick={() => {
										onEdit();
										setShowMenu(false);
									}}
								>
									<Edit className="h-4 w-4" />
									Edit
								</button>
								<button
									className="flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-gray-50"
									onClick={() => {
										onDuplicate();
										setShowMenu(false);
									}}
								>
									<Copy className="h-4 w-4" />
									Duplicate
								</button>
								<button
									className={`flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-gray-50 ${
										isDeleteConfirm
											? 'text-red-600'
											: 'text-gray-700'
									}`}
									onClick={() => {
										onDelete();
										if (!isDeleteConfirm) setShowMenu(false);
									}}
								>
									<Trash2 className="h-4 w-4" />
									{isDeleteConfirm ? 'Click to confirm' : 'Delete'}
								</button>
							</div>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-center gap-4 text-sm text-gray-500">
					<span>
						{fieldCount} field
						{fieldCount !== 1 ? 's' : ''}
					</span>
					<span
						className={`px-2 py-0.5 rounded text-xs ${
							fieldset.is_active
								? 'bg-green-100 text-green-700'
								: 'bg-gray-100 text-gray-600'
						}`}
					>
						{fieldset.is_active ? 'Active' : 'Inactive'}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
