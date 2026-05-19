import { memo } from "react";
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

const searchIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:40px;height:40px;border-radius:50% 50% 50% 0;
    background:#FFDF00;
    border:3px solid #0A2540;
    transform:rotate(-45deg);
    box-shadow:3px 3px 0 #0A2540;
    display:flex;align-items:center;justify-content:center;">
    <div style="transform:rotate(45deg);color:#0A2540;font-weight:900;font-size:20px;">📍</div>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 0.8 });
  }, [lat, lng, map]);
  return null;
}

function MapViewComponent({
  venues,
  activeId,
  onSelect,
  center,
  zoom,
  selectedPlace,
}: {
  venues: Venue[];
  activeId: string | null;
  onSelect: (id: string) => void;
  center?: [number, number];
  zoom?: number;
  selectedPlace?: { lat: number; lng: number; name: string } | null;
}) {
  const active = venues.find((v) => v.id === activeId);
  return (
    <MapContainer
      center={center ?? [-23.5558, -46.6622]}
      zoom={zoom ?? 13}
      zoomControl={false}
      className="absolute inset-0 h-full w-full"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      {venues.map((v) => (
        <Marker
          key={v.id}
          position={[v.lat, v.lng]}
          icon={v.id === activeId ? activeIcon : greenIcon}
          eventHandlers={{ click: () => onSelect(v.id) }}
        />
      ))}
      {selectedPlace && selectedPlace.lat !== 0 && (
        <Marker position={[selectedPlace.lat, selectedPlace.lng]} icon={searchIcon} />
      )}
      {active && <FlyTo lat={active.lat} lng={active.lng} />}
      {selectedPlace && selectedPlace.lat !== 0 && (
        <FlyTo lat={selectedPlace.lat} lng={selectedPlace.lng} />
      )}
    </MapContainer>
  );
}

export const MapView = memo(MapViewComponent);
