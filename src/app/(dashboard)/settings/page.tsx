'use client';

import { useState } from 'react';
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
import type { Country } from '@/lib/types/api';
import type { PayrollSetting } from '@/lib/api/settings';

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

export default function SettingsPage() {
    const [showCountryDialog, setShowCountryDialog] = useState(false);
    const [showSettingDialog, setShowSettingDialog] = useState(false);
    const [editingCountry, setEditingCountry] = useState<Country | null>(null);
    const [editingSetting, setEditingSetting] = useState<PayrollSetting | null>(null);

    const { data: countries, isLoading: countriesLoading } = useCountries();
    const { data: settings, isLoading: settingsLoading } = useSettings();

    const createCountryMutation = useCreateCountry();
    const updateCountryMutation = useUpdateCountry();
    const deleteCountryMutation = useDeleteCountry();
    const upsertSettingMutation = useUpsertSetting();
    const deleteSettingMutation = useDeleteSetting();

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage countries and payroll configuration</p>
            </div>

            <Tabs defaultValue="countries" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="countries">
                        <Globe className="mr-2 h-4 w-4" />
                        Countries
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Payroll Settings
                    </TabsTrigger>
                </TabsList>

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
                                            <Badge variant={country.isActive ? 'default' : 'secondary'}>
                                                {country.isActive ? 'Active' : 'Inactive'}
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
        </div>
    );
}
