import { useState, useRef, type ReactNode } from "react";

export function BottomSheet({ children }: { children: ReactNode }) {
  // Snap heights as vh
  const snaps = [22, 55, 88];
  const [snap, setSnap] = useState(1);
  const startY = useRef<number | null>(null);
  const startSnap = useRef(1);

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    startSnap.current = snap;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    const dy = e.clientY - startY.current;
    const vh = window.innerHeight;
    const currentH = (snaps[startSnap.current] / 100) * vh - dy;
    const targetPct = (currentH / vh) * 100;
    // find nearest snap visually for live feel
    const nearest = snaps.reduce((p, c, i) =>
      Math.abs(c - targetPct) < Math.abs(snaps[p] - targetPct) ? i : p, 0);
    if (nearest !== snap) setSnap(nearest);
  };
  const onPointerUp = () => {
    startY.current = null;
  };

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[500] rounded-t-3xl bg-card transition-[height] duration-300 ease-out flex flex-col"
      style={{
        height: `${snaps[snap]}vh`,
        borderTop: "2.5px solid var(--brasil-navy)",
        boxShadow: "0 -6px 0 0 var(--brasil-navy)",
      }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing touch-none"
      >
        <div className="h-1.5 w-12 rounded-full bg-brasil-navy/30" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6">{children}</div>
    </div>
  );
}
