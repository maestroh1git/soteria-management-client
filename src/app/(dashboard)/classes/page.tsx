'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Users, CalendarRange, Loader2, ArrowRight } from 'lucide-react';

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
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/empty-state';
import { useAuth } from '@/lib/hooks/use-auth';
import {
    useClassLevels,
    useClassArms,
    useCreateClassLevel,
    useCreateClassArm,
    useSessions,
    useCreateSession,
    useSetCurrentSession,
    useTerms,
    useCreateTerm,
} from '@/lib/hooks/use-academics';

/**
 * The school's shape: the ladder of levels, the classes on each rung, and the
 * session everything is keyed to.
 *
 * First screen a school needs. Nothing else on the school side works without
 * it — the roll cannot be imported, a child cannot be admitted, and an
 * application cannot name a class.
 */
export default function ClassesPage() {
    const { hasRole } = useAuth();
    const canManage = hasRole(['tenant_owner', 'ADMIN', 'admissions.registrar']);

    const { data: levels = [], isLoading } = useClassLevels();
    const { data: arms = [] } = useClassArms();
    const { data: sessions = [] } = useSessions();
    const current = sessions.find((s) => s.isCurrent);
    const { data: terms = [] } = useTerms(current?.id);

    const createLevel = useCreateClassLevel();
    const createArm = useCreateClassArm();
    const createSession = useCreateSession();
    const setCurrent = useSetCurrentSession();
    const createTerm = useCreateTerm();

    const [levelOpen, setLevelOpen] = useState(false);
    const [armOpen, setArmOpen] = useState(false);
    const [sessionOpen, setSessionOpen] = useState(false);
    const [termOpen, setTermOpen] = useState(false);

    const [level, setLevel] = useState({ name: '', code: '', sortOrder: '' });
    const [arm, setArm] = useState({ levelId: '', name: '', capacity: '' });
    const [session, setSession] = useState({
        name: '',
        startDate: '',
        endDate: '',
    });
    const [term, setTerm] = useState({ name: '', startDate: '', endDate: '' });

    const armsFor = (levelId: string) => arms.filter((a) => a.levelId === levelId);

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

            <Tabs defaultValue="classes">
                <TabsList>
                    <TabsTrigger value="classes">Levels &amp; classes</TabsTrigger>
                    <TabsTrigger value="session">Session &amp; terms</TabsTrigger>
                </TabsList>

                <TabsContent value="classes" className="space-y-4">
                    {canManage && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setLevelOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Add level
                            </Button>
                            <Button
                                onClick={() => setArmOpen(true)}
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
                                                <Link key={a.id} href={`/classes/${a.id}`}>
                                                    <Button variant="outline" className="gap-2">
                                                        <Users className="h-4 w-4" />
                                                        {l.name} {a.name}
                                                        {a.capacity !== null && (
                                                            <span className="text-muted-foreground">
                                                                · {a.capacity} seats
                                                            </span>
                                                        )}
                                                        <ArrowRight className="h-3 w-3" />
                                                    </Button>
                                                </Link>
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
                                    onClick={() => setSessionOpen(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add session
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {sessions.length === 0 ? (
                                <EmptyState
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
                                        {canManage && !s.isCurrent && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setCurrent.mutate(s.id)}
                                                disabled={setCurrent.isPending}
                                            >
                                                Make current
                                            </Button>
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
                                    onClick={() => setTermOpen(true)}
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
                                            <span className="text-sm text-muted-foreground">
                                                {t.startDate} → {t.endDate}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ── Dialogs ── */}
            <Dialog open={levelOpen} onOpenChange={setLevelOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add a class level</DialogTitle>
                        <DialogDescription>
                            A rung on the ladder. Order matters — it is what promotion
                            follows at the end of a session.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                placeholder="Primary 1"
                                value={level.name}
                                onChange={(e) => setLevel({ ...level, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Shorthand (optional)</Label>
                            <Input
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
                            <Label>Position on the ladder</Label>
                            <Input
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
                        <Button variant="outline" onClick={() => setLevelOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={!level.name.trim() || createLevel.isPending}
                            onClick={async () => {
                                await createLevel.mutateAsync({
                                    name: level.name.trim(),
                                    code: level.code.trim() || undefined,
                                    sortOrder: level.sortOrder
                                        ? Number(level.sortOrder)
                                        : undefined,
                                });
                                setLevel({ name: '', code: '', sortOrder: '' });
                                setLevelOpen(false);
                            }}
                        >
                            {createLevel.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Add level
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={armOpen} onOpenChange={setArmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add a class</DialogTitle>
                        <DialogDescription>
                            An actual roomful of children — JSS1 A, JSS1 B.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Level</Label>
                            <Select
                                value={arm.levelId}
                                onValueChange={(v) => setArm({ ...arm, levelId: v })}
                            >
                                <SelectTrigger>
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
                            <Label>Class name</Label>
                            <Input
                                placeholder="A"
                                value={arm.name}
                                onChange={(e) => setArm({ ...arm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Seats (optional)</Label>
                            <Input
                                type="number"
                                placeholder="30"
                                value={arm.capacity}
                                onChange={(e) => setArm({ ...arm, capacity: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enrolment refuses a full class unless you say otherwise.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setArmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={
                                !arm.levelId || !arm.name.trim() || createArm.isPending
                            }
                            onClick={async () => {
                                await createArm.mutateAsync({
                                    levelId: arm.levelId,
                                    name: arm.name.trim(),
                                    capacity: arm.capacity ? Number(arm.capacity) : undefined,
                                });
                                setArm({ levelId: '', name: '', capacity: '' });
                                setArmOpen(false);
                            }}
                        >
                            {createArm.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Add class
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add an academic session</DialogTitle>
                        <DialogDescription>
                            A school year, spanning two calendar years.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                placeholder="2026/2027"
                                value={session.name}
                                onChange={(e) =>
                                    setSession({ ...session, name: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Starts</Label>
                                <Input
                                    type="date"
                                    value={session.startDate}
                                    onChange={(e) =>
                                        setSession({ ...session, startDate: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Ends</Label>
                                <Input
                                    type="date"
                                    value={session.endDate}
                                    onChange={(e) =>
                                        setSession({ ...session, endDate: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            The first session created becomes current automatically if none
                            is.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSessionOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={
                                !session.name.trim() ||
                                !session.startDate ||
                                !session.endDate ||
                                createSession.isPending
                            }
                            onClick={async () => {
                                await createSession.mutateAsync({
                                    ...session,
                                    isCurrent: sessions.length === 0,
                                });
                                setSession({ name: '', startDate: '', endDate: '' });
                                setSessionOpen(false);
                            }}
                        >
                            {createSession.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Add session
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={termOpen} onOpenChange={setTermOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add a term</DialogTitle>
                        <DialogDescription>
                            Within {current?.name}. Dates outside the session are refused.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                placeholder="First Term"
                                value={term.name}
                                onChange={(e) => setTerm({ ...term, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Starts</Label>
                                <Input
                                    type="date"
                                    value={term.startDate}
                                    onChange={(e) =>
                                        setTerm({ ...term, startDate: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Ends</Label>
                                <Input
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
                        <Button variant="outline" onClick={() => setTermOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={
                                !current ||
                                !term.name.trim() ||
                                !term.startDate ||
                                !term.endDate ||
                                createTerm.isPending
                            }
                            onClick={async () => {
                                await createTerm.mutateAsync({
                                    sessionId: current!.id,
                                    ...term,
                                    sortOrder: terms.length + 1,
                                    isCurrent: terms.length === 0,
                                });
                                setTerm({ name: '', startDate: '', endDate: '' });
                                setTermOpen(false);
                            }}
                        >
                            {createTerm.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Add term
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
