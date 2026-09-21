'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useTaxStates } from '@/lib/hooks/use-employees';
import { useUpdateMyDetails } from '@/lib/hooks/use-self-service';
import { myDetailsSchema, type MyDetailsValues } from '@/lib/utils/validation';
import type { MyEmployee } from '@/lib/api/self-service';

const LAGOS = 'Lagos';

/**
 * The employee correcting their own record.
 *
 * Only the fields the server's allowlist accepts appear here. That is not a
 * cosmetic choice: bank details are absent because changing where salary lands
 * is the classic payroll fraud and stays with payroll, and name, role, grade
 * and pay are absent because they are the employer's record of the employment,
 * not the employee's description of themselves.
 *
 * Blank fields are sent as omitted rather than empty, so leaving something
 * alone means "not yet", never "delete what HR already has".
 */
export function MyDetailsForm({
    me,
    onDone,
}: {
    me: MyEmployee;
    onDone: () => void;
}) {
    const { data: taxStates = [] } = useTaxStates();
    const save = useUpdateMyDetails();

    const form = useForm<MyDetailsValues>({
        resolver: zodResolver(myDetailsSchema),
        defaultValues: {
            phone: me.phone ?? '',
            address: me.address ?? '',
            nin: me.nin ?? '',
            bvn: me.bvn ?? '',
            tin: me.tin ?? '',
            taxState: me.taxState ?? '',
            lasrraId: me.lasrraId ?? '',
            rsaPin: me.rsaPin ?? '',
            pfaName: me.pfaName ?? '',
            nhfNumber: me.nhfNumber ?? '',
            nextOfKinName: me.nextOfKinName ?? '',
            nextOfKinPhone: me.nextOfKinPhone ?? '',
            nextOfKinRelationship: me.nextOfKinRelationship ?? '',
        },
    });

    const taxState = form.watch('taxState');

    async function onSubmit(values: MyDetailsValues) {
        // Omit blanks rather than sending ''. On this form an empty field means
        // "I haven't got that yet" — it must never overwrite something the
        // employer already holds.
        const dto = Object.fromEntries(
            Object.entries(values)
                .map(([key, value]) => [
                    key,
                    typeof value === 'string' ? value.trim() : value,
                ])
                .filter(([, value]) => value !== '' && value !== undefined),
        );
        await save.mutateAsync(dto);
        onDone();
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                    <Input placeholder="080 1234 5678" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Home address</FormLabel>
                                <FormControl>
                                    <Input placeholder="Where post reaches you" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Separator />

                <div className="space-y-1">
                    <h3 className="text-sm font-medium">Tax</h3>
                    <p className="text-xs text-muted-foreground">
                        What the tax deducted from your pay is filed against.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="tin"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>TIN</FormLabel>
                                <FormControl>
                                    <Input placeholder="Tax Identification Number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="taxState"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>State you live in</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value ?? ''}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a state" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {taxStates.map((state) => (
                                            <SelectItem key={state.name} value={state.name}>
                                                {state.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Your tax is remitted to this state, not to your employer’s.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="nin"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>NIN</FormLabel>
                                <FormControl>
                                    <Input
                                        inputMode="numeric"
                                        maxLength={11}
                                        placeholder="11 digits"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bvn"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>BVN</FormLabel>
                                <FormControl>
                                    <Input
                                        inputMode="numeric"
                                        maxLength={11}
                                        placeholder="11 digits"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Confirms the account your salary is paid into is yours.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Only asked of Lagos residents — it is a Lagos register. */}
                {taxState === LAGOS && (
                    <FormField
                        control={form.control}
                        name="lasrraId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>LASRRA number</FormLabel>
                                <FormControl>
                                    <Input placeholder="From your LASRRA card" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Lagos asks for this alongside your TIN as proof of residency.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <Separator />

                <div className="space-y-1">
                    <h3 className="text-sm font-medium">Pension &amp; housing</h3>
                    <p className="text-xs text-muted-foreground">
                        Where the deductions on your payslip are actually sent.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="rsaPin"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>RSA PIN</FormLabel>
                                <FormControl>
                                    <Input placeholder="PEN100200300400" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="pfaName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Your PFA</FormLabel>
                                <FormControl>
                                    <Input placeholder="Who holds your RSA" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="nhfNumber"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>NHF number</FormLabel>
                            <FormControl>
                                <Input placeholder="If you are enrolled" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Separator />

                <div className="space-y-1">
                    <h3 className="text-sm font-medium">Next of kin</h3>
                    <p className="text-xs text-muted-foreground">
                        Who we should call if something happens to you at work.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField
                        control={form.control}
                        name="nextOfKinName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Full name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="nextOfKinPhone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                    <Input placeholder="A number that will answer" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="nextOfKinRelationship"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Relationship</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Spouse" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <p className="text-xs text-muted-foreground">
                    Your name, role, pay and bank details are not editable here — ask your
                    administrator if one of those is wrong.
                </p>

                <div className="flex items-center justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onDone}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={save.isPending}>
                        {save.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save my details'
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
