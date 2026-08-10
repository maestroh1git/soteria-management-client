'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Upload,
    FileSpreadsheet,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    ArrowLeft,
    Download,
    Users,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useStudentImportOptions } from '@/lib/hooks/use-students';
import {
    previewStudentImport,
    commitStudentImport,
    downloadStudentTemplate,
    type StudentImportPreview,
} from '@/lib/api/students';

/**
 * Bringing a school's existing roll in from a spreadsheet.
 *
 * Two steps: see exactly what would happen, then confirm. One invalid row
 * blocks the whole import — a half-imported roll looks finished, and the
 * children missing from it are found at the wrong moment.
 */
export default function ImportStudentsPage() {
    const router = useRouter();
    const qc = useQueryClient();

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<StudentImportPreview | null>(null);
    const [checking, setChecking] = useState(false);
    const [importing, setImporting] = useState(false);

    const { data: options } = useStudentImportOptions();

    const choose = (f: File | null) => {
        setFile(f);
        setPreview(null); // a new file invalidates the previous check
    };

    const template = async () => {
        try {
            const blob = await downloadStudentTemplate();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'student-roster-template.xlsx';
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Could not build the template');
        }
    };

    const check = async () => {
        if (!file) return;
        setChecking(true);
        try {
            setPreview(await previewStudentImport(file));
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Could not read that file');
        } finally {
            setChecking(false);
        }
    };

    const confirm = async () => {
        if (!file) return;
        setImporting(true);
        try {
            const r = await commitStudentImport(file);
            toast.success(
                `${r.students} student(s) imported · ${r.guardiansCreated} new guardian(s)`,
            );
            qc.invalidateQueries({ queryKey: ['students'] });
            router.push('/students');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Import failed');
        } finally {
            setImporting(false);
        }
    };

    const blocked = !!preview?.errors.length;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/students" aria-label="Back to students">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold">Import the roll</h1>
                    <p className="text-sm text-muted-foreground">
                        Bring an existing register in from a spreadsheet.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">1. Start from the template</CardTitle>
                    <CardDescription>
                        It carries this school’s own class names, so the values in it are
                        the ones the check below will accept.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" onClick={template}>
                        <Download className="mr-2 h-4 w-4" /> Download template
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">2. Upload the filled file</CardTitle>
                    <CardDescription>
                        CSV or Excel. Leave the admission number blank and one will be
                        allocated.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="roll">Roll file</Label>
                        <input
                            id="roll"
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
                        <CardTitle className="text-lg">3. Review</CardTitle>
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

                        {/* The number that matters: siblings must not each create a
                            copy of the same parent, or sibling discounts later fail. */}
                        <div className="flex flex-wrap gap-2 text-sm">
                            <Badge variant="secondary" className="gap-1">
                                <Users className="h-3 w-3" />
                                {preview.newGuardians} new guardian(s)
                            </Badge>
                            {preview.reusedGuardians > 0 && (
                                <Badge variant="outline">
                                    {preview.reusedGuardians} matched to a guardian already on
                                    file
                                </Badge>
                            )}
                            {preview.skip.length > 0 && (
                                <Badge variant="outline">
                                    {preview.skip.length} already on the roll — skipped
                                </Badge>
                            )}
                        </div>

                        {preview.create.length > 0 && (
                            <div className="overflow-x-auto rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium">Adm. No.</th>
                                            <th className="px-3 py-2 text-left font-medium">Name</th>
                                            <th className="px-3 py-2 text-left font-medium">Class</th>
                                            <th className="px-3 py-2 text-left font-medium">Guardian</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.create.map((r) => (
                                            <tr key={r.line} className="border-t">
                                                <td className="px-3 py-2 text-muted-foreground">
                                                    {r.admissionNumber}
                                                </td>
                                                <td className="px-3 py-2">{r.name}</td>
                                                <td className="px-3 py-2">{r.className}</td>
                                                <td className="px-3 py-2">
                                                    {r.guardianName}
                                                    {r.guardianExisting && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            (existing)
                                                        </span>
                                                    )}
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
                                    {preview.create.length} student(s) ready.
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
                                Nothing to import — every child is already on the roll.
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {options && options.classes.length === 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">
                            No classes are set up yet. A roll cannot be imported until the
                            school’s class levels and arms exist — children have to be
                            placed somewhere.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
