'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Upload, Trash2, Palette } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    useBranding,
    useUpdateBrandingColors,
    useUploadLogo,
    useUploadFavicon,
    useRemoveLogo,
} from '@/lib/hooks/use-branding';
import { brandingImageUrl } from '@/lib/api/branding';
import { ImageCropDialog } from './image-crop-dialog';

function ColorField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={/^#([0-9a-f]{6})$/i.test(value) ? value : '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border bg-transparent p-0.5"
                    aria-label={`${label} swatch`}
                />
                <Input
                    value={value}
                    placeholder="#1D4ED8"
                    className="w-32 font-mono"
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        </div>
    );
}

function ImageUploader({
    label,
    hint,
    url,
    pending,
    onPick,
    onRemove,
    accept,
}: {
    label: string;
    hint: string;
    url: string | null;
    pending: boolean;
    onPick: (file: File) => void;
    onRemove?: () => void;
    accept: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-muted/40">
                    {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={url}
                            alt={label}
                            className="max-h-14 max-w-14 object-contain"
                        />
                    ) : (
                        <Palette className="h-6 w-6 text-muted-foreground" />
                    )}
                </div>
                <div className="space-y-1">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pending}
                            onClick={() => inputRef.current?.click()}
                        >
                            {pending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="mr-2 h-4 w-4" />
                            )}
                            Upload
                        </Button>
                        {url && onRemove && (
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={pending}
                                onClick={onRemove}
                            >
                                <Trash2 className="mr-1 h-4 w-4" />
                                Remove
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    hidden
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onPick(f);
                        e.target.value = '';
                    }}
                />
            </div>
        </div>
    );
}

export function BrandingSettings() {
    const { data: branding } = useBranding();
    const saveColors = useUpdateBrandingColors();
    const uploadLogo = useUploadLogo();
    const uploadFavicon = useUploadFavicon();
    const removeLogo = useRemoveLogo();

    const [primary, setPrimary] = useState('');
    const [accent, setAccent] = useState('');
    const [crop, setCrop] = useState<
        { target: 'logo' | 'favicon'; file: File } | null
    >(null);

    useEffect(() => {
        if (!branding) return;
        setPrimary(branding.primaryColor ?? '');
        setAccent(branding.accentColor ?? '');
    }, [branding]);

    const logoUrl = brandingImageUrl(branding?.logoUrl);
    const faviconUrl = brandingImageUrl(branding?.faviconUrl);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Branding</CardTitle>
                <CardDescription>
                    Your logo, favicon and colours — shown across the app, payslips,
                    invoices and emails.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <ImageUploader
                    label="Logo"
                    hint="PNG, JPEG, WebP or SVG, up to 1 MB."
                    url={logoUrl}
                    pending={uploadLogo.isPending || removeLogo.isPending}
                    onPick={(f) => setCrop({ target: 'logo', file: f })}
                    onRemove={() => removeLogo.mutate()}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                />

                <ImageUploader
                    label="Favicon"
                    hint="A small square icon — PNG, ICO or SVG, up to 256 KB."
                    url={faviconUrl}
                    pending={uploadFavicon.isPending}
                    onPick={(f) => setCrop({ target: 'favicon', file: f })}
                    accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
                />

                <div className="flex flex-wrap items-end gap-6">
                    <ColorField label="Primary colour" value={primary} onChange={setPrimary} />
                    <ColorField label="Accent colour" value={accent} onChange={setAccent} />
                    <Button
                        disabled={saveColors.isPending}
                        onClick={() =>
                            saveColors.mutate({
                                primaryColor: primary,
                                accentColor: accent,
                            })
                        }
                    >
                        {saveColors.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save colours
                    </Button>
                </div>
            </CardContent>

            <ImageCropDialog
                open={!!crop}
                file={crop?.file ?? null}
                title={crop?.target === 'favicon' ? 'Crop favicon' : 'Crop logo'}
                description={
                    crop?.target === 'favicon'
                        ? 'A square icon for the browser tab.'
                        : 'Frame your logo — pick a shape, zoom and reposition.'
                }
                aspectOptions={
                    crop?.target === 'favicon'
                        ? [{ label: 'Square', value: 1 }]
                        : [
                              { label: 'Wide', value: 16 / 9 },
                              { label: 'Square', value: 1 },
                              { label: 'Banner', value: 3 },
                          ]
                }
                maxDim={crop?.target === 'favicon' ? 256 : 640}
                outputName={crop?.target === 'favicon' ? 'favicon.png' : 'logo.png'}
                pending={uploadLogo.isPending || uploadFavicon.isPending}
                onCancel={() => setCrop(null)}
                onApply={(f) => {
                    const done = () => setCrop(null);
                    if (crop?.target === 'favicon') {
                        uploadFavicon.mutate(f, { onSuccess: done });
                    } else {
                        uploadLogo.mutate(f, { onSuccess: done });
                    }
                }}
            />
        </Card>
    );
}
