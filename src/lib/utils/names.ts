/**
 * How a person's name is written (ROADMAP-EXECUTION.md, the copy guide).
 *
 * - In a list of people (a table, a register, a roster, a picker): surname
 *   first, "Adeyemi, Tobi", and the list sorted by surname. That is how a
 *   school reads a register, and it keeps a family together.
 * - In a title or a sentence: "Tobi Adeyemi".
 *
 * Search matches either order ("tobi adeyemi", "adeyemi tobi", "adey").
 */
type Named = {
    firstName?: string | null;
    lastName?: string | null;
    middleName?: string | null;
} | null | undefined;

/** "Adeyemi, Tobi": for lists. */
export function listName(p: Named, fallback = '—'): string {
    if (!p) return fallback;
    const last = p.lastName?.trim() ?? '';
    const first = [p.firstName, p.middleName].filter(Boolean).join(' ').trim();
    if (last && first) return `${last}, ${first}`;
    return last || first || fallback;
}

/** "Tobi Adeyemi": for titles and sentences. */
export function fullName(p: Named, fallback = '—'): string {
    if (!p) return fallback;
    return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ').trim() || fallback;
}

/** Sort people by surname, then first name. */
export function bySurname(a: Named, b: Named): number {
    return (
        (a?.lastName ?? '').localeCompare(b?.lastName ?? '', undefined, { sensitivity: 'base' }) ||
        (a?.firstName ?? '').localeCompare(b?.firstName ?? '', undefined, { sensitivity: 'base' })
    );
}

/** Text a search box matches a person on, in either order. */
export function nameSearchText(p: Named): string {
    return `${fullName(p, '')} ${listName(p, '')}`;
}
