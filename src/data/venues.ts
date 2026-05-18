export type Venue = {
  id: string;
  name: string;
  type: "bar" | "restaurante" | "praça";
  address: string;
  lat: number;
  lng: number;
  match: string;
  matchTime: string;
  isBrazilMatch: boolean;
  bigScreen: boolean;
  promo?: string;
  rsvps: number;
  unverified?: boolean;
  city: string;
  phone?: string;
};

export const VENUES: Venue[] = [
  {
    id: "1",
    name: "Boteco do Zé",
    type: "bar",
    address: "Rua Augusta, 1200 — Consolação",
    lat: -23.5558,
    lng: -46.6622,
    match: "Brasil x Argentina",
    matchTime: "16:00",
    isBrazilMatch: true,
    bigScreen: true,
    promo: "Chopp em dobro no gol do Brasil",
    rsvps: 142,
    city: "São Paulo",
    phone: "+5511999990001",
  },
  {
    id: "2",
    name: "Praça Roosevelt",
    type: "praça",
    address: "Praça Franklin Roosevelt — Centro",
    lat: -23.5468,
    lng: -46.6438,
    match: "Brasil x Argentina",
    matchTime: "16:00",
    isBrazilMatch: true,
    bigScreen: true,
    promo: "Telão público da prefeitura",
    rsvps: 890,
    city: "São Paulo",
    unverified: true,
  },
  {
    id: "3",
    name: "Empório Alto dos Pinheiros",
    type: "restaurante",
    address: "R. Vupabussu, 305 — Pinheiros",
    lat: -23.5614,
    lng: -46.6975,
    match: "França x Alemanha",
    matchTime: "13:00",
    isBrazilMatch: false,
    bigScreen: true,
    rsvps: 34,
    city: "São Paulo",
    phone: "+5511999990003",
  },
  {
    id: "4",
    name: "Bar Brahma",
    type: "bar",
    address: "Av. São João, 677 — República",
    lat: -23.544,
    lng: -46.6396,
    match: "Brasil x Argentina",
    matchTime: "16:00",
    isBrazilMatch: true,
    bigScreen: true,
    promo: "Combo torcedor: chopp + porção R$39",
    rsvps: 267,
    city: "São Paulo",
    phone: "+5511999990004",
  },
  {
    id: "5",
    name: "Veloso Bar",
    type: "bar",
    address: "R. Conceição Veloso, 54 — Vila Mariana",
    lat: -23.5897,
    lng: -46.6371,
    match: "Portugal x Espanha",
    matchTime: "10:00",
    isBrazilMatch: false,
    bigScreen: false,
    rsvps: 18,
    city: "São Paulo",
    phone: "+5511999990005",
  },
  {
    id: "6",
    name: "Quitanda da Esquina",
    type: "restaurante",
    address: "R. Aspicuelta, 200 — Vila Madalena",
    lat: -23.553,
    lng: -46.69,
    match: "Brasil x Argentina",
    matchTime: "16:00",
    isBrazilMatch: true,
    bigScreen: true,
    promo: "Feijoada na meia hora",
    rsvps: 76,
    city: "São Paulo",
    unverified: true,
  },
];

export const FILTERS = [
  { id: "today", label: "Hoje" },
  { id: "brazil", label: "Jogos do Brasil" },
  { id: "screen", label: "Telão" },
] as const;

export const RADIUS_OPTIONS = [1, 3, 5, 10, 20] as const;

export type RadiusOption = (typeof RADIUS_OPTIONS)[number];

export const DEFAULT_RADIUS: RadiusOption = 5;

export type FilterId = (typeof FILTERS)[number]["id"];
