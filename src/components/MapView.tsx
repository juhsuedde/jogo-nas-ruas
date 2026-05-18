import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { Venue } from "@/data/venues";

const greenIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:36px;height:36px;border-radius:50% 50% 50% 0;
    background:oklch(0.58 0.16 145);
    border:2.5px solid oklch(0.32 0.13 265);
    transform:rotate(-45deg);
    box-shadow:2px 2px 0 oklch(0.32 0.13 265);
    display:flex;align-items:center;justify-content:center;">
    <div style="transform:rotate(45deg);color:oklch(0.88 0.18 95);font-weight:900;font-size:18px;">⚽</div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const activeIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:46px;height:46px;border-radius:50% 50% 50% 0;
    background:oklch(0.88 0.18 95);
    border:3px solid oklch(0.32 0.13 265);
    transform:rotate(-45deg);
    box-shadow:3px 3px 0 oklch(0.32 0.13 265);
    display:flex;align-items:center;justify-content:center;">
    <div style="transform:rotate(45deg);color:oklch(0.32 0.13 265);font-weight:900;font-size:22px;">⚽</div>
  </div>`,
  iconSize: [46, 46],
  iconAnchor: [23, 46],
});

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 0.8 });
  }, [lat, lng, map]);
  return null;
}

export function MapView({
  venues,
  activeId,
  onSelect,
}: {
  venues: Venue[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const active = venues.find((v) => v.id === activeId);
  return (
    <MapContainer
      center={[-23.5558, -46.6622]}
      zoom={13}
      zoomControl={false}
      className="absolute inset-0 h-full w-full"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {venues.map((v) => (
        <Marker
          key={v.id}
          position={[v.lat, v.lng]}
          icon={v.id === activeId ? activeIcon : greenIcon}
          eventHandlers={{ click: () => onSelect(v.id) }}
        />
      ))}
      {active && <FlyTo lat={active.lat} lng={active.lng} />}
    </MapContainer>
  );
}
