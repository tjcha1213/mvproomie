import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Listing } from '../data/listings';
import { formatPriceShort } from '../data/listings';

interface Props {
  listings: Listing[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onOpenListing: (listing: Listing) => void;
  bottomInset: number;
  topInset: number;
  sheetMode: 'peek' | 'mid' | 'full';
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

function tooltipHtml(listing: Listing): string {
  return `
    <div class="map-listing-tooltip">
      <div class="map-listing-tooltip-thumb">
        <img src="${listing.image}" alt="${listing.title}" />
      </div>
      <div class="map-listing-tooltip-body">
        <div class="map-listing-tooltip-title">${listing.title}</div>
        <div class="map-listing-tooltip-meta">${listing.location}</div>
        <div class="map-listing-tooltip-price">₱${listing.price.toLocaleString()} / month</div>
      </div>
    </div>
  `;
}

export default function ListingMap({ listings, selectedId, onSelect, onOpenListing, bottomInset, topInset, sheetMode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});
  const suppressNextMapClearRef = useRef(false);
  const listingsRef = useRef(listings);
  listingsRef.current = listings;
  const selectedIdRef = useRef<number | null>(selectedId);
  selectedIdRef.current = selectedId;
  // Keep the latest onSelect without re-binding markers on every render.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onOpenListingRef = useRef(onOpenListing);
  onOpenListingRef.current = onOpenListing;

  const wireTooltipNavigation = (marker: L.Marker, listing: Listing) => {
    marker.on('tooltipopen', () => {
      const tooltipEl = marker.getTooltip()?.getElement();
      if (!tooltipEl) return;

      L.DomEvent.disableClickPropagation(tooltipEl);
      L.DomEvent.disableScrollPropagation(tooltipEl);
      L.DomEvent.on(tooltipEl, 'mousedown', () => {
        suppressNextMapClearRef.current = true;
      });
      L.DomEvent.on(tooltipEl, 'touchstart', () => {
        suppressNextMapClearRef.current = true;
      });
      L.DomEvent.on(tooltipEl, 'click', (event) => {
        suppressNextMapClearRef.current = true;
        L.DomEvent.stop(event);
        onOpenListingRef.current(listing);
      });
    });
  };

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
      wireTooltipNavigation(marker, l);
      markersRef.current[l.id] = marker;
    });

    map.on('click', (event: L.LeafletMouseEvent & { originalEvent?: MouseEvent }) => {
      const target = event.originalEvent?.target;
      if (target instanceof HTMLElement && target.closest('.map-listing-tooltip-wrap')) {
        const listing = listingsRef.current.find((item) => item.id === selectedIdRef.current);
        if (listing) {
          onOpenListingRef.current(listing);
          return;
        }
      }
      if (suppressNextMapClearRef.current) {
        suppressNextMapClearRef.current = false;
        return;
      }
      onSelectRef.current(null);
    });

    // Use a fixed center + zoom so the view isn't zoomed out to fit all pins.
    // Metro Manila center; zoom 13 shows the whole metro at a comfortable density.
    map.setView([14.5995, 121.0244], 11, { animate: false });

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

  // Rebuild markers when the listing set changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    listings.forEach((l) => {
      const marker = L.marker([l.lat, l.lng], {
        icon: pinIcon(l, l.id === selectedId),
      })
        .addTo(map)
        .on('click', () => onSelectRef.current(l.id));
      wireTooltipNavigation(marker, l);
      markersRef.current[l.id] = marker;
    });

    // Don't re-fit bounds on every listing/selection change — keep the current view.
  }, [listings, selectedId, sheetMode, topInset, bottomInset]);

  // React to selection changes: restyle pins, raise the active one, recenter.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || listings.length === 0) return;
    map.invalidateSize();
    listings.forEach((l) => {
      const marker = markersRef.current[l.id];
      if (!marker) return;
      const active = l.id === selectedId;
      marker.setIcon(pinIcon(l, active));
      marker.setZIndexOffset(active ? 1000 : 0);
      if (active && sheetMode === 'peek') {
        marker
          .bindTooltip(tooltipHtml(l), {
            direction: 'top',
            offset: [0, -18],
            opacity: 1,
            permanent: true,
            interactive: true,
            className: 'map-listing-tooltip-wrap',
          })
          .openTooltip();
      } else {
        marker.closeTooltip();
        marker.unbindTooltip();
      }
      if (active) {
        const selectedPoint = map.project([l.lat, l.lng], map.getZoom());
        const visibleOffset =
          sheetMode === 'peek'
            ? 0
            : (Math.max(0, topInset) - Math.max(0, bottomInset)) / 2;
        const centeredPoint = selectedPoint.add([0, visibleOffset]);
        map.panTo(map.unproject(centeredPoint, map.getZoom()), { animate: true, duration: 0.4 });
      }
    });
  }, [selectedId, listings, bottomInset, topInset, sheetMode]);

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
