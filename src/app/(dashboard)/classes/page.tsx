'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Users, CalendarRange, Loader2, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectLabel,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/empty-state';
import { PrerequisiteNotice } from '@/components/onboarding/prerequisite-notice';
import { useCan } from '@/lib/hooks/use-can';
import {
    useClassLevels,
    useClassArms,
    useCreateClassLevel,
    useCreateClassArm,
    useSessions,
    useCreateSession,
    useSetCurrentSession,
    useUpdateSession,
    useTerms,
    useCreateTerm,
    useUpdateTerm,
    useUpdateClassLevel,
    useUpdateClassArm,
    useEducatorOptions,
} from '@/lib/hooks/use-academics';
import type {
    AcademicSession,
    AcademicTerm,
    ClassLevel,
    ClassArm,
} from '@/lib/api/academics';
import { useTabParam } from '@/lib/hooks/use-tab-param';

/**
 * The school's shape: the ladder of levels, the classes on each rung, and the
 * session everything is keyed to.
 *
 * First screen a school needs. Nothing else on the school side works without
 * it — the roll cannot be imported, a child cannot be admitted, and an
 * application cannot name a class.
 */
const CLASSES_TABS = ['classes', 'session'] as const;

function ClassesPageInner() {
    const canManage = useCan()('academics.manage');

    // Which tab is showing lives in the URL, so a deep link (the onboarding
    // "set the academic session" step) can land straight on "Session & terms"
    // instead of always opening on the classes tab.
    const [tab, setTab] = useTabParam(CLASSES_TABS);

    const { data: levels = [], isLoading, isError } = useClassLevels();
    const { data: arms = [] } = useClassArms();
    const { data: sessions = [], isError: sessionsFailed } = useSessions();
    const current = sessions.find((s) => s.isCurrent);
    const { data: terms = [] } = useTerms(current?.id);

    const createLevel = useCreateClassLevel();
    const updateLevel = useUpdateClassLevel();
    const createArm = useCreateClassArm();
    const updateArm = useUpdateClassArm();
    const createSession = useCreateSession();
    const setCurrent = useSetCurrentSession();
    const updateSession = useUpdateSession();
    const createTerm = useCreateTerm();
    const updateTerm = useUpdateTerm();

    const [levelOpen, setLevelOpen] = useState(false);
    const [armOpen, setArmOpen] = useState(false);
    const [sessionOpen, setSessionOpen] = useState(false);
    const [termOpen, setTermOpen] = useState(false);
    // Non-null while the matching dialog is editing rather than creating.
    const [editingSession, setEditingSession] = useState<AcademicSession | null>(null);
    const [editingTerm, setEditingTerm] = useState<AcademicTerm | null>(null);
    const [editingLevel, setEditingLevel] = useState<ClassLevel | null>(null);
    const [editingArm, setEditingArm] = useState<ClassArm | null>(null);

    const [level, setLevel] = useState({ name: '', code: '', sortOrder: '' });
    const [arm, setArm] = useState({
        levelId: '',
        name: '',
        capacity: '',
        formTeacherId: '',
    });

    // Only serving staff can hold a class. A former teacher left on an arm is
    // how a register ends up with nobody able to take it. The picker's own
    // endpoint, not the staff list: a Registrar manages classes and may not
    // read the HR record, and the list 403'd for them.
    const { data: staff = [] } = useEducatorOptions(canManage);

    /*
     * Not every employee is an educator, and a picker that offers the bursar
     * beside the Head Teacher makes the school do the sorting.
     *
     * The school already says who teaches, in its own words: the Academics
     * department holds Educator, Teaching Assistant, Unit Lead and Head
     * Teacher, while Bursar and Administrative Officer sit elsewhere. Reading
     * the department beats matching on role names — the names are the school's
     * to rename, and the first school to use this asked for "Educator" rather
     * than "Teacher".
     *
     * Everyone else is still listed, under their own heading. A school that
     * structures its departments differently, or wants the librarian to hold a
     * register, is not locked out by our guess about their org chart.
     */
    const isEducator = (e: (typeof staff)[number]) =>
        e.department?.toLowerCase() === 'academics';
    const educators = staff.filter(isEducator);
    const others = staff.filter((e) => !isEducator(e));
    const [session, setSession] = useState({
        name: '',
        startDate: '',
        endDate: '',
    });
    const [term, setTerm] = useState({ name: '', startDate: '', endDate: '' });

    const armsFor = (levelId: string) => arms.filter((a) => a.levelId === levelId);

    const openAddSession = () => {
        setEditingSession(null);
        setSession({ name: '', startDate: '', endDate: '' });
        setSessionOpen(true);
    };
    const openEditSession = (s: AcademicSession) => {
        setEditingSession(s);
        setSession({ name: s.name, startDate: s.startDate, endDate: s.endDate });
        setSessionOpen(true);
    };
    const openAddTerm = () => {
        setEditingTerm(null);
        setTerm({ name: '', startDate: '', endDate: '' });
        setTermOpen(true);
    };
    const openEditTerm = (t: AcademicTerm) => {
        setEditingTerm(t);
        setTerm({ name: t.name, startDate: t.startDate, endDate: t.endDate });
        setTermOpen(true);
    };
    const openAddLevel = () => {
        setEditingLevel(null);
        // Default to the next rung rather than leaving it blank behind a "1"
        // placeholder — otherwise every new level reads as position 1 and the
        // ladder ends up in creation order instead of school order.
        setLevel({ name: '', code: '', sortOrder: String(levels.length + 1) });
        setLevelOpen(true);
    };
    const openEditLevel = (l: ClassLevel) => {
        setEditingLevel(l);
        setLevel({
            name: l.name,
            code: l.code ?? '',
            sortOrder: l.sortOrder != null ? String(l.sortOrder) : '',
        });
        setLevelOpen(true);
    };
    const openAddArm = () => {
        setEditingArm(null);
        setArm({ levelId: '', name: '', capacity: '', formTeacherId: '' });
        setArmOpen(true);
    };
    const openEditArm = (a: ClassArm) => {
        setEditingArm(a);
        setArm({
            levelId: a.levelId,
            name: a.name,
            capacity: a.capacity != null ? String(a.capacity) : '',
            formTeacherId: a.formTeacherId ?? '',
        });
        setArmOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
                    <p className="text-muted-foreground">
                        The ladder of levels, the classes on each, and the session they
                        belong to.
                    </p>
                </div>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                    <TabsTrigger value="classes">Levels &amp; classes</TabsTrigger>
                    <TabsTrigger value="session">Session &amp; terms</TabsTrigger>
                </TabsList>

                <TabsContent value="classes" className="space-y-4">
                    {/*
                      A disabled button with a `title` says nothing on a phone
                      and little on a laptop — the first school to use this
                      clicked "Add class", saw nothing happen, and reported that
                      they "could not activate classes". The banner says it
                      where it cannot be missed, and links to the fix.
                    */}
                    {canManage && !isLoading && levels.length === 0 && (
                        <PrerequisiteNotice
                            message="Add a class level first — JSS1, Primary 3. Classes belong to a level, and fees are priced per level."
                            actionLabel="Add level"
                            onAction={openAddLevel}
                        />
                    )}
                    {canManage && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={openAddLevel}>
                                <Plus className="mr-2 h-4 w-4" /> Add level
                            </Button>
                            <Button
                                onClick={openAddArm}
                                disabled={levels.length === 0}
                                title={
                                    levels.length === 0 ? 'Create a level first' : undefined
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add class
                            </Button>
                        </div>
                    )}

                    {isLoading ? (
                        <p className="text-sm text-muted-foreground">Loading…</p>
                    ) : levels.length === 0 ? (
                        <EmptyState
                            isError={isError}
                            subject="the class levels"
                            title="No levels yet"
                            description="A level is a rung on the ladder — Primary 1, JSS1. Classes sit on a level, and children sit in a class."
                        />
                    ) : (
                        <div className="space-y-4">
                            {levels.map((l) => (
                                <Card key={l.id}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-lg">{l.name}</CardTitle>
                                            {l.code && (
                                                <Badge variant="outline" title="Shorthand a roster may use">
                                                    {l.code}
                                                </Badge>
                                            )}
                                            {canManage && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="ml-auto h-7 w-7"
                                                    onClick={() => openEditLevel(l)}
                                                    aria-label="Edit level"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <CardDescription>
                                            {armsFor(l.id).length === 0
                                                ? 'No classes on this level yet — children cannot be placed here.'
                                                : `${armsFor(l.id).length} class(es)`}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {armsFor(l.id).map((a) => (
                                                <div key={a.id} className="flex items-center">
                                                    <Link href={`/classes/${a.id}`}>
                                                        <Button
                                                            variant="outline"
                                                            className={`gap-2 ${canManage ? 'rounded-r-none border-r-0' : ''}`}
                                                        >
                                                            <Users className="h-4 w-4" />
                                                            {l.name} {a.name}
                                                            {/* How full: pupils against seats, and
                                                                a full class says so. */}
                                                            <span
                                                                className={
                                                                    a.capacity !== null && (a.enrolled ?? 0) >= a.capacity
                                                                        ? 'font-medium text-amber-700 dark:text-amber-400'
                                                                        : 'text-muted-foreground'
                                                                }
                                                            >
                                                                ·{' '}
                                                                {a.capacity !== null
                                                                    ? `${a.enrolled ?? 0}/${a.capacity} seats${(a.enrolled ?? 0) >= a.capacity ? ', full' : ''}`
                                                                    : `${a.enrolled ?? 0} pupils`}
                                                            </span>
                                                            {/* A class with nobody on it is a register
                                                                nobody can take, so say so here rather
                                                                than leaving it to be discovered. */}
                                                            <span
                                                                className={
                                                                    a.formTeacherId
                                                                        ? 'text-muted-foreground'
                                                                        : 'text-amber-600 dark:text-amber-400'
                                                                }
                                                            >
                                                                ·{' '}
                                                                {a.formTeacherId
                                                                    ? (a.formTeacherName ?? 'educator set')
                                                                    : 'no educator'}
                                                            </span>
                                                            <ArrowRight className="h-3 w-3" />
                                                        </Button>
                                                    </Link>
                                                    {canManage && (
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="rounded-l-none"
                                                            onClick={() => openEditArm(a)}
                                                            aria-label="Edit class"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="session" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-lg">Academic session</CardTitle>
                                <CardDescription>
                                    Exactly one is current. It is what admissions applies to and
                                    what fees will be billed against.
                                </CardDescription>
                            </div>
                            {canManage && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={openAddSession}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add session
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {sessions.length === 0 ? (
                                <EmptyState
                                    isError={sessionsFailed}
                                    subject="the sessions"
                                    title="No session"
                                    description="Applications cannot be taken until a session is current."
                                />
                            ) : (
                                sessions.map((s) => (
                                    <div
                                        key={s.id}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{s.name}</p>
                                                {s.isCurrent && <Badge>Current</Badge>}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {s.startDate} → {s.endDate}
                                            </p>
                                        </div>
                                        {canManage && (
                                            <div className="flex items-center gap-1">
                                                {!s.isCurrent && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setCurrent.mutate(s.id)}
                                                        disabled={setCurrent.isPending}
                                                    >
                                                        Make current
                                                    </Button>
                                                )}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => openEditSession(s)}
                                                    aria-label="Edit session"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-lg">
                                    Terms {current ? `— ${current.name}` : ''}
                                </CardTitle>
                                <CardDescription>
                                    A term must fall inside its session.
                                </CardDescription>
                            </div>
                            {canManage && current && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={openAddTerm}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add term
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {!current ? (
                                <p className="text-sm text-muted-foreground">
                                    Make a session current first.
                                </p>
                            ) : terms.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No terms yet.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {terms.map((t) => (
                                        <div
                                            key={t.id}
                                            className="flex items-center justify-between rounded-lg border p-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CalendarRange className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{t.name}</span>
                                                {t.isCurrent && <Badge variant="secondary">Current</Badge>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">
                                                    {t.startDate} → {t.endDate}
                                                </span>
                                                {canManage && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => openEditTerm(t)}
                                                        aria-label="Edit term"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ── Dialogs ── */}
            <Dialog
                open={levelOpen}
                onOpenChange={(o) => {
                    setLevelOpen(o);
                    if (!o) setEditingLevel(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingLevel ? 'Edit class level' : 'Add a class level'}
                        </DialogTitle>
                        <DialogDescription>
                            A rung on the ladder. Order matters — it is what promotion
                            follows at the end of a session.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="classes-page-name">Name</Label>
                            <Input id="classes-page-name"
                                placeholder="Primary 1"
                                value={level.name}
                                onChange={(e) => setLevel({ ...level, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="classes-page-shorthand-optional">Shorthand (optional)</Label>
                            <Input id="classes-page-shorthand-optional"
                                placeholder="PRY 1"
                                value={level.code}
                                onChange={(e) => setLevel({ ...level, code: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                What your register calls it. A roster written this way will
                                still import.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="classes-page-position-on-the-ladder">Position on the ladder</Label>
                            <Input id="classes-page-position-on-the-ladder"
                                type="number"
                                placeholder="1"
                                value={level.sortOrder}
                                onChange={(e) =>
                                    setLevel({ ...level, sortOrder: e.target.value })
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setLevelOpen(false);
                                setEditingLevel(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={
                                !level.name.trim() ||
                                createLevel.isPending ||
                                updateLevel.isPending
                            }
                            onClick={async () => {
                                const dto = {
                                    name: level.name.trim(),
                                    code: level.code.trim() || undefined,
                                    sortOrder: level.sortOrder
                                        ? Number(level.sortOrder)
                                        : undefined,
                                };
                                if (editingLevel) {
                                    await updateLevel.mutateAsync({
                                        id: editingLevel.id,
                                        dto,
                                    });
                                } else {
                                    await createLevel.mutateAsync(dto);
                                }
                                setLevel({ name: '', code: '', sortOrder: '' });
                                setLevelOpen(false);
                                setEditingLevel(null);
                            }}
                        >
                            {(createLevel.isPending || updateLevel.isPending) && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {editingLevel ? 'Save changes' : 'Add level'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={armOpen}
                onOpenChange={(o) => {
                    setArmOpen(o);
                    if (!o) setEditingArm(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingArm ? 'Edit class' : 'Add a class'}</DialogTitle>
                        <DialogDescription>
                            An actual roomful of children — JSS1 A, JSS1 B.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="classes-page-level">Level</Label>
                            <Select
                                value={arm.levelId}
                                onValueChange={(v) => setArm({ ...arm, levelId: v })}
                                disabled={!!editingArm}
                            >
                                <SelectTrigger id="classes-page-level">
                                    <SelectValue placeholder="Select a level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {levels.map((l) => (
                                        <SelectItem key={l.id} value={l.id}>
                                            {l.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="classes-page-class-name">Class name</Label>
                            <Input id="classes-page-class-name"
                                placeholder="A"
                                value={arm.name}
                                onChange={(e) => setArm({ ...arm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="classes-page-seats-optional">Seats (optional)</Label>
                            <Input id="classes-page-seats-optional"
                                type="number"
                                placeholder="30"
                                value={arm.capacity}
                                onChange={(e) => setArm({ ...arm, capacity: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enrolment refuses a full class unless you say otherwise.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="classes-page-form-teacher">
                                Educator (optional)
                            </Label>
                            <Select
                                value={arm.formTeacherId || 'none'}
                                onValueChange={(v) =>
                                    setArm({
                                        ...arm,
                                        formTeacherId: v === 'none' ? '' : v,
                                    })
                                }
                            >
                                <SelectTrigger id="classes-page-form-teacher">
                                    <SelectValue placeholder="Nobody yet" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nobody yet</SelectItem>
                                    {educators.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel>Academics</SelectLabel>
                                            {educators.map((e) => (
                                                <SelectItem key={e.id} value={e.id}>
                                                    {e.name}
                                                    {e.role ? ` — ${e.role}` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    )}
                                    {others.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel>Other staff</SelectLabel>
                                            {others.map((e) => (
                                                <SelectItem key={e.id} value={e.id}>
                                                    {e.name}
                                                    {e.role ? ` — ${e.role}` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Whoever takes this class&apos;s register. They see it on
                                My Classes when they sign in, and only they can mark it.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setArmOpen(false);
                                setEditingArm(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={
                                !arm.levelId ||
                                !arm.name.trim() ||
                                createArm.isPending ||
                                updateArm.isPending
                            }
                            onClick={async () => {
                                const capacity = arm.capacity
                                    ? Number(arm.capacity)
                                    : undefined;
                                // '' clears it server-side; undefined would leave
                                // whoever is on the arm already.
                                const formTeacherId = arm.formTeacherId || '';
                                if (editingArm) {
                                    await updateArm.mutateAsync({
                                        id: editingArm.id,
                                        dto: {
                                            name: arm.name.trim(),
                                            capacity,
                                            formTeacherId,
                                        },
                                    });
                                } else {
                                    await createArm.mutateAsync({
                                        levelId: arm.levelId,
                                        name: arm.name.trim(),
                                        capacity,
                                        formTeacherId: formTeacherId || undefined,
                                    });
                                }
                                setArm({
                                    levelId: '',
                                    name: '',
                                    capacity: '',
                                    formTeacherId: '',
                                });
                                setArmOpen(false);
                                setEditingArm(null);
                            }}
                        >
                            {(createArm.isPending || updateArm.isPending) && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {editingArm ? 'Save changes' : 'Add class'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={sessionOpen}
                onOpenChange={(o) => {
                    setSessionOpen(o);
                    if (!o) setEditingSession(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingSession
                                ? 'Edit academic session'
                                : 'Add an academic session'}
                        </DialogTitle>
                        <DialogDescription>
                            A school year, spanning two calendar years.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="classes-page-name-2">Name</Label>
                            <Input id="classes-page-name-2"
                                placeholder="2026/2027"
                                value={session.name}
                                onChange={(e) =>
                                    setSession({ ...session, name: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="classes-page-starts">Starts</Label>
                                <Input id="classes-page-starts"
                                    type="date"
                                    value={session.startDate}
                                    onChange={(e) =>
                                        setSession({ ...session, startDate: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="classes-page-ends">Ends</Label>
                                <Input id="classes-page-ends"
                                    type="date"
                                    value={session.endDate}
                                    onChange={(e) =>
                                        setSession({ ...session, endDate: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        {!editingSession && (
                            <p className="text-xs text-muted-foreground">
                                The first session created becomes current automatically if
                                none is.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSessionOpen(false);
                                setEditingSession(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={
                                !session.name.trim() ||
                                !session.startDate ||
                                !session.endDate ||
                                createSession.isPending ||
                                updateSession.isPending
                            }
                            onClick={async () => {
                                if (editingSession) {
                                    await updateSession.mutateAsync({
                                        id: editingSession.id,
                                        dto: session,
                                    });
                                } else {
                                    await createSession.mutateAsync({
                                        ...session,
                                        isCurrent: sessions.length === 0,
                                    });
                                }
                                setSession({ name: '', startDate: '', endDate: '' });
                                setSessionOpen(false);
                                setEditingSession(null);
                            }}
                        >
                            {(createSession.isPending || updateSession.isPending) && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {editingSession ? 'Save changes' : 'Add session'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={termOpen}
                onOpenChange={(o) => {
                    setTermOpen(o);
                    if (!o) setEditingTerm(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingTerm ? 'Edit term' : 'Add a term'}
                        </DialogTitle>
                        <DialogDescription>
                            Within {current?.name}. Dates outside the session are refused.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="classes-page-name-3">Name</Label>
                            <Input id="classes-page-name-3"
                                placeholder="First Term"
                                value={term.name}
                                onChange={(e) => setTerm({ ...term, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="classes-page-starts-2">Starts</Label>
                                <Input id="classes-page-starts-2"
                                    type="date"
                                    value={term.startDate}
                                    onChange={(e) =>
                                        setTerm({ ...term, startDate: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="classes-page-ends-2">Ends</Label>
                                <Input id="classes-page-ends-2"
                                    type="date"
                                    value={term.endDate}
                                    onChange={(e) =>
                                        setTerm({ ...term, endDate: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setTermOpen(false);
                                setEditingTerm(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={
                                !term.name.trim() ||
                                !term.startDate ||
                                !term.endDate ||
                                createTerm.isPending ||
                                updateTerm.isPending
                            }
                            onClick={async () => {
                                if (editingTerm) {
                                    await updateTerm.mutateAsync({
                                        id: editingTerm.id,
                                        dto: term,
                                    });
                                } else {
                                    await createTerm.mutateAsync({
                                        sessionId: current!.id,
                                        ...term,
                                        sortOrder: terms.length + 1,
                                        isCurrent: terms.length === 0,
                                    });
                                }
                                setTerm({ name: '', startDate: '', endDate: '' });
                                setTermOpen(false);
                                setEditingTerm(null);
                            }}
                        >
                            {(createTerm.isPending || updateTerm.isPending) && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {editingTerm ? 'Save changes' : 'Add term'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// useSearchParams needs a Suspense boundary during static rendering.
export default function ClassesPage() {
    return (
        <Suspense>
            <ClassesPageInner />
        </Suspense>
    );
}
