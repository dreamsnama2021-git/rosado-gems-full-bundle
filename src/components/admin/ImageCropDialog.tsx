"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ZoomIn, RotateCcw } from "lucide-react";

type Point = { x: number; y: number };
type Area = { x: number; y: number; width: number; height: number };

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.src = url;
  });
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  contentType: string,
  fileName: string,
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported by this browser.");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  const outType = contentType.startsWith("image/") ? contentType : "image/jpeg";

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Cropping produced an empty image."));
        resolve(new File([blob], fileName, { type: outType }));
      },
      outType,
      0.92,
    );
  });
}

interface ImageCropDialogProps {
  open: boolean;
  imageUrl: string;
  fileName: string;
  contentType: string;
  aspect?: number;
  onClose: () => void;
  onConfirm: (file: File) => void;
}

export function ImageCropDialog({
  open,
  imageUrl,
  fileName,
  contentType,
  aspect = 1,
  onClose,
  onConfirm,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setProcessing(false);
    }
  }, [open]);

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const file = await getCroppedImg(imageUrl, croppedAreaPixels, contentType, fileName);
      onConfirm(file);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cropping failed");
    } finally {
      setProcessing(false);
    }
  }, [croppedAreaPixels, imageUrl, contentType, fileName, onConfirm]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop & resize image</DialogTitle>
          <DialogDescription>
            Drag to position the image and use the slider to zoom. Confirm when you’re ready to upload.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-80 w-full overflow-hidden rounded-md bg-muted">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            showGrid={true}
          />
        </div>

        <div className="flex items-center gap-3">
          <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.05}
            onValueChange={([v]) => setZoom(v)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); }}
            disabled={processing}
            aria-label="Reset crop"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!croppedAreaPixels || processing}
          >
            {processing ? "Processing…" : "Confirm upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { ImageCropDialogProps };
