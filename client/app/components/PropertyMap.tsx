'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import listingData from '../data/listing.json';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Property {
    property_id: string;
    list_price: number;
    address: { street_number: string; street: string; unit: string | null; city: string; state_code: string; postal_code: string; latitude: number; longitude: number };
    description: { beds: number; baths: number; sqft_living: number; lot_size: number; year_built: number; property_type: string };
    photo: string; status: string; listing_id: string;
    agent: { name: string; office: string };
    open_house: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_PROPS: Property[] = (listingData as any).data.properties;
const CITIES = ['All Cities', ...Array.from(new Set(ALL_PROPS.map(p => p.address.city))).sort()];
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE';
const MAP_STYLES = {
    dark: 'mapbox://styles/mapbox/dark-v11',
    light: 'mapbox://styles/mapbox/light-v11',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPrice = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;
const priceColor = (n: number) => n > 1_000_000 ? '#a855f7' : n > 500_000 ? '#f59e0b' : '#22c55e';
const fmtType = (t: string) => t.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const buildGeoJSON = (props: Property[]) => ({
    type: 'FeatureCollection' as const,
    features: props.map(p => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [p.address.longitude, p.address.latitude] },
        properties: { id: p.property_id },
    })),
});

// ─── Shared class strings ─────────────────────────────────────────────────────
const glassPanel = 'bg-[rgba(10,11,24,0.88)] backdrop-blur-[16px] border border-[rgba(99,102,241,0.18)]';
const selectCls = 'bg-indigo-500/10 border border-indigo-500/20 rounded-[10px] text-slate-100 text-xs font-medium px-2.5 py-[7px] outline-none cursor-pointer';

function tabBtn(active: boolean) {
    return `px-2.5 py-[5px] rounded-lg text-[11px] font-semibold border cursor-pointer transition-all duration-150 ${active ? 'bg-indigo-500/25 border-indigo-500 text-indigo-300' : 'bg-transparent border-white/10 text-slate-500 hover:text-slate-400'
        }`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PropertyMap() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<Map<string, { marker: any; el: HTMLElement }>>(new Map());
    const filteredRef = useRef<Property[]>(ALL_PROPS);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mapStyleRef = useRef<keyof typeof MAP_STYLES>('dark');

    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedProp, setSelectedProp] = useState<Property | null>(null);
    const [hoveredProp, setHoveredProp] = useState<Property | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [minBeds, setMinBeds] = useState(0);
    const [selectedCity, setSelectedCity] = useState('All Cities');
    const [priceMin, setPriceMin] = useState(300_000);
    const [priceMax, setPriceMax] = useState(2_200_000);
    const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('dark');
    const [is3D, setIs3D] = useState(true);
    const [mapZoom, setMapZoom] = useState(13);
    const [sidebarVisible, setSidebarVisible] = useState(false);

    const filtered = ALL_PROPS.filter(p =>
        p.list_price >= priceMin && p.list_price <= priceMax &&
        (minBeds === 0 || p.description.beds >= minBeds) &&
        (selectedCity === 'All Cities' || p.address.city === selectedCity)
    );
    filteredRef.current = filtered;

    // ─── Map layer helpers ───────────────────────────────────────────────────────
    function addLayers(map: any) {
        if (!map.getSource('listings')) {
            map.addSource('listings', { type: 'geojson', data: buildGeoJSON(filteredRef.current), cluster: true, clusterMaxZoom: 11, clusterRadius: 50 });
        }
        if (!map.getLayer('clusters')) {
            map.addLayer({
                id: 'clusters', type: 'circle', source: 'listings', filter: ['has', 'point_count'],
                paint: { 'circle-color': ['step', ['get', 'point_count'], '#22c55e', 10, '#f59e0b', 20, '#a855f7'], 'circle-radius': ['step', ['get', 'point_count'], 24, 10, 34, 20, 44], 'circle-opacity': 0.88, 'circle-stroke-width': 2, 'circle-stroke-color': 'rgba(255,255,255,0.18)' },
            });
        }
        if (!map.getLayer('cluster-count')) {
            map.addLayer({
                id: 'cluster-count', type: 'symbol', source: 'listings', filter: ['has', 'point_count'],
                layout: { 'text-field': '{point_count_abbreviated}', 'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'], 'text-size': 14 },
                paint: { 'text-color': '#ffffff' },
            });
        }
        if (mapStyleRef.current !== 'satellite' && !map.getLayer('3d-buildings')) {
            const layers = map.getStyle().layers;
            let firstSymbolId = '';
            for (const l of layers) { if (l.type === 'symbol') { firstSymbolId = l.id; break; } }
            map.addLayer({
                id: '3d-buildings', source: 'composite', 'source-layer': 'building', filter: ['==', 'extrude', 'true'], type: 'fill-extrusion', minzoom: 12,
                paint: { 'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'height'], 0, '#1a1a2e', 50, '#16213e', 100, '#0f3460', 200, '#533483'], 'fill-extrusion-height': ['get', 'height'], 'fill-extrusion-base': ['get', 'min_height'], 'fill-extrusion-opacity': 0.85 },
            }, firstSymbolId);
        }
        if (!map.getLayer('sky')) {
            map.addLayer({ id: 'sky', type: 'sky', paint: { 'sky-type': 'atmosphere', 'sky-atmosphere-sun': [0.0, 90.0], 'sky-atmosphere-sun-intensity': 15 } });
        }
        if (!map.getSource('mapbox-dem')) {
            try {
                map.addSource('mapbox-dem', { type: 'raster-dem', url: 'mapbox://mapbox.mapbox-terrain-dem-v1', tileSize: 512, maxzoom: 14 });
                map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
            } catch (_) { }
        }
        map.on('click', 'clusters', (e: any) => {
            const f = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
            if (!f.length) return;
            (map.getSource('listings') as any).getClusterExpansionZoom(f[0].properties.cluster_id, (err: any, zoom: number) => {
                if (!err) map.easeTo({ center: f[0].geometry.coordinates, zoom: zoom + 1, duration: 600 });
            });
        });
        map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
    }

    // ─── Markers ─────────────────────────────────────────────────────────────────
    const createMarkerEl = useCallback((p: Property): HTMLElement => {
        const color = priceColor(p.list_price);
        const el = document.createElement('div');
        el.className = 'ps-marker';
        el.dataset.id = p.property_id;
        el.style.cssText = 'cursor:pointer;z-index:10;position:relative;';
        el.innerHTML = `<div class="ps-pill" style="background:rgba(10,11,24,0.92);border:1.5px solid ${color};border-radius:20px;padding:5px 12px 5px 9px;color:${color};font-size:12px;font-weight:700;font-family:'DM Sans',sans-serif;white-space:nowrap;backdrop-filter:blur(10px);box-shadow:0 2px 14px rgba(0,0,0,0.5);display:flex;align-items:center;gap:6px;transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1);user-select:none;"><span style="width:7px;height:7px;background:${color};border-radius:50%;display:inline-block;flex-shrink:0;box-shadow:0 0 6px ${color};"></span>${fmtPrice(p.list_price)}</div>`;
        return el;
    }, []);

    const updateMarkers = useCallback((props: Property[], zoom?: number) => {
        const map = mapRef.current;
        if (!map) return;
        const z = zoom ?? map.getZoom();
        const showCustom = z >= 11;
        const bounds = map.getBounds();
        const ids = new Set(props.map(p => p.property_id));
        markersRef.current.forEach((v, id) => {
            if (!ids.has(id) || !showCustom) { v.marker.remove(); markersRef.current.delete(id); }
        });
        if (!showCustom) return;
        const mapboxgl = (window as any).mapboxgl;
        if (!mapboxgl) return;
        props.forEach(p => {
            const { longitude: lng, latitude: lat } = p.address;
            if (!bounds.contains([lng, lat])) return;
            if (markersRef.current.has(p.property_id)) return;
            const el = createMarkerEl(p);
            const marker = new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]).addTo(map);
            const pill = el.querySelector<HTMLElement>('.ps-pill')!;
            el.addEventListener('mouseenter', (e: MouseEvent) => {
                if (!el.dataset.selected) { pill.style.transform = 'scale(1.2)'; }
                setHoveredProp(p); setTooltipPos({ x: e.clientX, y: e.clientY });
            });
            el.addEventListener('mousemove', (e: MouseEvent) => setTooltipPos({ x: e.clientX, y: e.clientY }));
            el.addEventListener('mouseleave', () => {
                if (!el.dataset.selected) pill.style.transform = 'scale(1)';
                setHoveredProp(null);
            });
            el.addEventListener('click', (e: MouseEvent) => {
                e.stopPropagation();
                activateMarker(p.property_id);
                setSelectedProp(p); setSidebarVisible(true); setHoveredProp(null);
                map.flyTo({ center: [lng, lat], zoom: 16.5, pitch: 65, bearing: Math.random() * 60 - 30, duration: 1800, essential: true });
            });
            markersRef.current.set(p.property_id, { marker, el });
        });
    }, [createMarkerEl]);

    function activateMarker(id: string) {
        markersRef.current.forEach(({ el }, mId) => {
            const pill = el.querySelector<HTMLElement>('.ps-pill')!;
            if (mId === id) { el.dataset.selected = 'true'; pill.style.transform = 'scale(1.25)'; pill.style.animation = 'psPulse 2s ease-in-out infinite'; }
            else { delete el.dataset.selected; pill.style.transform = 'scale(1)'; pill.style.animation = ''; }
        });
    }
    function deactivateAllMarkers() {
        markersRef.current.forEach(({ el }) => {
            const pill = el.querySelector<HTMLElement>('.ps-pill');
            if (pill) { delete (el as any).dataset.selected; pill.style.transform = 'scale(1)'; pill.style.animation = ''; }
        });
    }

    // ─── Map init ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;
        if ((window as any).mapboxgl) { initMap(); return; }
        const link = document.createElement('link');
        link.rel = 'stylesheet'; link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css';
        document.head.appendChild(link);
        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js';
        script.onload = () => initMap();
        document.head.appendChild(script);
        return () => {
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
            markersRef.current.forEach(v => v.marker.remove()); markersRef.current.clear();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function initMap() {
        if (!mapContainerRef.current || mapRef.current) return;
        const mapboxgl = (window as any).mapboxgl;
        mapboxgl.accessToken = TOKEN;
        const map = new mapboxgl.Map({ container: mapContainerRef.current, style: MAP_STYLES.dark, center: [-79.3832, 43.6532], zoom: 13, pitch: 55, bearing: -20, antialias: true });
        mapRef.current = map;
        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');
        map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');
        map.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), 'bottom-right');
        map.on('load', () => { addLayers(map); setMapLoaded(true); setTimeout(() => updateMarkers(filteredRef.current, map.getZoom()), 100); });
        map.on('zoom', () => { const z = map.getZoom(); setMapZoom(z); updateMarkers(filteredRef.current, z); });
        map.on('moveend', () => { if (map.getZoom() >= 11) updateMarkers(filteredRef.current, map.getZoom()); });
        map.on('click', () => { setSelectedProp(null); setSidebarVisible(false); deactivateAllMarkers(); });
    }

    useEffect(() => {
        if (!mapLoaded || !mapRef.current) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const map = mapRef.current; if (!map) return;
            const src = map.getSource('listings'); if (src) src.setData(buildGeoJSON(filteredRef.current));
            markersRef.current.forEach((v, id) => { if (!filteredRef.current.find(p => p.property_id === id)) { v.marker.remove(); markersRef.current.delete(id); } });
            updateMarkers(filteredRef.current, map.getZoom());
        }, 300);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [priceMin, priceMax, minBeds, selectedCity, mapLoaded]);

    const changeStyle = useCallback((s: keyof typeof MAP_STYLES) => {
        const map = mapRef.current; if (!map) return;
        mapStyleRef.current = s; setMapStyle(s);
        markersRef.current.forEach(v => v.marker.remove()); markersRef.current.clear();
        map.setStyle(MAP_STYLES[s]);
        map.once('style.load', () => { addLayers(map); setTimeout(() => updateMarkers(filteredRef.current, map.getZoom()), 200); });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [updateMarkers]);

    const toggle3D = useCallback(() => {
        setIs3D(prev => { const n = !prev; if (mapRef.current) mapRef.current.easeTo({ pitch: n ? 55 : 0, duration: 700 }); return n; });
    }, []);

    const resetView = useCallback(() => {
        setSelectedProp(null); setSidebarVisible(false); deactivateAllMarkers();
        if (mapRef.current) mapRef.current.flyTo({ center: [-79.3832, 43.6532], zoom: 13, pitch: 55, bearing: -20, duration: 1400 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Render ───────────────────────────────────────────────────────────────────
    return (
        <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f]">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes psPulse { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.5)} 50%{box-shadow:0 0 0 10px rgba(99,102,241,0)} }
        @keyframes slideRight { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes spin2 { to{transform:rotate(360deg)} }
        .mapboxgl-ctrl-bottom-right{bottom:80px!important;right:14px!important}
        .mapboxgl-ctrl-group{background:rgba(10,11,24,0.88)!important;border:1px solid rgba(99,102,241,0.18)!important;border-radius:12px!important;backdrop-filter:blur(14px)!important;overflow:hidden}
        .mapboxgl-ctrl-group button{background:transparent!important;width:38px!important;height:38px!important}
        .mapboxgl-ctrl-group button+button{border-color:rgba(99,102,241,0.18)!important}
        .mapboxgl-ctrl-group button:hover{background:rgba(99,102,241,0.15)!important}
        .mapboxgl-ctrl-icon{filter:brightness(0) invert(0.7)!important}
        .mapboxgl-ctrl-attrib{font-size:9px!important;background:rgba(10,11,24,0.88)!important;color:#94a3b8!important;border-radius:6px!important}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.3);border-radius:2px}
      `}</style>

            {/* Map */}
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Loading */}
            {!mapLoaded && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-[#0a0a0f] to-[#0d1030]">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500" style={{ animation: 'spin2 0.9s linear infinite' }} />
                        <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple-500" style={{ animation: 'spin2 1.2s linear infinite reverse' }} />
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-extrabold tracking-tight text-slate-100" style={{ fontFamily: "'Syne',sans-serif" }}>
                            Property<span className="text-indigo-400">Seek</span>
                        </p>
                        <p className="mt-1.5 text-xs text-slate-600">Loading 3D map…</p>
                    </div>
                </div>
            )}

            {/* ── Toolbar ── */}
            <div className={`absolute top-0 left-0 right-0 z-30 h-16 flex items-center gap-4 px-5 ${glassPanel} rounded-none border-x-0 border-t-0`}>
                {/* Logo */}
                <div className="flex shrink-0 items-center gap-2.5">
                    <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_3px_14px_rgba(99,102,241,0.5)]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                    </div>
                    <span className="whitespace-nowrap text-base font-extrabold tracking-tight text-slate-100" style={{ fontFamily: "'Syne',sans-serif" }}>
                        Property<span className="text-indigo-400">Seek</span>
                    </span>
                </div>

                <div className="h-8 w-px shrink-0 bg-white/[0.08]" />

                {/* Price */}
                <div className="shrink-0">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-slate-500">Price</p>
                    <div className="flex items-center gap-1.5">
                        <select value={priceMin} onChange={e => setPriceMin(Number(e.target.value))} className={`${selectCls} w-[84px]`}>
                            {[300_000, 400_000, 500_000, 600_000, 700_000, 800_000, 1_000_000].map(v => <option key={v} value={v} className="bg-[#0a0a1a]">{fmtPrice(v)}</option>)}
                        </select>
                        <span className="text-xs text-slate-600">–</span>
                        <select value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} className={`${selectCls} w-[90px]`}>
                            {[700_000, 900_000, 1_200_000, 1_500_000, 1_800_000, 2_200_000, 3_000_000].map(v => <option key={v} value={v} className="bg-[#0a0a1a]">{fmtPrice(v)}</option>)}
                        </select>
                    </div>
                </div>

                {/* Beds */}
                <div className="shrink-0">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-slate-500">Beds</p>
                    <div className="flex gap-1">
                        {([['Any', 0], ['2+', 2], ['3+', 3], ['4+', 4]] as [string, number][]).map(([l, v]) => (
                            <button key={v} onClick={() => setMinBeds(v)} className={tabBtn(minBeds === v)}>{l}</button>
                        ))}
                    </div>
                </div>

                {/* City */}
                <div className="shrink-0">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-slate-500">City</p>
                    <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} className={`${selectCls} w-[130px]`}>
                        {CITIES.map(c => <option key={c} value={c} className="bg-[#0a0a1a]">{c}</option>)}
                    </select>
                </div>

                <div className="h-8 w-px shrink-0 bg-white/[0.08]" />

                {/* Style */}
                <div className="shrink-0">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-slate-500">Style</p>
                    <div className="flex gap-1">
                        {(['dark', 'light', 'satellite'] as const).map(s => (
                            <button key={s} onClick={() => changeStyle(s)} className={`${tabBtn(mapStyle === s)} capitalize`}>{s}</button>
                        ))}
                    </div>
                </div>

                <div className="flex-1" />

                {/* Count */}
                <div className="shrink-0 text-right">
                    <span className="text-[15px] font-extrabold text-indigo-500" style={{ fontFamily: "'Syne',sans-serif" }}>{filtered.length}</span>
                    <span className="ml-1.5 text-xs text-slate-600">/ {ALL_PROPS.length} properties</span>
                </div>

                {/* Legend */}
                <div className="flex shrink-0 items-center gap-3">
                    {([['#22c55e', '<$500K'], ['#f59e0b', '$500K–$1M'], ['#a855f7', '>$1M']] as const).map(([c, l]) => (
                        <div key={l} className="flex items-center gap-1.5">
                            <span className="inline-block h-2 w-2 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
                            <span className="text-[11px] text-slate-500">{l}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Custom Controls ── */}
            {mapLoaded && (
                <div className="absolute bottom-6 left-5 z-20 flex flex-col gap-2">
                    <button onClick={resetView} title="Reset view"
                        className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-indigo-500/25 text-slate-400 transition-all duration-200 hover:border-indigo-500 hover:text-indigo-400 ${glassPanel}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                    </button>
                    <button onClick={toggle3D} title="Toggle 3D"
                        className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border text-[11px] font-extrabold tracking-wide transition-all duration-200 backdrop-blur-[16px] ${is3D ? 'border-indigo-500 bg-indigo-500/25 text-indigo-300' : `border-indigo-500/25 text-slate-400 hover:text-indigo-300 ${glassPanel}`
                            }`}>
                        {is3D ? '3D' : '2D'}
                    </button>
                </div>
            )}

            {/* ── Sidebar ── */}
            {sidebarVisible && selectedProp && (
                <div className={`absolute right-0 top-16 bottom-0 z-25 w-[380px] overflow-y-auto rounded-tl-2xl border-l border-[rgba(99,102,241,0.18)] bg-[rgba(10,11,24,0.95)] backdrop-blur-[20px]`}
                    style={{ animation: 'slideRight 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>

                    {/* Photo */}
                    <div className="relative h-[220px] shrink-0 overflow-hidden">
                        <img src={selectedProp.photo} alt="" className="h-full w-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80'; }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,11,24,0.9)] to-transparent" />
                        <button onClick={() => { setSelectedProp(null); setSidebarVisible(false); deactivateAllMarkers(); }}
                            className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/55 text-lg text-slate-100 backdrop-blur-[8px] hover:bg-black/80 transition-colors">×</button>
                        <div className="absolute left-3 top-3 rounded-lg bg-indigo-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur-[8px]">For Sale</div>
                        <div className="absolute bottom-3 left-4 text-[28px] font-extrabold tracking-tight drop-shadow-lg"
                            style={{ fontFamily: "'Syne',sans-serif", color: priceColor(selectedProp.list_price) }}>{fmtPrice(selectedProp.list_price)}</div>
                    </div>

                    {/* Body */}
                    <div className="p-5">
                        <h2 className="mb-1 text-[17px] font-bold leading-tight tracking-tight text-slate-100" style={{ fontFamily: "'Syne',sans-serif" }}>
                            {selectedProp.address.street_number} {selectedProp.address.street}
                        </h2>
                        <p className="mb-[18px] text-[13px] font-medium text-indigo-400">
                            {selectedProp.address.city}, {selectedProp.address.state_code} · {selectedProp.address.postal_code}
                        </p>

                        {/* Stats grid */}
                        <div className="mb-[18px] grid grid-cols-3 gap-2.5">
                            {[{ icon: '🛏', v: selectedProp.description.beds, l: 'Beds' }, { icon: '🚿', v: selectedProp.description.baths, l: 'Baths' }, { icon: '📐', v: selectedProp.description.sqft_living.toLocaleString(), l: 'Sq Ft' }].map(({ icon, v, l }) => (
                                <div key={l} className="flex flex-col items-center rounded-xl border border-white/[0.07] bg-white/[0.04] p-2.5 text-center">
                                    <span className="mb-1 text-lg">{icon}</span>
                                    <span className="text-sm font-bold text-slate-100">{v}</span>
                                    <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-slate-600">{l}</span>
                                </div>
                            ))}
                        </div>

                        {/* Info rows */}
                        <div className="mb-4 flex flex-col gap-2.5">
                            {([['Property Type', fmtType(selectedProp.description.property_type)], ['Year Built', String(selectedProp.description.year_built)], ['Lot Size', `${selectedProp.description.lot_size.toLocaleString()} sq ft`], ['Listing ID', selectedProp.listing_id]] as [string, string][]).map(([label, value]) => (
                                <div key={label} className="flex items-center justify-between">
                                    <span className="text-xs text-slate-600">{label}</span>
                                    <span className="text-xs font-semibold text-slate-400">{value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Agent */}
                        <div className="mb-3.5 flex items-center gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.08] p-3">
                            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[15px] font-bold text-white">
                                {selectedProp.agent.name[0]}
                            </div>
                            <div>
                                <p className="text-[13px] font-semibold text-slate-100">{selectedProp.agent.name}</p>
                                <p className="text-[11px] text-slate-600">{selectedProp.agent.office}</p>
                            </div>
                        </div>

                        {/* Open House */}
                        {selectedProp.open_house && (
                            <div className="mb-3.5 flex items-center gap-2.5 rounded-xl border border-green-500/25 bg-green-500/[0.08] px-3.5 py-2.5">
                                <span className="text-lg">📅</span>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-green-400">Open House</p>
                                    <p className="mt-0.5 text-xs text-slate-400">{fmtDate(selectedProp.open_house)}</p>
                                </div>
                            </div>
                        )}

                        {/* CTAs */}
                        <div className="flex gap-2.5">
                            <button className="flex-1 cursor-pointer rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 text-[13px] font-bold text-white shadow-[0_4px_18px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.55)] transition-shadow">
                                View Listing →
                            </button>
                            <button className="flex-1 cursor-pointer rounded-xl border border-white/10 bg-white/5 py-3 text-[13px] font-semibold text-slate-400 hover:bg-white/10 transition-colors">
                                🛣️ Street View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Hover Tooltip ── */}
            {hoveredProp && !sidebarVisible && (() => {
                const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
                const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
                const tx = tooltipPos.x + 180 > vw ? tooltipPos.x - 185 : tooltipPos.x + 12;
                const ty = tooltipPos.y + 160 > vh ? tooltipPos.y - 165 : tooltipPos.y + 12;
                return (
                    <div className={`pointer-events-none fixed z-50 w-[170px] overflow-hidden rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] ${glassPanel}`}
                        style={{ left: tx, top: ty, animation: 'fadeIn 0.15s ease' }}>
                        <img src={hoveredProp.photo} alt="" className="block h-[90px] w-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80'; }} />
                        <div className="p-2.5">
                            <p className="text-[15px] font-extrabold tracking-tight" style={{ fontFamily: "'Syne',sans-serif", color: priceColor(hoveredProp.list_price) }}>{fmtPrice(hoveredProp.list_price)}</p>
                            <p className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-medium text-slate-100">{hoveredProp.address.street_number} {hoveredProp.address.street}</p>
                            <p className="mt-1 text-[10px] text-slate-600">🛏 {hoveredProp.description.beds} · 🚿 {hoveredProp.description.baths} · 📐 {hoveredProp.description.sqft_living.toLocaleString()}</p>
                        </div>
                    </div>
                );
            })()}

            {/* Zoom hint */}
            {mapLoaded && mapZoom < 11 && (
                <div className={`pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full px-[18px] py-2 text-xs text-slate-400 ${glassPanel}`}
                    style={{ animation: 'fadeIn 0.3s ease' }}>
                    📍 Zoom in to see individual listings
                </div>
            )}
        </div>
    );
}
