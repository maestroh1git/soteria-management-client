'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Plus,
    Trash2,
    Pencil,
    Globe,
    Settings as SettingsIcon,
    Save,
    Users,
    Shield,
    UserPlus,
    Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import {
    useCountries,
    useCreateCountry,
    useUpdateCountry,
    useDeleteCountry,
    useSettings,
    useUpsertSetting,
    useDeleteSetting,
} from '@/lib/hooks/use-settings';
import {
    useUsers,
    useCreateUser,
    useUpdateUser,
} from '@/lib/hooks/use-users';
import { useEmployees } from '@/lib/hooks/use-employees';
import { useAuth } from '@/lib/hooks/use-auth';
import { useMyTenant, useUpdateTenant } from '@/lib/hooks/use-tenant';
import { KybStatus, SystemRole } from '@/lib/types/enums';
import type { Country, User } from '@/lib/types/api';
import type { PayrollSetting } from '@/lib/api/settings';
import type { UpdateTenantProfileDto } from '@/lib/api/tenants';

// ── Schemas ─────────────────────────────────────────────────

const countrySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string().min(1, 'Code is required').max(5),
    currencyCode: z.string().min(1, 'Currency code is required').max(5),
    currencySymbol: z.string().min(1, 'Currency symbol is required').max(5),
});
type CountryValues = z.infer<typeof countrySchema>;

const settingSchema = z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string().min(1, 'Value is required'),
    dataType: z.string().min(1, 'Data type is required'),
    description: z.string().min(1, 'Description is required'),
    countryId: z.string().optional(),
});
type SettingValues = z.infer<typeof settingSchema>;

const createUserSchema = z.object({
    employeeId: z.string().min(1, 'Employee is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    systemRoles: z.array(z.string()).min(1, 'At least one role is required'),
});
type CreateUserValues = z.infer<typeof createUserSchema>;

const orgProfileSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    address: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
    logoUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
    primaryColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a hex color e.g. #2563EB')
        .or(z.literal(''))
        .optional(),
    cacNumber: z.string().optional(),
    tinNumber: z.string().optional(),
    vatNumber: z.string().optional(),
    nsitfNumber: z.string().optional(),
    itfNumber: z.string().optional(),
    nhfNumber: z.string().optional(),
});
type OrgProfileValues = z.infer<typeof orgProfileSchema>;

const KYB_STATUS_CONFIG: Record<KybStatus, { label: string; className: string }> = {
    [KybStatus.PENDING]: { label: 'Pending', className: 'bg-gray-100 text-gray-700' },
    [KybStatus.SUBMITTED]: { label: 'Submitted', className: 'bg-yellow-100 text-yellow-800' },
    [KybStatus.VERIFIED]: { label: 'Verified', className: 'bg-green-100 text-green-800' },
    [KybStatus.REJECTED]: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
};

// Role display labels
const ROLE_LABELS: Record<string, string> = {
    [SystemRole.TENANT_OWNER]: 'Owner',
    [SystemRole.ADMIN]: 'Admin',
    [SystemRole.PAYROLL_OFFICER]: 'Payroll Officer',
    [SystemRole.FINANCE_ADMIN]: 'Finance Admin',
    [SystemRole.APPROVER]: 'Approver',
    [SystemRole.VIEWER]: 'Viewer',
    [SystemRole.EMPLOYEE]: 'Employee',
};

const ASSIGNABLE_ROLES = [
    SystemRole.ADMIN,
    SystemRole.PAYROLL_OFFICER,
    SystemRole.FINANCE_ADMIN,
    SystemRole.APPROVER,
    SystemRole.VIEWER,
    SystemRole.EMPLOYEE,
];

export default function SettingsPage() {
    const { hasRole } = useAuth();
    const canManageTeam = hasRole(['tenant_owner', 'ADMIN']);
    const isTenantOwner = hasRole(['tenant_owner']);

    const [showCountryDialog, setShowCountryDialog] = useState(false);
    const [showSettingDialog, setShowSettingDialog] = useState(false);
    const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
    const [showEditRolesDialog, setShowEditRolesDialog] = useState(false);
    const [editingCountry, setEditingCountry] = useState<Country | null>(null);
    const [editingSetting, setEditingSetting] = useState<PayrollSetting | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const { data: countries, isLoading: countriesLoading } = useCountries();
    const { data: settings, isLoading: settingsLoading } = useSettings();
    const { data: users, isLoading: usersLoading } = useUsers();
    const { data: employees } = useEmployees();
    const { data: myTenant, isLoading: tenantLoading } = useMyTenant();
    const updateTenantMutation = useUpdateTenant();

    const createCountryMutation = useCreateCountry();
    const updateCountryMutation = useUpdateCountry();
    const deleteCountryMutation = useDeleteCountry();
    const upsertSettingMutation = useUpsertSetting();
    const deleteSettingMutation = useDeleteSetting();
    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();

    // Employees that don't have a user account yet
    const availableEmployees = (employees || []).filter(
        (emp) => !users?.some((u) => u.employeeId === emp.id),
    );

    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [editRoles, setEditRoles] = useState<string[]>([]);

    const orgProfileForm = useForm<OrgProfileValues>({
        resolver: zodResolver(orgProfileSchema),
        defaultValues: {
            name: myTenant?.name ?? '',
            address: myTenant?.address ?? '',
            phone: myTenant?.phone ?? '',
            website: myTenant?.website ?? '',
            logoUrl: myTenant?.logoUrl ?? '',
            primaryColor: myTenant?.primaryColor ?? '',
            cacNumber: myTenant?.cacNumber ?? '',
            tinNumber: myTenant?.tinNumber ?? '',
            vatNumber: myTenant?.vatNumber ?? '',
            nsitfNumber: myTenant?.nsitfNumber ?? '',
            itfNumber: myTenant?.itfNumber ?? '',
            nhfNumber: myTenant?.nhfNumber ?? '',
        },
    });

    // Sync form when tenant data loads
    useEffect(() => {
        if (myTenant) {
            orgProfileForm.reset({
                name: myTenant.name ?? '',
                address: myTenant.address ?? '',
                phone: myTenant.phone ?? '',
                website: myTenant.website ?? '',
                logoUrl: myTenant.logoUrl ?? '',
                primaryColor: myTenant.primaryColor ?? '',
                cacNumber: myTenant.cacNumber ?? '',
                tinNumber: myTenant.tinNumber ?? '',
                vatNumber: myTenant.vatNumber ?? '',
                nsitfNumber: myTenant.nsitfNumber ?? '',
                itfNumber: myTenant.itfNumber ?? '',
                nhfNumber: myTenant.nhfNumber ?? '',
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myTenant]);

    const countryForm = useForm<CountryValues>({
        resolver: zodResolver(countrySchema),
        defaultValues: { name: '', code: '', currencyCode: '', currencySymbol: '' },
    });

    const settingForm = useForm<SettingValues>({
        resolver: zodResolver(settingSchema),
        defaultValues: { key: '', value: '', dataType: 'string', description: '', countryId: '' },
    });

    const createUserForm = useForm<CreateUserValues>({
        resolver: zodResolver(createUserSchema),
        defaultValues: { employeeId: '', password: '', systemRoles: [] },
    });

    const openCountryDialog = (country?: Country) => {
        if (country) {
            setEditingCountry(country);
            countryForm.reset({
                name: country.name,
                code: country.code,
                currencyCode: country.currencyCode,
                currencySymbol: country.currencySymbol,
            });
        } else {
            setEditingCountry(null);
            countryForm.reset({ name: '', code: '', currencyCode: '', currencySymbol: '' });
        }
        setShowCountryDialog(true);
    };

    const openSettingDialog = (setting?: PayrollSetting) => {
        if (setting) {
            setEditingSetting(setting);
            settingForm.reset({
                key: setting.key,
                value: setting.value,
                dataType: setting.dataType,
                description: setting.description,
                countryId: setting.countryId || '',
            });
        } else {
            setEditingSetting(null);
            settingForm.reset({ key: '', value: '', dataType: 'string', description: '', countryId: '' });
        }
        setShowSettingDialog(true);
    };

    const openCreateUserDialog = () => {
        setSelectedEmployee('');
        setSelectedRoles([]);
        createUserForm.reset({ employeeId: '', password: '', systemRoles: [] });
        setShowCreateUserDialog(true);
    };

    const openEditRolesDialog = (user: User) => {
        setEditingUser(user);
        setEditRoles([...user.systemRoles]);
        setShowEditRolesDialog(true);
    };

    const handleCountrySubmit = countryForm.handleSubmit((data) => {
        if (editingCountry) {
            updateCountryMutation.mutate(
                { id: editingCountry.id, data },
                { onSuccess: () => setShowCountryDialog(false) },
            );
        } else {
            createCountryMutation.mutate(data, {
                onSuccess: () => setShowCountryDialog(false),
            });
        }
    });

    const handleSettingSubmit = settingForm.handleSubmit((data) => {
        const payload = {
            ...data,
            countryId: data.countryId || undefined,
        };
        upsertSettingMutation.mutate(payload, {
            onSuccess: () => setShowSettingDialog(false),
        });
    });

    const handleCreateUserSubmit = () => {
        const emp = availableEmployees.find((e) => e.id === selectedEmployee);
        if (!emp || selectedRoles.length === 0) return;

        const password = createUserForm.getValues('password');
        if (!password || password.length < 6) {
            createUserForm.setError('password', { message: 'Password must be at least 6 characters' });
            return;
        }

        createUserMutation.mutate(
            {
                email: emp.email,
                password,
                firstName: emp.firstName,
                lastName: emp.lastName,
                employeeId: emp.id,
                systemRoles: selectedRoles,
            },
            { onSuccess: () => setShowCreateUserDialog(false) },
        );
    };

    const handleEditRolesSubmit = () => {
        if (!editingUser || editRoles.length === 0) return;
        updateUserMutation.mutate(
            { id: editingUser.id, data: { systemRoles: editRoles } },
            { onSuccess: () => setShowEditRolesDialog(false) },
        );
    };

    const handleToggleActive = (user: User) => {
        updateUserMutation.mutate({
            id: user.id,
            data: { isActive: !user.isActive },
        });
    };

    const handleOrgProfileSubmit = orgProfileForm.handleSubmit((data) => {
        const payload: UpdateTenantProfileDto = {};
        if (data.name) payload.name = data.name;
        if (data.address !== undefined) payload.address = data.address || undefined;
        if (data.phone !== undefined) payload.phone = data.phone || undefined;
        if (data.website !== undefined) payload.website = data.website || undefined;
        if (data.logoUrl !== undefined) payload.logoUrl = data.logoUrl || undefined;
        if (data.primaryColor !== undefined) payload.primaryColor = data.primaryColor || undefined;
        if (data.cacNumber !== undefined) payload.cacNumber = data.cacNumber || undefined;
        if (data.tinNumber !== undefined) payload.tinNumber = data.tinNumber || undefined;
        if (data.vatNumber !== undefined) payload.vatNumber = data.vatNumber || undefined;
        if (data.nsitfNumber !== undefined) payload.nsitfNumber = data.nsitfNumber || undefined;
        if (data.itfNumber !== undefined) payload.itfNumber = data.itfNumber || undefined;
        if (data.nhfNumber !== undefined) payload.nhfNumber = data.nhfNumber || undefined;
        updateTenantMutation.mutate(payload);
    });

    const allRolesForAssignment = isTenantOwner
        ? [SystemRole.TENANT_OWNER, ...ASSIGNABLE_ROLES]
        : ASSIGNABLE_ROLES;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage team, countries and payroll configuration</p>
            </div>

            <Tabs defaultValue={canManageTeam ? 'team' : 'countries'} className="space-y-6">
                <TabsList>
                    {canManageTeam && (
                        <TabsTrigger value="team">
                            <Users className="mr-2 h-4 w-4" />
                            Team
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="countries">
                        <Globe className="mr-2 h-4 w-4" />
                        Countries
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Payroll Settings
                    </TabsTrigger>
                    {canManageTeam && (
                        <TabsTrigger value="organization">
                            <Building2 className="mr-2 h-4 w-4" />
                            Organization
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* ─── Team ─────────────────────────────────────────── */}
                {canManageTeam && (
                    <TabsContent value="team" className="space-y-4">
                        <div className="flex justify-end">
                            <Button onClick={openCreateUserDialog}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add User
                            </Button>
                        </div>

                        {usersLoading ? (
                            <LoadingSkeleton rows={5} />
                        ) : !users?.length ? (
                            <EmptyState
                                title="No team members"
                                description="Create user accounts for your employees to give them system access."
                                actionLabel="Add User"
                                onAction={openCreateUserDialog}
                            />
                        ) : (
                            <div className="rounded-lg border bg-card">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 text-left font-medium">Name</th>
                                            <th className="px-4 py-3 text-left font-medium">Email</th>
                                            <th className="hidden md:table-cell px-4 py-3 text-left font-medium">Employee #</th>
                                            <th className="px-4 py-3 text-left font-medium">Role(s)</th>
                                            <th className="px-4 py-3 text-left font-medium">Status</th>
                                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="px-4 py-3 font-medium">
                                                    {user.firstName} {user.lastName}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                                <td className="hidden md:table-cell px-4 py-3 text-muted-foreground">
                                                    {user.employee?.employeeNumber || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.systemRoles.map((role) => (
                                                            <Badge key={role} variant="outline" className="text-xs">
                                                                {ROLE_LABELS[role] || role}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                                        {user.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEditRolesDialog(user)}
                                                            title="Edit roles"
                                                        >
                                                            <Shield className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleToggleActive(user)}
                                                            className={!user.isActive ? 'text-green-600' : 'text-destructive'}
                                                        >
                                                            {user.isActive ? 'Deactivate' : 'Activate'}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </TabsContent>
                )}

                {/* ─── Countries ─────────────────────────────────────── */}
                <TabsContent value="countries" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => openCountryDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Country
                        </Button>
                    </div>

                    {countriesLoading ? (
                        <LoadingSkeleton rows={4} />
                    ) : !countries?.length ? (
                        <EmptyState
                            title="No countries"
                            description="Add a country to configure currency and tax rules."
                            actionLabel="Add Country"
                            onAction={() => openCountryDialog()}
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {countries.map((country) => (
                                <Card key={country.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">{country.name}</CardTitle>
                                            <Badge variant={country.active ? 'default' : 'secondary'}>
                                                {country.active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1 text-sm text-muted-foreground">
                                                <p>Code: <span className="font-medium text-foreground">{country.code}</span></p>
                                                <p>Currency: <span className="font-medium text-foreground">{country.currencySymbol} ({country.currencyCode})</span></p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openCountryDialog(country)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteCountryMutation.mutate(country.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ─── Payroll Settings ──────────────────────────────── */}
                <TabsContent value="settings" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => openSettingDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Setting
                        </Button>
                    </div>

                    {settingsLoading ? (
                        <LoadingSkeleton rows={5} />
                    ) : !settings?.length ? (
                        <EmptyState
                            title="No settings"
                            description="Add payroll configuration settings."
                            actionLabel="Add Setting"
                            onAction={() => openSettingDialog()}
                        />
                    ) : (
                        <div className="rounded-lg border bg-card">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left font-medium">Key</th>
                                        <th className="px-4 py-3 text-left font-medium">Value</th>
                                        <th className="hidden md:table-cell px-4 py-3 text-left font-medium">Type</th>
                                        <th className="hidden lg:table-cell px-4 py-3 text-left font-medium">Description</th>
                                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {settings.map((setting) => (
                                        <tr key={setting.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="px-4 py-3 font-mono text-sm font-medium">{setting.key}</td>
                                            <td className="px-4 py-3 font-mono text-sm break-all">{setting.value}</td>
                                            <td className="hidden md:table-cell px-4 py-3">
                                                <Badge variant="outline">{setting.dataType}</Badge>
                                            </td>
                                            <td className="hidden lg:table-cell px-4 py-3 max-w-[300px] truncate text-muted-foreground">
                                                {setting.description}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openSettingDialog(setting)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteSettingMutation.mutate(setting.id)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </TabsContent>
                {/* ─── Organization ─────────────────────────────────── */}
                {canManageTeam && (
                    <TabsContent value="organization" className="space-y-6">
                        {tenantLoading ? (
                            <LoadingSkeleton rows={6} />
                        ) : (
                            <form onSubmit={handleOrgProfileSubmit} className="space-y-6">
                                {/* Profile sub-section */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Profile</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="org-name">Organization Name</Label>
                                            <Input id="org-name" {...orgProfileForm.register('name')} />
                                            {orgProfileForm.formState.errors.name && (
                                                <p className="text-xs text-destructive">{orgProfileForm.formState.errors.name.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="org-address">Address</Label>
                                            <Textarea id="org-address" {...orgProfileForm.register('address')} rows={2} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="org-phone">Phone</Label>
                                            <Input id="org-phone" {...orgProfileForm.register('phone')} placeholder="+234 800 000 0000" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="org-website">Website</Label>
                                            <Input id="org-website" {...orgProfileForm.register('website')} placeholder="https://example.com" />
                                            {orgProfileForm.formState.errors.website && (
                                                <p className="text-xs text-destructive">{orgProfileForm.formState.errors.website.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="org-logo">Logo URL</Label>
                                            <Input id="org-logo" {...orgProfileForm.register('logoUrl')} placeholder="https://example.com/logo.png" />
                                            {orgProfileForm.formState.errors.logoUrl && (
                                                <p className="text-xs text-destructive">{orgProfileForm.formState.errors.logoUrl.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="org-color">Primary Color</Label>
                                            <div className="flex gap-2 items-center">
                                                <Input
                                                    id="org-color"
                                                    {...orgProfileForm.register('primaryColor')}
                                                    placeholder="#2563EB"
                                                    className="font-mono"
                                                />
                                                {orgProfileForm.watch('primaryColor') && (
                                                    <div
                                                        className="h-9 w-9 rounded border flex-shrink-0"
                                                        style={{ backgroundColor: orgProfileForm.watch('primaryColor') || undefined }}
                                                    />
                                                )}
                                            </div>
                                            {orgProfileForm.formState.errors.primaryColor && (
                                                <p className="text-xs text-destructive">{orgProfileForm.formState.errors.primaryColor.message}</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* KYB / Compliance sub-section */}
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">KYB / Compliance</CardTitle>
                                            {myTenant && (
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${KYB_STATUS_CONFIG[myTenant.kybStatus]?.className ?? ''}`}>
                                                    {KYB_STATUS_CONFIG[myTenant.kybStatus]?.label ?? myTenant.kybStatus}
                                                </span>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="org-cac">CAC RC Number</Label>
                                            <Input id="org-cac" {...orgProfileForm.register('cacNumber')} placeholder="RC123456" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="org-tin">TIN</Label>
                                            <Input id="org-tin" {...orgProfileForm.register('tinNumber')} placeholder="12345678-0001" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="org-vat">VAT Number</Label>
                                            <Input id="org-vat" {...orgProfileForm.register('vatNumber')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="org-nsitf">NSITF Number</Label>
                                            <Input id="org-nsitf" {...orgProfileForm.register('nsitfNumber')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="org-itf">ITF Number</Label>
                                            <Input id="org-itf" {...orgProfileForm.register('itfNumber')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="org-nhf">NHF Number</Label>
                                            <Input id="org-nhf" {...orgProfileForm.register('nhfNumber')} />
                                        </div>
                                        {myTenant?.kybStatus === KybStatus.PENDING && (
                                            <p className="sm:col-span-2 text-xs text-muted-foreground">
                                                Saving a CAC, TIN, or VAT number will automatically advance your KYB status to <strong>Submitted</strong>.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>

                                <div className="flex justify-end">
                                    <Button type="submit" disabled={updateTenantMutation.isPending}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Organization Profile
                                    </Button>
                                </div>
                            </form>
                        )}
                    </TabsContent>
                )}
            </Tabs>

            {/* ── Country Dialog ──────────────────────────────────── */}
            <Dialog open={showCountryDialog} onOpenChange={setShowCountryDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingCountry ? 'Edit Country' : 'Add Country'}</DialogTitle>
                        <DialogDescription>
                            {editingCountry ? 'Update country details.' : 'Add a new country for payroll configuration.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCountrySubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="country-name">Name</Label>
                            <Input id="country-name" {...countryForm.register('name')} placeholder="Nigeria" />
                            {countryForm.formState.errors.name && (
                                <p className="text-xs text-destructive">{countryForm.formState.errors.name.message}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="country-code">Code</Label>
                                <Input id="country-code" {...countryForm.register('code')} placeholder="NG" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency-code">Currency</Label>
                                <Input id="currency-code" {...countryForm.register('currencyCode')} placeholder="NGN" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency-symbol">Symbol</Label>
                                <Input id="currency-symbol" {...countryForm.register('currencySymbol')} placeholder="₦" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowCountryDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={createCountryMutation.isPending || updateCountryMutation.isPending}>
                                <Save className="mr-2 h-4 w-4" />
                                {editingCountry ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Setting Dialog ──────────────────────────────────── */}
            <Dialog open={showSettingDialog} onOpenChange={setShowSettingDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingSetting ? 'Edit Setting' : 'Add Setting'}</DialogTitle>
                        <DialogDescription>
                            {editingSetting ? 'Update the payroll setting.' : 'Create a new payroll configuration setting.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSettingSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="setting-key">Key</Label>
                                <Input id="setting-key" {...settingForm.register('key')} placeholder="tax_rate_default" />
                                {settingForm.formState.errors.key && (
                                    <p className="text-xs text-destructive">{settingForm.formState.errors.key.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="setting-dataType">Data Type</Label>
                                <Select
                                    value={settingForm.watch('dataType')}
                                    onValueChange={(v) => settingForm.setValue('dataType', v)}
                                >
                                    <SelectTrigger id="setting-dataType">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="string">String</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                        <SelectItem value="boolean">Boolean</SelectItem>
                                        <SelectItem value="json">JSON</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="setting-value">Value</Label>
                            <Input id="setting-value" {...settingForm.register('value')} />
                            {settingForm.formState.errors.value && (
                                <p className="text-xs text-destructive">{settingForm.formState.errors.value.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="setting-desc">Description</Label>
                            <Textarea id="setting-desc" {...settingForm.register('description')} rows={2} />
                            {settingForm.formState.errors.description && (
                                <p className="text-xs text-destructive">{settingForm.formState.errors.description.message}</p>
                            )}
                        </div>
                        {countries?.length ? (
                            <div className="space-y-2">
                                <Label htmlFor="setting-country">Country (optional)</Label>
                                <Select
                                    value={settingForm.watch('countryId') || ''}
                                    onValueChange={(v) => settingForm.setValue('countryId', v === 'none' ? '' : v)}
                                >
                                    <SelectTrigger id="setting-country">
                                        <SelectValue placeholder="All countries" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">All countries</SelectItem>
                                        {countries.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : null}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowSettingDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={upsertSettingMutation.isPending}>
                                <Save className="mr-2 h-4 w-4" />
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Create User Dialog ─────────────────────────────── */}
            <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add User</DialogTitle>
                        <DialogDescription>
                            Create a user account for an employee. They will be required to change their password on first login.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Employee</Label>
                            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableEmployees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName} ({emp.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {availableEmployees.length === 0 && (
                                <p className="text-xs text-muted-foreground">All employees already have user accounts.</p>
                            )}
                        </div>

                        {selectedEmployee && (() => {
                            const emp = availableEmployees.find((e) => e.id === selectedEmployee);
                            if (!emp) return null;
                            return (
                                <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                                    <p><span className="text-muted-foreground">Name:</span> {emp.firstName} {emp.lastName}</p>
                                    <p><span className="text-muted-foreground">Email:</span> {emp.email}</p>
                                    <p><span className="text-muted-foreground">Employee #:</span> {emp.employeeNumber}</p>
                                </div>
                            );
                        })()}

                        <div className="space-y-2">
                            <Label htmlFor="temp-password">Temporary Password</Label>
                            <Input
                                id="temp-password"
                                type="text"
                                {...createUserForm.register('password')}
                                placeholder="Enter temporary password"
                            />
                            {createUserForm.formState.errors.password && (
                                <p className="text-xs text-destructive">{createUserForm.formState.errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>System Roles</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {allRolesForAssignment.map((role) => (
                                    <label key={role} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <Checkbox
                                            checked={selectedRoles.includes(role)}
                                            onCheckedChange={(checked) => {
                                                setSelectedRoles((prev) =>
                                                    checked
                                                        ? [...prev, role]
                                                        : prev.filter((r) => r !== role),
                                                );
                                            }}
                                        />
                                        {ROLE_LABELS[role] || role}
                                    </label>
                                ))}
                            </div>
                            {selectedRoles.length === 0 && (
                                <p className="text-xs text-destructive">At least one role is required</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowCreateUserDialog(false)}>Cancel</Button>
                            <Button
                                onClick={handleCreateUserSubmit}
                                disabled={!selectedEmployee || selectedRoles.length === 0 || createUserMutation.isPending}
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Create User
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Edit Roles Dialog ──────────────────────────────── */}
            <Dialog open={showEditRolesDialog} onOpenChange={setShowEditRolesDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Roles</DialogTitle>
                        <DialogDescription>
                            Update roles for {editingUser?.firstName} {editingUser?.lastName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            {allRolesForAssignment.map((role) => (
                                <label key={role} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <Checkbox
                                        checked={editRoles.includes(role)}
                                        onCheckedChange={(checked) => {
                                            setEditRoles((prev) =>
                                                checked
                                                    ? [...prev, role]
                                                    : prev.filter((r) => r !== role),
                                            );
                                        }}
                                    />
                                    {ROLE_LABELS[role] || role}
                                </label>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowEditRolesDialog(false)}>Cancel</Button>
                            <Button
                                onClick={handleEditRolesSubmit}
                                disabled={editRoles.length === 0 || updateUserMutation.isPending}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Save Roles
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
