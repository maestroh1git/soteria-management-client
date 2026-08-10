import api from './client';

export interface ImportRow {
    line: number;
    employeeNumber: string;
    name: string;
    gradeCode: string;
    role: string;
    salary: number;
}

export interface ImportPreview {
    create: ImportRow[];
    skip: Array<{ employeeNumber: string; name: string }>;
    errors: string[];
    newRoles: string[];
    totalRows: number;
}

export interface ImportOptions {
    grades: Array<{ id: string; code: string; name: string }>;
    roles: Array<{ id: string; name: string; department: string | null }>;
    departments: Array<{ id: string; name: string }>;
    components: Array<{
        id: string;
        name: string;
        is_base: boolean;
        value: string;
        is_recurring: boolean;
    }>;
}

export async function getImportOptions(): Promise<ImportOptions> {
    return (await api.get('/employees/import/options')) as unknown as ImportOptions;
}

function body(file: File) {
    const form = new FormData();
    form.append('file', file);
    // Content-Type is left to the browser so it can set the multipart boundary;
    // the client's JSON default would otherwise make the upload unparseable.
    return { form, config: { headers: { 'Content-Type': undefined as never } } };
}

/** Validate and report. Writes nothing. */
export async function previewImport(
    file: File,
    createMissingRoles: boolean,
): Promise<ImportPreview> {
    const { form, config } = body(file);
    return (await api.post(
        `/employees/import/preview?createMissingRoles=${createMissingRoles}`,
        form,
        config,
    )) as unknown as ImportPreview;
}

/**
 * Commit. The file is uploaded a second time rather than the preview being
 * cached — that is what stops a preview being committed against a database it
 * no longer matches.
 */
export async function commitImport(
    file: File,
    createMissingRoles: boolean,
): Promise<{ created: number; skipped: number }> {
    const { form, config } = body(file);
    return (await api.post(
        `/employees/import?createMissingRoles=${createMissingRoles}`,
        form,
        config,
    )) as unknown as { created: number; skipped: number };
}
