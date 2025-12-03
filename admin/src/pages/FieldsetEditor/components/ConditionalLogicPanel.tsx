/**
 * Conditional Logic Panel Component
 * 
 * Handles conditional logic rules for showing/hiding fields.
 *
 * @package OpenFields
 */

import { useState, useEffect } from 'react';
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
	{ value: '==', label: 'is equal to' },
	{ value: '!=', label: 'is not equal to' },
	{ value: 'contains', label: 'contains' },
	{ value: 'empty', label: 'is empty' },
	{ value: 'not_empty', label: 'is not empty' },
];

export function ConditionalLogicPanel({
	field,
	otherFields,
	onConditionalLogicChange,
}: ConditionalLogicPanelProps) {
	const hasConditionalLogic =
		field.settings?.conditional_logic && field.settings.conditional_logic.length > 0;

	const [enabled, setEnabled] = useState(hasConditionalLogic);
	const [rules, setRules] = useState<ConditionalRule[]>(
		field.settings?.conditional_logic?.[0] || []
	);
	const [logicType, setLogicType] = useState<'and' | 'or'>('and');

	// Sync with field prop
	useEffect(() => {
		const hasLogic =
			field.settings?.conditional_logic && field.settings.conditional_logic.length > 0;
		setEnabled(hasLogic || false);
		setRules(field.settings?.conditional_logic?.[0] || []);
	}, [field.settings?.conditional_logic]);

	// Save logic changes
	const saveLogic = (newRules: ConditionalRule[]) => {
		if (newRules.length > 0) {
			onConditionalLogicChange([newRules]);
		} else {
			onConditionalLogicChange(undefined);
		}
	};

	// Toggle enabled
	const handleToggle = (checked: boolean) => {
		setEnabled(checked);
		if (!checked) {
			setRules([]);
			onConditionalLogicChange(undefined);
		}
	};

	// Add a new rule
	const handleAddRule = () => {
		const newRules = [...rules, { field: '', operator: '==' as const, value: '' }];
		setRules(newRules);
		// Don't save yet - user needs to fill it out
	};

	// Update a rule
	const handleUpdateRule = (
		index: number,
		key: keyof ConditionalRule,
		value: string
	) => {
		const newRules = [...rules];
		const currentRule = newRules[index];
		if (!currentRule) return;
		
		newRules[index] = { ...currentRule, [key]: value };
		setRules(newRules);
		
		const updatedRule = newRules[index];
		if (!updatedRule) return;
		
		// Only save if the rule is complete
		if (updatedRule.field && updatedRule.operator) {
			// For empty/not_empty operators, value is not needed
			if (['empty', 'not_empty'].includes(updatedRule.operator) || updatedRule.value) {
				saveLogic(newRules);
			}
		}
	};

	// Delete a rule
	const handleDeleteRule = (index: number) => {
		const newRules = rules.filter((_, i) => i !== index);
		setRules(newRules);
		saveLogic(newRules);
	};

	// Toggle logic type (AND/OR)
	const handleToggleLogicType = () => {
		setLogicType((prev) => (prev === 'and' ? 'or' : 'and'));
	};

	return (
		<div className="border-t pt-4">
			<div className="flex items-center justify-between mb-3">
				<h4 className="text-sm font-medium">Conditional Logic</h4>
				<Switch checked={enabled} onCheckedChange={handleToggle} />
			</div>

			{enabled && (
				<div className="space-y-3 bg-gray-50 p-3 rounded-lg">
					<p className="text-xs text-gray-600">
						Show this field if{' '}
						<button
							type="button"
							onClick={handleToggleLogicType}
							className="font-semibold text-blue-600 hover:underline"
						>
							{logicType === 'and' ? 'ALL' : 'ANY'}
						</button>{' '}
						conditions match
					</p>

					{rules.map((rule, index) => (
						<div key={index} className="flex items-center gap-2">
							{/* Field selector */}
							<Select
								value={rule.field}
								onValueChange={(value) => handleUpdateRule(index, 'field', value)}
							>
								<SelectTrigger className="w-[140px]">
									<SelectValue placeholder="Select field" />
								</SelectTrigger>
								<SelectContent>
									{otherFields.map((f) => (
										<SelectItem key={f.id} value={f.name}>
											{f.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{/* Operator selector */}
							<Select
								value={rule.operator}
								onValueChange={(value) =>
									handleUpdateRule(index, 'operator', value)
								}
							>
								<SelectTrigger className="w-[130px]">
									<SelectValue placeholder="Operator" />
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
										handleUpdateRule(index, 'value', e.target.value)
									}
									onBlur={() => saveLogic(rules)}
									placeholder="Value"
									className="w-[120px]"
								/>
							)}

							{/* Delete button */}
							<button
								type="button"
								onClick={() => handleDeleteRule(index)}
								className="p-1 text-gray-400 hover:text-red-600"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
					))}

					<Button type="button" variant="outline" size="sm" onClick={handleAddRule}>
						<Plus className="h-3 w-3 mr-1" />
						Add Rule
					</Button>
				</div>
			)}
		</div>
	);
}
