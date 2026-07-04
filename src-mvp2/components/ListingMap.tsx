import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Listing } from '../data/listings';
import { formatPriceShort } from '../data/listings';

interface Props {
  listings: Listing[];
  selectedId: number;
  onSelect: (id: number) => void;
}

interface MiniMapProps {
  lat: number;
  lng: number;
}

function pinIcon(listing: Listing, active: boolean): L.DivIcon {
  return L.divIcon({
    className: 'map-pin-wrap',
    html: `<div class="map-pin${active ? ' active' : ''}">${formatPriceShort(listing.price)}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export default function ListingMap({ listings, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});
  // Keep the latest onSelect without re-binding markers on every render.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control
      .attribution({ position: 'bottomleft', prefix: false })
      .addAttribution('© OpenStreetMap · © CARTO')
      .addTo(map);

    listings.forEach((l) => {
      const marker = L.marker([l.lat, l.lng], {
        icon: pinIcon(l, l.id === selectedId),
      })
        .addTo(map)
        .on('click', () => onSelectRef.current(l.id));
      markersRef.current[l.id] = marker;
    });

    const bounds = L.latLngBounds(listings.map((l) => [l.lat, l.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48] });

    // The container is laid out via flexbox; make sure Leaflet measures it.
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
    // Intentionally run once; markers/selection are updated in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to selection changes: restyle pins, raise the active one, recenter.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    listings.forEach((l) => {
      const marker = markersRef.current[l.id];
      if (!marker) return;
      const active = l.id === selectedId;
      marker.setIcon(pinIcon(l, active));
      marker.setZIndexOffset(active ? 1000 : 0);
      if (active) map.panTo([l.lat, l.lng], { animate: true, duration: 0.4 });
    });
  }, [selectedId, listings]);

  return <div className="home-map" ref={containerRef} />;
}

export function MiniListingMap({ lat, lng }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: false,
      keyboard: false,
      touchZoom: true,
      tapHold: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.circleMarker([lat, lng], {
      radius: 7,
      color: '#2F55E7',
      weight: 2,
      fillColor: '#2F55E7',
      fillOpacity: 0.95,
    }).addTo(map);

    map.setView([lat, lng], 14, { animate: false });
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  return <div className="mini-listing-map" ref={containerRef} />;
}
