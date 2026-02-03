import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

type BucketType = 'avatars' | 'store-logos' | 'store-banners' | 'tournament-images';

interface UploadOptions {
  folderId?: string; // For organizing files by user/store/tournament ID
}

export function useImageUpload(bucket: BucketType) {
  const supabase = createClient();

  const uploadMutation = useMutation({
    mutationFn: async ({ file, options }: { file: File; options?: UploadOptions }) => {
      // Validazione
      if (!file.type.startsWith('image/')) {
        throw new Error('Il file deve essere un\'immagine');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File troppo grande (max 5MB)');
      }

      // Costruisci path con folder opzionale
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const path = options?.folderId ? `${options.folderId}/${fileName}` : fileName;

      // Upload
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return publicUrl;
    },
  });

  return uploadMutation;
}
