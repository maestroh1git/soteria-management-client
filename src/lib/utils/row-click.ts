import type { MouseEvent } from 'react';

/**
 * Controls that own their own click, and must never be read as a click on the
 * row around them. A row-level link is included deliberately: it navigates by
 * itself, and it is the keyboard and screen-reader path.
 */
const OWNS_ITS_CLICK =
    'a, button, input, select, textarea, [role="checkbox"], [role="menuitem"]';

/**
 * Whether a click on a table row means "open this row".
 *
 * A clickable row is a mouse affordance laid over a table, and three ordinary
 * gestures land on one without meaning to open it:
 *
 *  - a modified click, which belongs to the row's own link — that is the thing
 *    that can open a new tab, and swallowing it navigates in place instead,
 *    which is the single most annoying way to get this wrong;
 *  - a click on a control inside the row, which is that control's click;
 *  - the release at the end of dragging to select text, which is not a click
 *    on anything.
 *
 * Shared rather than written per table: the admissions board had its own
 * version with none of these, so the same gesture behaved differently
 * depending on which screen you were looking at.
 */
export function isRowNavigationClick(e: MouseEvent<HTMLElement>): boolean {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if ((e.target as HTMLElement).closest(OWNS_ITS_CLICK)) return false;
    if (window.getSelection()?.toString()) return false;
    return true;
}
