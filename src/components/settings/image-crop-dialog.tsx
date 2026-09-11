'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Loader2, ZoomIn } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AspectOption {
    label: string;
    value: number;
}

/** Render the chosen crop of `src` to a PNG File, downscaled so the longest
 *  side is at most `maxDim`. PNG keeps any transparency (logos on coloured
 *  headers) and is always embeddable in the payslip/invoice PDFs. */
async function croppedToFile(
    src: string,
    area: Area,
    maxDim: number,
    name: string,
): Promise<File> {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Could not read image'));
        el.src = src;
    });

    const scale = Math.min(1, maxDim / Math.max(area.width, area.height));
    const outW = Math.max(1, Math.round(area.width * scale));
    const outH = Math.max(1, Math.round(area.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not render image');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, outW, outH);

    const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Could not render image'))),
            'image/png',
        ),
    );
    return new File([blob], name, { type: 'image/png' });
}

export function ImageCropDialog({
    open,
    file,
    title,
    description,
    aspectOptions,
    maxDim,
    outputName,
    pending = false,
    onCancel,
    onApply,
}: {
    open: boolean;
    file: File | null;
    title: string;
    description?: string;
    aspectOptions: AspectOption[];
    maxDim: number;
    outputName: string;
    pending?: boolean;
    onCancel: () => void;
    onApply: (file: File) => void;
}) {
    const src = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
    useEffect(() => {
        return () => {
            if (src) URL.revokeObjectURL(src);
        };
    }, [src]);

    const [aspect, setAspect] = useState(aspectOptions[0]?.value ?? 1);
    const [zoom, setZoom] = useState(1);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [area, setArea] = useState<Area | null>(null);
    const [rendering, setRendering] = useState(false);

    // A fresh image resets the frame; the first aspect option is the default.
    useEffect(() => {
        if (open) {
            setAspect(aspectOptions[0]?.value ?? 1);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
            setArea(null);
        }
        // aspectOptions is a fresh array each render; key off its shape via open.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, file]);

    const onCropComplete = useCallback((_: Area, pixels: Area) => {
        setArea(pixels);
    }, []);

    const apply = async () => {
        if (!src || !area) return;
        setRendering(true);
        try {
            const out = await croppedToFile(src, area, maxDim, outputName);
            onApply(out);
        } finally {
            setRendering(false);
        }
    };

    const busy = rendering || pending;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && !busy && onCancel()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>

                <div className="relative h-72 w-full overflow-hidden rounded-md bg-neutral-900">
                    {src && (
                        <Cropper
                            image={src}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            minZoom={1}
                            maxZoom={5}
                            restrictPosition={false}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                        />
                    )}
                </div>

                <div className="space-y-3">
                    {aspectOptions.length > 1 && (
                        <div className="flex flex-wrap gap-1.5">
                            {aspectOptions.map((o) => (
                                <Button
                                    key={o.label}
                                    type="button"
                                    variant={o.value === aspect ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setAspect(o.value)}
                                >
                                    {o.label}
                                </Button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <input
                            type="range"
                            min={1}
                            max={5}
                            step={0.01}
                            value={zoom}
                            aria-label="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="h-1.5 w-full cursor-pointer accent-primary"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Drag to reposition, and use the slider to zoom in.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onCancel} disabled={busy}>
                        Cancel
                    </Button>
                    <Button onClick={apply} disabled={busy || !area}>
                        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Apply &amp; upload
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
