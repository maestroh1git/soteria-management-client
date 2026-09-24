'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Upload,
    FileSpreadsheet,
    AlertTriangle,
    CheckCircle2,
    Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { ImportPreview } from '@/features/staff/import/api';
import {
    useCommitImport,
    useImportOptions,
    usePreviewImport,
} from '@/features/staff/import/hooks';
import { PageHeader } from '@/components/layout/page-header';

/**
 * Roster upload.
 *
 * Two steps on purpose: choose a file and see exactly what would happen, then
 * confirm. Nothing is written until the second step, and a single invalid row
 * blocks the whole import — a half-imported roster looks finished, and the
 * people missing from it are found when they are not paid.
 */
export default function ImportStaffPage() {
    const router = useRouter();

    const [file, setFile] = useState<File | null>(null);
    const [createMissingRoles, setCreateMissingRoles] = useState(false);
    const [preview, setPreview] = useState<ImportPreview | null>(null);
    const previewMutation = usePreviewImport();
    const commitMutation = useCommitImport();
    const checking = previewMutation.isPending;
    const importing = commitMutation.isPending;

    const { data: options } = useImportOptions();

    const choose = (f: File | null) => {
        setFile(f);
        setPreview(null); // a new file invalidates the previous check
    };

    const check = () => {
        if (!file) return;
        previewMutation.mutate(
            { file, createMissingRoles },
            { onSuccess: (p) => setPreview(p) },
        );
    };

    const confirm = () => {
        if (!file) return;
        commitMutation.mutate(
            { file, createMissingRoles },
            { onSuccess: () => router.push('/employees') },
        );
    };

    const blocked = !!preview?.errors.length;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Import staff"
                description="Upload a CSV or Excel file to create many employees at once."
                crumbs={[{ label: 'Import' }]}
            />

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">1. Choose a file</CardTitle>
                    <CardDescription>
                        The first row must be the column headers. For Excel, the first
                        worksheet is read.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="roster">Roster file</Label>
                        <input
                            id="roster"
                            type="file"
                            accept=".csv,.xlsx,.xlsm"
                            onChange={(e) => choose(e.target.files?.[0] ?? null)}
                            className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:opacity-90"
                        />
                        {file && (
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileSpreadsheet className="h-4 w-4" />
                                {file.name}
                            </p>
                        )}
                    </div>

                    <div className="flex items-start gap-2">
                        <Checkbox
                            id="createRoles"
                            checked={createMissingRoles}
                            onCheckedChange={(v) => {
                                setCreateMissingRoles(!!v);
                                setPreview(null);
                            }}
                        />
                        <div className="grid gap-1 leading-none">
                            <Label htmlFor="createRoles" className="cursor-pointer">
                                Create roles that don&apos;t exist yet
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Otherwise a role the system doesn&apos;t recognise is an
                                error, so a typo can&apos;t quietly become a new job title.
                            </p>
                        </div>
                    </div>

                    <Button onClick={check} disabled={!file || checking}>
                        {checking ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        Check file
                    </Button>
                </CardContent>
            </Card>

            {preview && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">2. Review</CardTitle>
                        <CardDescription>
                            {preview.totalRows} row(s) read. Nothing has been written yet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {blocked && (
                            <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-4">
                                <p className="flex items-center gap-2 font-medium text-destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    {preview.errors.length} problem(s) — nothing will be
                                    imported until these are fixed
                                </p>
                                <ul className="space-y-1 text-sm text-destructive">
                                    {preview.errors.map((e, i) => (
                                        <li key={i}>{e}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {preview.newRoles.length > 0 && (
                            <p className="text-sm">
                                New roles to be created:{' '}
                                {preview.newRoles.map((r) => (
                                    <Badge key={r} variant="secondary" className="mr-1">
                                        {r}
                                    </Badge>
                                ))}
                            </p>
                        )}

                        {preview.skip.length > 0 && (
                            <div className="rounded-md border p-3 text-sm">
                                <p className="font-medium">
                                    {preview.skip.length} already on file — skipped, not
                                    overwritten
                                </p>
                                <p className="text-muted-foreground">
                                    {preview.skip
                                        .map((s) => `${s.employeeNumber} ${s.name}`)
                                        .join(', ')}
                                </p>
                            </div>
                        )}

                        {preview.create.length > 0 && (
                            <div className="overflow-x-auto rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium">#</th>
                                            <th className="px-3 py-2 text-left font-medium">Name</th>
                                            <th className="px-3 py-2 text-left font-medium">Grade</th>
                                            <th className="px-3 py-2 text-left font-medium">Role</th>
                                            <th className="px-3 py-2 text-right font-medium">
                                                Contractual
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.create.map((r) => (
                                            <tr key={r.line} className="border-t">
                                                <td className="px-3 py-2">{r.employeeNumber}</td>
                                                <td className="px-3 py-2">{r.name}</td>
                                                <td className="px-3 py-2">{r.gradeCode}</td>
                                                <td className="px-3 py-2">{r.role}</td>
                                                <td className="px-3 py-2 text-right">
                                                    {r.salary.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {!blocked && preview.create.length > 0 && (
                            <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/30">
                                <p className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    {preview.create.length} employee(s) ready to import.
                                </p>
                                <Button onClick={confirm} disabled={importing}>
                                    {importing && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Import {preview.create.length}
                                </Button>
                            </div>
                        )}

                        {!blocked && preview.create.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                Nothing to import — every row is already on file.
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {options && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Accepted values</CardTitle>
                        <CardDescription>
                            Use these exact grade codes and role names in your file.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <p className="mb-2 text-sm font-medium">Grades (use the code)</p>
                            <div className="flex flex-wrap gap-1">
                                {options.grades.map((g) => (
                                    <Badge key={g.id} variant="outline">
                                        {g.code}
                                    </Badge>
                                ))}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Grade decides who pays welfare and who is exempt from tax —
                                the one field worth double-checking.
                            </p>
                        </div>
                        <div>
                            <p className="mb-2 text-sm font-medium">Roles</p>
                            <div className="flex flex-wrap gap-1">
                                {options.roles.map((r) => (
                                    <Badge key={r.id} variant="outline">
                                        {r.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <p className="mb-1 text-sm font-medium">Required columns</p>
                            <p className="text-xs text-muted-foreground">
                                employee_number, first_name, last_name, email, phone,
                                date_of_birth (YYYY-MM-DD), join_date, role, grade,
                                contractual_salary
                            </p>
                            <p className="mt-2 mb-1 text-sm font-medium">Optional</p>
                            <p className="text-xs text-muted-foreground">
                                middle_name, gender (MALE/FEMALE/OTHER), department,
                                address, bank_name, account_number (10-digit NUBAN),
                                account_name
                            </p>
                            <p className="mt-2 mb-1 text-sm font-medium">
                                Optional — statutory and HR
                            </p>
                            <p className="text-xs text-muted-foreground">
                                nin, bvn, tin, tax_state, lasrra_id, rsa_pin, pfa_name,
                                nhf_number, employment_type, contract_end_date,
                                next_of_kin_name, next_of_kin_phone,
                                next_of_kin_relationship
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Leave any of these out and the import still runs — each
                                staff record then says what it is missing, and why it
                                matters, on the employee’s page.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
