'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SUPPORT_NEEDS } from '@/lib/support-needs';

/**
 * The support-needs question (roadmap 5.15): what the child needs support
 * with, and in the family's own words. Used on the application and on the
 * pupil's record.
 */
export function SupportNeedsFields({
    idPrefix,
    needs,
    notes,
    onNeedsChange,
    onNotesChange,
    notesLabel = 'Tell us more',
}: {
    idPrefix: string;
    needs: string[];
    notes: string;
    onNeedsChange: (needs: string[]) => void;
    onNotesChange: (notes: string) => void;
    notesLabel?: string;
}) {
    const toggle = (value: string, on: boolean) =>
        onNeedsChange(on ? [...needs, value] : needs.filter((n) => n !== value));

    return (
        <div className="space-y-4">
            <fieldset>
                <legend className="mb-2 text-sm font-medium">Does your child need support with any of these?</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                    {SUPPORT_NEEDS.map((n) => {
                        const id = `${idPrefix}-${n.value}`;
                        return (
                            <div key={n.value} className="flex items-start gap-2">
                                <Checkbox
                                    id={id}
                                    checked={needs.includes(n.value)}
                                    onCheckedChange={(v) => toggle(n.value, v === true)}
                                    className="mt-0.5"
                                />
                                <Label htmlFor={id} className="font-normal leading-snug">
                                    <span className="block font-medium">{n.label}</span>
                                    <span className="block text-xs text-muted-foreground">{n.hint}</span>
                                </Label>
                            </div>
                        );
                    })}
                </div>
            </fieldset>
            <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-notes`}>{notesLabel}</Label>
                <Textarea
                    id={`${idPrefix}-notes`}
                    rows={3}
                    maxLength={2000}
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    placeholder="Glasses, a hearing aid, a diagnosis, what helps them. Leave blank if nothing applies."
                />
            </div>
        </div>
    );
}
