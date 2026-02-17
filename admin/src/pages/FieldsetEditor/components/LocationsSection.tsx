/**
 * Locations Section Component
 * 
 * Handles location rules for where the fieldset should appear.
 * Fetches actual templates, categories, and post formats from WordPress
 * via the localized `window.openfieldsAdmin` data OR the REST API.
 *
 * @package OpenFields
 */

import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../components/ui/select';
import { Plus, X } from 'lucide-react';
import type { LocationGroup, LocationRule } from '../../../types';

interface LocationsSectionProps {
	locationGroups: LocationGroup[];
	onLocationGroupsChange: (groups: LocationGroup[]) => void;
}

interface OptionItem {
	name: string;
	label: string;
}

export function LocationsSection({
	locationGroups,
	onLocationGroupsChange,
}: LocationsSectionProps) {
	// State for dynamically fetched location options
	const [pageTemplates, setPageTemplates] = useState<OptionItem[]>([]);
	const [categories, setCategories] = useState<OptionItem[]>([]);
	const [postFormats, setPostFormats] = useState<OptionItem[]>([]);

	// Load location options from WordPress localized data or REST API
	useEffect(() => {
		// Page templates: from localized data or REST API
		const wpTemplates = window.openfieldsAdmin?.pageTemplates;
		if (wpTemplates && wpTemplates.length > 0) {
			setPageTemplates(wpTemplates);
		} else {
			// Fallback: fetch from REST API
			const restUrl = window.openfieldsAdmin?.restUrl || '/wp-json/codeideal-open-fields/v1';
			const nonce = window.openfieldsAdmin?.nonce || '';
			fetch(`${restUrl}/locations/types`, {
				headers: { 'X-WP-Nonce': nonce },
			})
				.then((res) => res.json())
				.then((types: { key: string; label: string; options: { value: string; label: string }[] }[]) => {
					const templateType = types.find((t) => t.key === 'page_template');
					if (templateType?.options) {
						setPageTemplates(
							templateType.options.map((o) => ({ name: o.value, label: o.label }))
						);
					}
					const catType = types.find((t) => t.key === 'post_category');
					if (catType?.options) {
						setCategories(
							catType.options.map((o) => ({ name: o.value, label: o.label }))
						);
					}
					const formatType = types.find((t) => t.key === 'post_format');
					if (formatType?.options) {
						setPostFormats(
							formatType.options.map((o) => ({ name: o.value, label: o.label }))
						);
					}
				})
				.catch(() => {
					// Fallback defaults
					setPageTemplates([{ name: 'default', label: 'Default Template' }]);
				});
		}

		// Categories: from localized data
		const wpCategories = window.openfieldsAdmin?.categories;
		if (wpCategories && wpCategories.length > 0) {
			setCategories(wpCategories);
		}

		// Post formats: from localized data
		const wpFormats = window.openfieldsAdmin?.postFormats;
		if (wpFormats && wpFormats.length > 0) {
			setPostFormats(wpFormats);
		}
	}, []);
	// Update a rule in a group
	const handleUpdateRule = (
		groupIndex: number,
		ruleIndex: number,
		key: keyof LocationRule,
		value: string
	) => {
		const newGroups = [...locationGroups];
		const targetGroup = newGroups[groupIndex];
		if (targetGroup && targetGroup.rules[ruleIndex]) {
			const rule = targetGroup.rules[ruleIndex];
			if (key === 'type') {
				rule.type = value;
				rule.value = ''; // Reset value when type changes
			} else if (key === 'operator') {
				rule.operator = value as '==' | '!=';
			} else if (key === 'value') {
				rule.value = value;
			}
			onLocationGroupsChange(newGroups);
		}
	};

	// Add a rule to a group (AND)
	const handleAddRule = (groupIndex: number) => {
		const newGroups = [...locationGroups];
		const targetGroup = newGroups[groupIndex];
		if (targetGroup) {
			targetGroup.rules.push({ type: '', operator: '==', value: '' });
			onLocationGroupsChange(newGroups);
		}
	};

	// Remove a rule from a group
	const handleRemoveRule = (groupIndex: number, ruleIndex: number) => {
		const newGroups = [...locationGroups];
		const targetGroup = newGroups[groupIndex];
		if (targetGroup) {
			if (targetGroup.rules.length > 1) {
				// Just remove the rule
				targetGroup.rules = targetGroup.rules.filter((_, i) => i !== ruleIndex);
			} else {
				// Remove entire group
				newGroups.splice(groupIndex, 1);
			}
		}
		// Ensure at least one group exists
		if (newGroups.length === 0) {
			newGroups.push({
				id: Date.now().toString(),
				rules: [{ type: '', operator: '==', value: '' }],
			});
		}
		onLocationGroupsChange(newGroups);
	};

	// Add a new group (OR)
	const handleAddGroup = () => {
		onLocationGroupsChange([
			...locationGroups,
			{ id: Date.now().toString(), rules: [{ type: '', operator: '==', value: '' }] },
		]);
	};

	// Get value options based on rule type — uses dynamic data from WordPress
	const getValueOptions = (ruleType: string): OptionItem[] => {
		switch (ruleType) {
			case 'post_type':
				return (
					window.openfieldsAdmin?.postTypes || [
						{ name: 'post', label: 'Post' },
						{ name: 'page', label: 'Page' },
					]
				);
			case 'taxonomy':
				return (
					window.openfieldsAdmin?.taxonomies || [
						{ name: 'category', label: 'Category' },
						{ name: 'post_tag', label: 'Tag' },
					]
				);
			case 'user_role':
				return (
					window.openfieldsAdmin?.userRoles || [
						{ name: 'administrator', label: 'Administrator' },
						{ name: 'editor', label: 'Editor' },
						{ name: 'author', label: 'Author' },
					]
				);
			case 'page_template':
				return pageTemplates.length > 0
					? pageTemplates
					: [{ name: 'default', label: 'Default Template' }];
			case 'post_category':
				return categories;
			case 'post_format':
				return postFormats;
			default:
				return [];
		}
	};

	return (
		<div className="mb-8">
			<h2 className="text-lg font-semibold mb-4">Location Rules</h2>
			<Card className="p-4">
				<p className="text-sm text-gray-600 mb-4">
					Show this fieldset when the following rules match
				</p>

				{locationGroups.map((group, groupIndex) => (
					<div key={group.id} className="mb-4">
						{/* OR separator between groups */}
						{groupIndex > 0 && (
							<div className="flex items-center gap-2 my-3">
								<div className="flex-1 border-t"></div>
								<span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
									OR
								</span>
								<div className="flex-1 border-t"></div>
							</div>
						)}

						{/* Group rules */}
						<div className="bg-gray-50 p-3 rounded-lg space-y-2">
							{group.rules.map((rule, ruleIndex) => (
								<div key={ruleIndex}>
									{/* AND separator between rules in same group */}
									{ruleIndex > 0 && (
										<div className="text-xs font-medium text-gray-500 text-center my-2">
											AND
										</div>
									)}
									<div className="flex items-center gap-2">
										{/* Type selector */}
										<Select
											value={rule.type}
											onValueChange={(value) =>
												handleUpdateRule(groupIndex, ruleIndex, 'type', value)
											}
										>
											<SelectTrigger className="w-[160px]">
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="post_type">Post Type</SelectItem>
												<SelectItem value="page_template">
													Page Template
												</SelectItem>
												<SelectItem value="post_category">
													Post Category
												</SelectItem>
												<SelectItem value="post_format">
													Post Format
												</SelectItem>
												<SelectItem value="taxonomy">Taxonomy</SelectItem>
												<SelectItem value="user_role">User Role</SelectItem>
											</SelectContent>
										</Select>

										{/* Operator selector */}
										<Select
											value={rule.operator}
											onValueChange={(value) =>
												handleUpdateRule(groupIndex, ruleIndex, 'operator', value)
											}
										>
											<SelectTrigger className="w-[130px]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="==">is equal to</SelectItem>
												<SelectItem value="!=">is not equal to</SelectItem>
											</SelectContent>
										</Select>

										{/* Value selector */}
										<Select
											value={rule.value}
											onValueChange={(value) =>
												handleUpdateRule(groupIndex, ruleIndex, 'value', value)
											}
										>
											<SelectTrigger className="flex-1">
												<SelectValue placeholder="Select value" />
											</SelectTrigger>
											<SelectContent>
												{getValueOptions(rule.type).map((opt) => (
													<SelectItem key={opt.name} value={opt.name}>
														{opt.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										{/* Remove button */}
										{(group.rules.length > 1 || locationGroups.length > 1) && (
											<button
												type="button"
												onClick={() => handleRemoveRule(groupIndex, ruleIndex)}
												className="p-1 text-gray-400 hover:text-red-600"
											>
												<X className="h-4 w-4" />
											</button>
										)}
									</div>
								</div>
							))}

							{/* Add AND rule button */}
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => handleAddRule(groupIndex)}
								className="mt-2"
							>
								<Plus className="h-3 w-3 mr-1" />
								Add AND rule
							</Button>
						</div>
					</div>
				))}

				{/* Add OR group button */}
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleAddGroup}
				>
					<Plus className="h-3 w-3 mr-1" />
					Add OR rule group
				</Button>
			</Card>
		</div>
	);
}
