/**
 * Conditional Logic Panel Component
 * 
 * Handles conditional logic rules for showing/hiding fields.
 * Supports multiple OR groups, each containing AND rules.
 * Structure: [[rule, rule], [rule]] = (rule AND rule) OR (rule)
 *
 * @package OpenFields
 */

import { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Switch } from '../../../components/ui/switch';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../components/ui/select';
import { Plus, X } from 'lucide-react';
import type { Field, ConditionalRule } from '../../../types';

interface ConditionalLogicPanelProps {
	field: Field;
	otherFields: Field[];
	onConditionalLogicChange: (logic: ConditionalRule[][] | undefined) => void;
}

const CONDITION_OPERATORS = [
	{ value: '==', label: __('is equal to', 'codeideal-open-fields') },
	{ value: '!=', label: __('is not equal to', 'codeideal-open-fields') },
	{ value: 'contains', label: __('contains', 'codeideal-open-fields') },
	{ value: 'empty', label: __('is empty', 'codeideal-open-fields') },
	{ value: 'not_empty', label: __('is not empty', 'codeideal-open-fields') },
];

export function ConditionalLogicPanel({
	field,
	otherFields,
	onConditionalLogicChange,
}: ConditionalLogicPanelProps) {
	const hasConditionalLogic =
		field.settings?.conditional_logic && field.settings.conditional_logic.length > 0;

	const [enabled, setEnabled] = useState(hasConditionalLogic);
	// ruleGroups is an array of arrays: [[rule, rule], [rule]] = OR groups of AND rules
	const [ruleGroups, setRuleGroups] = useState<ConditionalRule[][]>(
		field.settings?.conditional_logic || []
	);

	// Sync with field prop
	useEffect(() => {
		const hasLogic =
			field.settings?.conditional_logic && field.settings.conditional_logic.length > 0;
		if (hasLogic && field.settings?.conditional_logic) {
			setEnabled(true);
			// Ensure field IDs are strings for comparison
			const normalizedLogic = field.settings.conditional_logic.map(group =>
				group.map(rule => ({
					...rule,
					field: String(rule.field), // Convert to string for Select component
				}))
			);
			setRuleGroups(normalizedLogic);
		}
	}, [field.settings?.conditional_logic]);

	// Save logic changes
	const saveLogic = (groups: ConditionalRule[][]) => {
		// Filter out empty groups and groups with incomplete rules
		const validGroups = groups
			.map(group => group.filter(rule => rule.field && rule.operator))
			.filter(group => group.length > 0);
		
		if (validGroups.length > 0) {
			onConditionalLogicChange(validGroups);
		} else {
			onConditionalLogicChange(undefined);
		}
	};

	// Toggle enabled
	const handleToggle = (checked: boolean) => {
		setEnabled(checked);
		if (checked) {
			// When turning ON, create a default group with one empty rule
			const defaultGroups = ruleGroups.length > 0 
				? ruleGroups 
				: [[{ field: '', operator: '==' as const, value: '' }]];
			setRuleGroups(defaultGroups);
			onConditionalLogicChange(defaultGroups);
		} else {
			setRuleGroups([]);
			onConditionalLogicChange(undefined);
		}
	};

	// Add a new rule to a group
	const handleAddRule = (groupIndex: number) => {
		const newGroups = [...ruleGroups];
		newGroups[groupIndex] = [...(newGroups[groupIndex] || []), { field: '', operator: '==' as const, value: '' }];
		setRuleGroups(newGroups);
	};

	// Add a new OR group
	const handleAddGroup = () => {
		const newGroups = [...ruleGroups, [{ field: '', operator: '==' as const, value: '' }]];
		setRuleGroups(newGroups);
	};

	// Update a rule
	const handleUpdateRule = (
		groupIndex: number,
		ruleIndex: number,
		key: keyof ConditionalRule,
		value: string
	) => {
		const newGroups = [...ruleGroups];
		const group = newGroups[groupIndex];
		if (!group || !group[ruleIndex]) return;
		
		newGroups[groupIndex] = [...group];
		newGroups[groupIndex][ruleIndex] = { ...group[ruleIndex], [key]: value };
		setRuleGroups(newGroups);
		saveLogic(newGroups);
	};

	// Delete a rule
	const handleDeleteRule = (groupIndex: number, ruleIndex: number) => {
		const newGroups = [...ruleGroups];
		const group = newGroups[groupIndex];
		if (!group) return;
		
		newGroups[groupIndex] = group.filter((_, i) => i !== ruleIndex);
		
		// Remove empty groups
		const filteredGroups = newGroups.filter(group => group.length > 0);
		setRuleGroups(filteredGroups);
		saveLogic(filteredGroups);
	};

	// Delete entire group
	const handleDeleteGroup = (groupIndex: number) => {
		const newGroups = ruleGroups.filter((_, i) => i !== groupIndex);
		setRuleGroups(newGroups);
		saveLogic(newGroups);
	};

	return (
		<div className="border-t pt-4">
			<div className="flex items-center justify-between mb-3">
				<h4 className="text-sm font-medium">{__('Conditional Logic', 'codeideal-open-fields')}</h4>
				<Switch checked={enabled} onCheckedChange={handleToggle} />
			</div>

			{enabled && (
				<div className="space-y-3">
					<p className="text-xs text-gray-600">
						{__('Show this field if conditions match', 'codeideal-open-fields')}
					</p>

					{ruleGroups.map((group, groupIndex) => (
						<div key={groupIndex} className="bg-gray-50 p-3 rounded-lg space-y-2">
							{/* Group header */}
							{groupIndex > 0 && (
								<div className="flex items-center justify-center -mt-6 mb-2">
									<span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
										OR
									</span>
								</div>
							)}
							
							{group.map((rule, ruleIndex) => (
								<div key={ruleIndex}>
									{/* AND separator */}
									{ruleIndex > 0 && (
										<div className="text-xs text-gray-500 text-center my-1">AND</div>
									)}
									
									<div className="flex items-center gap-2">
										{/* Field selector */}
										<Select
											value={String(rule.field)}
											onValueChange={(value) => handleUpdateRule(groupIndex, ruleIndex, 'field', value)}
										>
											<SelectTrigger className="w-[140px]">
												<SelectValue placeholder={__('Select field', 'codeideal-open-fields')} />
											</SelectTrigger>
										<SelectContent>
											{otherFields.map((f) => (
												<SelectItem key={f.id} value={String(f.id)}>
													{f.label}
												</SelectItem>
											))}
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
												<SelectValue placeholder={__('Operator', 'codeideal-open-fields')} />
											</SelectTrigger>
											<SelectContent>
												{CONDITION_OPERATORS.map((op) => (
													<SelectItem key={op.value} value={op.value}>
														{op.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										{/* Value input (not shown for empty/not_empty) */}
										{!['empty', 'not_empty'].includes(rule.operator) && (
											<Input
												value={rule.value}
												onChange={(e) =>
													handleUpdateRule(groupIndex, ruleIndex, 'value', e.target.value)
												}
												placeholder={__('Value', 'codeideal-open-fields')}
												className="w-[100px]"
											/>
										)}

										{/* Delete rule button */}
										<button
											type="button"
											onClick={() => handleDeleteRule(groupIndex, ruleIndex)}
											className="p-1 text-gray-400 hover:text-red-600"
											title={__('Remove rule', 'codeideal-open-fields')}
										>
											<X className="h-4 w-4" />
										</button>
									</div>
								</div>
							))}

							{/* Add AND rule button */}
							<div className="flex items-center justify-between pt-2">
								<Button 
									type="button" 
									variant="ghost" 
									size="sm" 
									onClick={() => handleAddRule(groupIndex)}
									className="text-xs"
								>
									<Plus className="h-3 w-3 me-1" />
									AND
								</Button>
								
								{ruleGroups.length > 1 && (
									<button
										type="button"
										onClick={() => handleDeleteGroup(groupIndex)}
										className="text-xs text-red-500 hover:text-red-700"
									>
										Remove group
									</button>
								)}
							</div>
						</div>
					))}

					{/* Add OR group button */}
					<Button 
						type="button" 
						variant="outline" 
						size="sm" 
						onClick={handleAddGroup}
						className="w-full"
					>
						<Plus className="h-3 w-3 me-1" />
						{__('Add OR Group', 'codeideal-open-fields')}
					</Button>
				</div>
			)}
		</div>
	);
}
