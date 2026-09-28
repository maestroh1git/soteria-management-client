'use client';

import { useEffect } from 'react';

/**
 * Gives every cell of a `<table data-stack>` its column's name, so the table
 * can become one card per row on a phone (see `table[data-stack]` in
 * globals.css). A wide table otherwise scrolls sideways under 640px, and a
 * figure read without its column is just a number.
 *
 * Each cell gets `data-label` (its header's text). The first cell with a named
 * column is marked `data-stack-title` and heads the card; cells under an
 * unnamed column (a checkbox, a row's buttons; also "Actions", or a header
 * marked `data-stack-bare`) are marked `data-stack-bare` and share the title's
 * line, without a label; a cell spanning the whole row (an empty state, a
 * note) is marked `data-stack-full`.
 *
 * One observer for the app rather than a hook per table, so a table opts in
 * with an attribute and nothing else: rows arrive and change as queries
 * resolve, and they are labelled on the next frame.
 */
export function TableLabels() {
    useEffect(() => {
        let frame = 0;
        const label = () => {
            frame = 0;
            for (const table of document.querySelectorAll<HTMLTableElement>('table[data-stack]')) {
                const headRow = table.tHead?.rows[table.tHead.rows.length - 1];
                const heads: string[] = [];
                for (const th of Array.from(headRow?.cells ?? [])) {
                    // A column of a row's buttons is named for screen readers,
                    // but its label adds nothing on a card.
                    const raw = th.textContent?.trim() ?? '';
                    const text =
                        th.hasAttribute('data-stack-bare') || /^actions$/i.test(raw) ? '' : raw;
                    for (let i = 0; i < th.colSpan; i++) heads.push(text);
                }
                const rows = [
                    ...Array.from(table.tBodies).flatMap((b) => Array.from(b.rows)),
                    ...Array.from(table.tFoot?.rows ?? []),
                ];
                for (const tr of rows) {
                    let col = 0;
                    let titled: boolean = false;
                    for (const td of Array.from(tr.cells)) {
                        const name = heads[col] ?? '';
                        set(td, 'data-label', name);
                        set(td, 'data-stack-full', tr.cells.length === 1 && td.colSpan > 1);
                        set(td, 'data-stack-bare', !name);
                        const isTitle: boolean = !titled && !!name;
                        set(td, 'data-stack-title', isTitle);
                        titled ||= isTitle;
                        col += td.colSpan;
                    }
                }
            }
        };
        label();
        const observer = new MutationObserver(() => {
            if (!frame) frame = requestAnimationFrame(label);
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }, []);

    return null;
}

/** Only touch the DOM when the value changes (writes here must not feed the observer). */
function set(el: HTMLElement, attr: string, value: string | boolean) {
    if (value === false) {
        if (el.hasAttribute(attr)) el.removeAttribute(attr);
        return;
    }
    const v = value === true ? '' : value;
    if (el.getAttribute(attr) !== v) el.setAttribute(attr, v);
}
