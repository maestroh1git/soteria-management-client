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
    Building2,
    Palette,
} from 'lucide-react';
import { BrandingSettings } from '@/components/settings/branding-settings';
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
import { useAuth } from '@/lib/hooks/use-auth';
import { useCan } from '@/lib/hooks/use-can';
import { useMyTenant, useUpdateTenant } from '@/lib/hooks/use-tenant';
import { KybStatus } from '@/lib/types/enums';
import type { Country } from '@/lib/types/api';
import type { PayrollSetting } from '@/lib/api/settings';
import type { UpdateTenantProfileDto } from '@/lib/api/tenants';
import { StatusBadge } from '@/components/common/status-badge';
import { LearnerTermSetting } from '@/components/settings/learner-term-setting';
import { LoanLimitSetting } from '@/components/settings/loan-limit-setting';
import { PageHeader } from '@/components/layout/page-header';
import { useTabParam } from '@/lib/hooks/use-tab-param';
import { useHydrated } from '@/lib/hooks/use-hydrated';

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

const ORG_TABS = ['profile', 'branding', 'countries', 'settings'] as const;
const REFERENCE_TABS = ['countries', 'settings'] as const;

export default function OrganisationPage() {
    const { tenantOrgType } = useAuth();
    const can = useCan();
    const canManageOrg = can('organisation.manage');
    const [tab, setTab] = useTabParam(canManageOrg ? ORG_TABS : REFERENCE_TABS);
    /**
     * Countries and the advanced key/value store have no tenant column: they
     * are reference data every school shares. Editing one edits it for all of
     * them, so the API now takes those writes from the platform only. The
     * controls go with it — a button that is certain to be refused is worse
     * than no button, and this tab is still worth reading.
     */
    const canEditCountries = can('countries.manage');
    const canEditSettings = can('settings.manage');

    const [showCountryDialog, setShowCountryDialog] = useState(false);
    const [showSettingDialog, setShowSettingDialog] = useState(false);
    const [editingCountry, setEditingCountry] = useState<Country | null>(null);
    const [editingSetting, setEditingSetting] = useState<PayrollSetting | null>(null);

    const {
        data: countries,
        isLoading: countriesLoading,
        isError: countriesFailed,
    } = useCountries();
    const {
        data: settings,
        isLoading: settingsLoading,
        isError: settingsFailed,
    } = useSettings();
    // The layout loads the tenant, so it can be cached before this page
    // hydrates; show what the server rendered until then.
    const hydrated = useHydrated();
    const tenantQuery = useMyTenant();
    const myTenant = hydrated ? tenantQuery.data : undefined;
    const tenantLoading = hydrated && tenantQuery.isLoading;
    const updateTenantMutation = useUpdateTenant();

    const createCountryMutation = useCreateCountry();
    const updateCountryMutation = useUpdateCountry();
    const deleteCountryMutation = useDeleteCountry();
    const upsertSettingMutation = useUpsertSetting();
    const deleteSettingMutation = useDeleteSetting();


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


    return (
        <div className="space-y-6">
            <PageHeader
                title="Organisation"
                description="Your organisation’s profile, compliance numbers and branding, and the reference data every school shares. Who can sign in is under Team & access."
            />

            <Tabs value={tab} onValueChange={setTab} className="space-y-6">
                <TabsList>
                    {canManageOrg && (
                        <TabsTrigger value="profile">
                            <Building2 className="mr-2 h-4 w-4" />
                            Profile
                        </TabsTrigger>
                    )}
                    {canManageOrg && (
                        <TabsTrigger value="branding">
                            <Palette className="mr-2 h-4 w-4" />
                            Branding
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="countries">
                        <Globe className="mr-2 h-4 w-4" />
                        Countries
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Advanced
                    </TabsTrigger>
                </TabsList>

                {canManageOrg && (
                    <TabsContent value="branding" className="space-y-4">
                        <BrandingSettings />
                    </TabsContent>
                )}

                {/* ─── Countries ─────────────────────────────────────── */}
                <TabsContent value="countries" className="space-y-4">
                    {canEditCountries ? (
                        <div className="flex justify-end">
                            <Button onClick={() => openCountryDialog()}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Country
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-muted bg-muted/30 p-3 text-sm text-muted-foreground">
                            The country list is shared by every school on the
                            platform, so it is maintained centrally. Contact
                            support if something here is wrong or missing.
                        </div>
                    )}

                    {countriesLoading ? (
                        <LoadingSkeleton rows={4} />
                    ) : countriesFailed || !countries?.length ? (
                        <EmptyState
                            isError={countriesFailed}
                            subject="the countries"
                            title="No countries"
                            description="Add a country to configure currency and tax rules."
                            actionLabel={
                                canEditCountries
                                    ? 'Add Country'
                                    : undefined
                            }
                            onAction={
                                canEditCountries
                                    ? () => openCountryDialog()
                                    : undefined
                            }
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
                                            {canEditCountries && (
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openCountryDialog(country)}
                                                        aria-label={`Edit ${country.name}`}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteCountryMutation.mutate(country.id)}
                                                        className="text-destructive hover:text-destructive"
                                                        aria-label={`Delete ${country.name}`}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ─── Advanced key/value settings ─────────────────────
                    TODO(payroll-settings): this store is not consumed by any
                    payroll calculation yet (see SettingsService in the backend).
                    Either wire it in or remove this tab + the backend module. */}
                <TabsContent value="settings" className="space-y-4">
                    <div className="rounded-lg border border-muted bg-muted/30 p-3 text-sm text-muted-foreground">
                        These are advanced key/value settings and are{' '}
                        <span className="font-medium">not yet used</span> by payroll
                        calculation. Pay is driven by salary components and tax rules — you
                        don&apos;t need to configure anything here to run payroll.
                    </div>
                    {canEditSettings ? (
                        <div className="flex justify-end">
                            <Button onClick={() => openSettingDialog()}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Setting
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-muted bg-muted/30 p-3 text-sm text-muted-foreground">
                            These keys are shared by every school on the
                            platform, so they are maintained centrally.
                        </div>
                    )}

                    {settingsLoading ? (
                        <LoadingSkeleton rows={5} />
                    ) : settingsFailed || !settings?.length ? (
                        <EmptyState
                            isError={settingsFailed}
                            subject="the settings"
                            title="No settings"
                            description="Add payroll configuration settings."
                            actionLabel={
                                canEditSettings
                                    ? 'Add Setting'
                                    : undefined
                            }
                            onAction={
                                canEditSettings
                                    ? () => openSettingDialog()
                                    : undefined
                            }
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
                                                {canEditSettings && (
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openSettingDialog(setting)}
                                                            aria-label={`Edit ${setting.key}`}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => deleteSettingMutation.mutate(setting.id)}
                                                            className="text-destructive hover:text-destructive"
                                                            aria-label={`Delete ${setting.key}`}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </TabsContent>
                {/* ─── Organization ─────────────────────────────────── */}
                {canManageOrg && (
                    <TabsContent value="profile" className="space-y-6">
                        {tenantOrgType === 'SCHOOL' && (
                            <LearnerTermSetting canEdit={can('organisation.manage')} />
                        )}
                        <LoanLimitSetting canEdit={can('organisation.manage')} />
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
                                                <StatusBadge kind="kyb" status={myTenant.kybStatus} />
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 sm:grid-cols-2">
                                        {myTenant?.kybStatus === KybStatus.REJECTED && myTenant.kybRejectionReason && (
                                            <div className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
                                                <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                                                    Your KYB verification was rejected
                                                </p>
                                                <p className="mt-1 text-sm text-red-900 dark:text-red-200">
                                                    {myTenant.kybRejectionReason}
                                                </p>
                                                <p className="mt-1 text-xs text-red-700/80 dark:text-red-400/80">
                                                    Correct the details below and save to resubmit for review.
                                                </p>
                                            </div>
                                        )}
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
                                {/* An example of what to type, not an amount. */}
                                {/* eslint-disable-next-line no-restricted-syntax */}
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

        </div>
    );
}
