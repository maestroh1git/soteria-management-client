/**
 * What a family can tell a school a child needs support with (roadmap 5.15).
 * The same list as the API's SUPPORT_NEEDS; broad on purpose, a prompt for a
 * conversation rather than a diagnosis. The detail goes in the notes.
 */
export const SUPPORT_NEEDS = [
    { value: 'SIGHT', label: 'Sight', hint: 'Wears glasses, or needs to sit near the board' },
    { value: 'HEARING', label: 'Hearing', hint: 'A hearing aid, or needs to see the speaker' },
    { value: 'MOBILITY', label: 'Mobility or physical', hint: 'Stairs, getting about, fine motor skills' },
    { value: 'LEARNING', label: 'Learning', hint: 'Dyslexia, extra time, a different pace' },
    { value: 'SPEECH', label: 'Speech and language', hint: 'Speaking, or understanding what is said' },
    { value: 'SOCIAL', label: 'Social, emotional or behavioural', hint: 'Settling in, friendships, anxiety' },
    { value: 'MEDICAL', label: 'A medical condition', hint: 'Anything a teacher should know about' },
    { value: 'OTHER', label: 'Something else', hint: 'Tell us below' },
] as const;

export type SupportNeed = (typeof SUPPORT_NEEDS)[number]['value'];

export const SUPPORT_NEED_LABELS: Record<string, string> = Object.fromEntries(
    SUPPORT_NEEDS.map((n) => [n.value, n.label]),
);
