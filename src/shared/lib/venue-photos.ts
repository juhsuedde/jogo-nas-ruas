import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import { validateImage } from "@/shared/lib/upload";

export type VenuePhoto = {
  id: string;
  venue_id: string;
  user_id: string;
  storage_path: string;
  created_at: string;
  url: string;
};

const STORAGE_BUCKET = "venue-images";

function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function useVenuePhotos(venueId: string) {
  return useQuery({
    queryKey: ["venue-photos", venueId],
    queryFn: async (): Promise<VenuePhoto[]> => {
      const { data, error } = await supabase
        .from("venue_photos")
        .select("id, venue_id, user_id, storage_path, created_at")
        .eq("venue_id", venueId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(`Falha ao carregar fotos: ${error.message}`);

      return (data ?? []).map((p) => ({
        ...p,
        url: getPublicUrl(p.storage_path),
      })) as VenuePhoto[];
    },
  });
}

export function useUploadVenuePhoto(venueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const validation = validateImage(file);
      if (!validation.valid) throw new Error(validation.error);

      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Faça login para enviar fotos.");

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const filePath = `${u.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message?.includes("violates row-level security")) {
          throw new Error("Arquivo inválido ou muito grande (máx. 5MB).");
        }
        throw uploadError;
      }

      const { error: dbError } = await supabase.from("venue_photos").insert({
        venue_id: venueId,
        user_id: u.user.id,
        storage_path: filePath,
      });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["venue-photos", venueId] });
    },
  });
}

export function useDeleteVenuePhoto(venueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (photo: VenuePhoto) => {
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([photo.storage_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("venue_photos")
        .delete()
        .eq("id", photo.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["venue-photos", venueId] });
    },
  });
}
