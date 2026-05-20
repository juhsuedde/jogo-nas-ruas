import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

const AddVenueModalLazy = lazy(() =>
  import("@/features/venues/components/AddVenueModal").then((module) => ({
    default: module.AddVenueModal,
  })),
);

interface LazyAddVenueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (venue: {
    name: string;
    address: any;
    perks: string[];
    matches: string[];
    googlePlaceId: string;
  }) => void;
}

export function LazyAddVenueModal(props: LazyAddVenueModalProps) {
  if (!props.open) return null;

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl px-6 py-8 flex flex-col items-center gap-3 shadow-xl">
            <Loader2 className="w-8 h-8 animate-spin text-brasil-green" />
            <p className="text-sm text-brasil-navy/70 font-medium">Abrindo…</p>
          </div>
        </div>
      }
    >
      <AddVenueModalLazy {...props} />
    </Suspense>
  );
}
