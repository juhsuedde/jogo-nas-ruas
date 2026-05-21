import { useState, useRef, type ReactNode } from "react";

interface BottomSheetProps {
  children: ReactNode;
  minimized?: boolean;
  onToggle?: () => void;
  locationButton?: ReactNode;
  radiusSelector?: ReactNode;
}

export function BottomSheet({
  children,
  minimized = false,
  onToggle,
  locationButton,
  radiusSelector,
}: BottomSheetProps) {
  const snaps = [15, 45, 75];
  const [snap, setSnap] = useState(minimized ? 0 : 1);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    setDragOffset(e.clientY - startY.current);
  };
  const onPointerUp = () => {
    if (startY.current === null) return;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const currentPct = snaps[snap] - (dragOffset / vh) * 100;
    const nearest = snaps.reduce(
      (p, c, i) => (Math.abs(c - currentPct) < Math.abs(snaps[p] - currentPct) ? i : p),
      0,
    );
    setSnap(nearest);
    setDragOffset(0);
    setDragging(false);
    startY.current = null;
  };

  const heightVh = minimized ? snaps[0] : snaps[snap];

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[500] rounded-t-3xl bg-card flex flex-col will-change-transform"
      style={{
        height: `${heightVh}vh`,
        transform: `translateY(${dragging ? Math.max(dragOffset, -((100 - heightVh) * 0.01) * (typeof window !== "undefined" ? window.innerHeight : 800)) : 0}px)`,
        transition: dragging
          ? "none"
          : "height 320ms cubic-bezier(.22,1,.36,1), transform 320ms cubic-bezier(.22,1,.36,1)",
        borderTop: "2.5px solid var(--brasil-navy)",
        boxShadow: "0 -6px 0 0 var(--brasil-navy)",
        touchAction: "none",
      }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onToggle}
        className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing select-none"
      >
        <div className="h-1.5 w-12 rounded-full bg-brasil-navy/30" />
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">{children}</div>

      {radiusSelector && <div className="absolute -top-12 left-4">{radiusSelector}</div>}
      {locationButton && <div className="absolute -top-20 right-4">{locationButton}</div>}
    </div>
  );
}
