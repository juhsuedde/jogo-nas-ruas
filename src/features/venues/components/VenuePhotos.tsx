import { useRef } from "react";
import { Camera, Trash2, Loader2, ImageIcon } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  useVenuePhotos,
  useUploadVenuePhoto,
  useDeleteVenuePhoto,
} from "@/shared/lib/venue-photos";
import { toast } from "sonner";

export function VenuePhotos({ venueId }: { venueId: string }) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: photos, isLoading } = useVenuePhotos(venueId);
  const upload = useUploadVenuePhoto(venueId);
  const remove = useDeleteVenuePhoto(venueId);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    upload.mutate(file, {
      onSuccess: () => {
        toast.success("Foto enviada!");
        if (fileRef.current) fileRef.current.value = "";
      },
      onError: (err) => {
        toast.error(err.message);
        if (fileRef.current) fileRef.current.value = "";
      },
    });
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm text-brasil-navy tracking-wider flex items-center gap-2">
          <Camera className="size-4" /> Fotos do jogo
        </h3>
        {user && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFile}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={upload.isPending}
              className="text-xs font-bold text-brasil-green flex items-center gap-1 disabled:opacity-50"
            >
              {upload.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Camera className="size-3.5" />
              )}
              {upload.isPending ? "Enviando..." : "Postar foto"}
            </button>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 size-24 rounded-xl bg-brasil-navy/10 animate-pulse"
            />
          ))}
        </div>
      ) : !photos || photos.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
          <ImageIcon className="size-4 shrink-0" />
          <span>Nenhuma foto ainda. Seja o primeiro a postar!</span>
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
          {photos.map((photo) => (
            <div key={photo.id} className="shrink-0 relative group snap-start">
              <img
                src={photo.url}
                alt="Foto do local em dia de jogo"
                className="size-24 rounded-xl object-cover border-2 border-brasil-navy/10"
                loading="lazy"
              />
              {user && user.id === photo.user_id && (
                <button
                  onClick={() =>
                    remove.mutate(photo, {
                      onSuccess: () => toast.success("Foto removida."),
                      onError: () => toast.error("Erro ao remover."),
                    })
                  }
                  disabled={remove.isPending}
                  className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  aria-label="Remover foto"
                >
                  <Trash2 className="size-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground">
        Poste uma foto do local em dia de jogo para mostrar a vibe!
      </p>
    </div>
  );
}
