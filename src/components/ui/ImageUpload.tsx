"use client";

import { useState } from "react";
import { Input } from "./Input";
import { Button } from "./Button";
import { useImageUpload } from "@/hooks/useImageUpload";

type BucketType = 'avatars' | 'store-logos' | 'store-banners' | 'tournament-images';

interface ImageUploadProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  bucket: BucketType;
  folderId?: string;
  error?: string;
}

export function ImageUpload({ label, value, onChange, bucket, folderId, error }: ImageUploadProps) {
  const upload = useImageUpload(bucket);
  const [preview, setPreview] = useState(value);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview locale
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      const url = await upload.mutateAsync({ file, options: { folderId } });
      onChange(url);
    } catch (err) {
      // Reset preview on error
      setPreview(value);
      alert((err as Error).message);
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-robert font-medium text-foreground mb-1.5">
          {label}
        </label>
      )}
      <div className="flex gap-3 items-start">
        <Input
          type="url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setPreview(e.target.value);
          }}
          placeholder="https://... oppure carica file"
          error={error}
          className="flex-1"
        />
        <label className="cursor-pointer shrink-0">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
            disabled={upload.isPending}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            asChild
            isLoading={upload.isPending}
            className="whitespace-nowrap"
          >
            <span>📷 Carica</span>
          </Button>
        </label>
      </div>
      {preview && (
        <img 
          src={preview} 
          alt="Preview" 
          className="mt-2 h-20 rounded-lg object-cover border border-white/10" 
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      {upload.isError && (
        <p className="text-xs text-red-500 mt-1">
          {(upload.error as Error)?.message || "Errore durante l'upload"}
        </p>
      )}
    </div>
  );
}
