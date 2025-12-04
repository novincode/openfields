/**
 * MoveFieldDialog Component
 *
 * A dialog for moving a field to a different parent (root or another container field).
 *
 * @package OpenFields
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { MoveVertical } from 'lucide-react';
import { useFieldsetStore, canHaveChildren } from '../../../stores/fieldset-store';
import { useUIStore } from '../../../stores/ui-store';
import type { Field } from '../../../types';

interface MoveFieldDialogProps {
    field: Field;
    allFields: Field[];
    maxDepth: number;
}

export function MoveFieldDialog({ field, allFields, maxDepth }: MoveFieldDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedParent, setSelectedParent] = useState<string>(
        field.parent_id ? String(field.parent_id) : '_root'
    );

    const { moveFieldToParent } = useFieldsetStore();
    const { showToast } = useUIStore();

    // Find all fields that can have children (and aren't this field or its descendants)
    const potentialParents = allFields.filter(f => {
        // Must support children
        if (!canHaveChildren(f)) return false;
        // Can't move to itself
        if (String(f.id) === String(field.id)) return false;
        // Can't move to own children (would create loop)
        const isDescendant = (parentId: number | string | null | undefined): boolean => {
            if (!parentId) return false;
            if (String(parentId) === String(field.id)) return true;
            const parent = allFields.find(p => String(p.id) === String(parentId));
            return parent ? isDescendant(parent.parent_id) : false;
        };
        if (isDescendant(f.parent_id)) return false;
        // Check depth limit
        const getDepth = (f: Field): number => {
            if (!f.parent_id) return 0;
            const parent = allFields.find(p => String(p.id) === String(f.parent_id));
            return parent ? 1 + getDepth(parent) : 0;
        };
        return getDepth(f) < maxDepth - 1;
    });

    // If no potential parents and already at root, don't show dialog
    if (potentialParents.length === 0 && !field.parent_id) {
        return null;
    }

    const handleMove = () => {
        const newParentId = selectedParent === '_root' ? null : selectedParent;
        moveFieldToParent(String(field.id), newParentId);
        
        const targetLabel = newParentId
            ? allFields.find(f => String(f.id) === selectedParent)?.label || 'parent'
            : 'root level';
        
        showToast('success', `Field moved to ${targetLabel}`);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Move field"
                >
                    <MoveVertical className="h-4 w-4" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Move Field</DialogTitle>
                    <DialogDescription>
                        Move "{field.label || field.name}" to a different location.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="move-location">Move to</Label>
                    <Select
                        value={selectedParent}
                        onValueChange={setSelectedParent}
                    >
                        <SelectTrigger id="move-location" className="mt-2">
                            <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_root">
                                Root Level
                            </SelectItem>
                            {potentialParents.map((parent) => (
                                <SelectItem key={parent.id} value={String(parent.id)}>
                                    → {parent.label} ({parent.type})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleMove}
                        disabled={selectedParent === (field.parent_id ? String(field.parent_id) : '_root')}
                    >
                        Move Field
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
