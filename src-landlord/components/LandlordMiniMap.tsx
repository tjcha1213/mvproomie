import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Unit } from '../data';
import { formatPesoShort } from '../data';

interface Props {
  units: Unit[];
}

function statusPinClass(status: Unit['status']) {
  if (status === 'Occupied') return 'landlord-map-pin pin-occupied';
  if (status === 'Active') return 'landlord-map-pin pin-active';
  return 'landlord-map-pin pin-draft';
}

function pinIcon(unit: Unit, activeId: number | null): L.DivIcon {
  const active = unit.id === activeId;
  return L.divIcon({
    className: 'map-pin-wrap',
    html: `<div class="${statusPinClass(unit.status)}${active ? ' active' : ''}">${formatPesoShort(unit.price)}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export default function LandlordMiniMap({ units }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});
  const [activeId, setActiveId] = useState<number | null>(units[0]?.id ?? null);

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

    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || units.length === 0) return;

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    units.forEach((unit) => {
      const marker = L.marker([unit.lat, unit.lng], {
        icon: pinIcon(unit, activeId),
      })
        .addTo(map)
        .on('click', () => setActiveId(unit.id));

      marker.bindTooltip(
        `<div class="landlord-map-tooltip"><strong>${unit.title}</strong><span>${unit.location}</span><span>${unit.status} · ${formatPesoShort(unit.price)}</span></div>`,
        { direction: 'top', offset: [0, -16] },
      );

      markersRef.current[unit.id] = marker;
    });

    const bounds = L.latLngBounds(units.map((unit) => [unit.lat, unit.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [units, activeId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || activeId === null) return;
    const activeUnit = units.find((unit) => unit.id === activeId);
    if (!activeUnit) return;
    map.panTo([activeUnit.lat, activeUnit.lng], { animate: true, duration: 0.35 });
    units.forEach((unit) => {
      const marker = markersRef.current[unit.id];
      if (!marker) return;
      const active = unit.id === activeId;
      marker.setIcon(pinIcon(unit, activeId));
      marker.setZIndexOffset(active ? 1000 : 0);
    });
  }, [activeId, units]);

  const activeUnit = units.find((unit) => unit.id === activeId) ?? units[0] ?? null;

  return (
    <div className="landlord-map-shell">
      <div className="landlord-map-frame">
        <div className="home-map" ref={containerRef} />
      </div>
      {activeUnit && (
        <div className="landlord-map-legend">
          <div className="landlord-map-legend-row">
            <span className="landlord-map-badge is-active">Active</span>
            <span className="landlord-map-badge is-occupied">Occupied</span>
            <span className="landlord-map-badge is-draft">Draft</span>
          </div>
          <div className="landlord-map-focus">
            <strong>{activeUnit.title}</strong>
            <span>{activeUnit.location}</span>
          </div>
        </div>
      )}
    </div>
  );
}
