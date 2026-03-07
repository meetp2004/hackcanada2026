'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export default function MapPage() {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<mapboxgl.Map | null>(null)

    useEffect(() => {
        if (mapRef.current || !containerRef.current) return

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

        mapRef.current = new mapboxgl.Map({
            container: containerRef.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-79.3832, 43.6532],   // Toronto
            zoom: 15,
            pitch: 55,
            bearing: -18,
            antialias: true,
        })

        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

        mapRef.current.on('load', () => {
            const map = mapRef.current!
            const layers = map.getStyle().layers
            const firstSymbolId = layers.find(l => l.type === 'symbol')?.id

            /* ── Terrain ── */
            map.addSource('mapbox-dem', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                tileSize: 512,
                maxzoom: 14,
            })
            map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.2 })

            /* ── Sky ── */
            map.addLayer({
                id: 'sky',
                type: 'sky',
                paint: {
                    'sky-type': 'atmosphere',
                    'sky-atmosphere-sun': [0.0, 90.0],
                    'sky-atmosphere-sun-intensity': 12,
                    'sky-atmosphere-color': 'rgba(200, 220, 255, 1)',
                    'sky-atmosphere-halo-color': 'rgba(210, 230, 255, 0.8)',
                },
            })

            /* ── 3D buildings — warm cream tones ── */
            map.addLayer(
                {
                    id: '3d-buildings',
                    source: 'composite',
                    'source-layer': 'building',
                    filter: ['==', 'extrude', 'true'],
                    type: 'fill-extrusion',
                    minzoom: 13,
                    paint: {
                        /* Height-based colour: low = warm white, tall = warm taupe */
                        'fill-extrusion-color': [
                            'interpolate', ['linear'], ['get', 'height'],
                            0, '#f5f2ec',
                            20, '#ede8df',
                            60, '#ddd7cb',
                            120, '#ccc4b5',
                            220, '#b8ae9e',
                        ],
                        'fill-extrusion-height': ['get', 'height'],
                        'fill-extrusion-base': ['get', 'min_height'],
                        'fill-extrusion-opacity': 0.92,

                        /* Ambient occlusion gives depth between buildings */
                        'fill-extrusion-ambient-occlusion-intensity': 0.5,
                        'fill-extrusion-ambient-occlusion-radius': 3,
                    },
                } as mapboxgl.AnyLayer,
                firstSymbolId,
            )
        })

        return () => {
            mapRef.current?.remove()
            mapRef.current = null
        }
    }, [])

    return (
        <>
            <style>{`
        /* Override Mapbox controls to match light theme */
        .mapboxgl-ctrl-group {
          background: #fff !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
          border-radius: 10px !important;
          box-shadow: 0 2px 12px rgba(0,0,0,0.10) !important;
        }
        .mapboxgl-ctrl-group button {
          background: transparent !important;
          border-bottom: 1px solid rgba(0,0,0,0.06) !important;
        }
        .mapboxgl-ctrl-group button:last-child {
          border-bottom: none !important;
        }
        .mapboxgl-ctrl-attrib,
        .mapboxgl-ctrl-logo { display: none !important; }
        .mapboxgl-ctrl-bottom-right {
          bottom: 1.5rem !important;
          right:  1rem  !important;
        }
      `}</style>

            <div className="w-screen h-screen bg-[#f4f3f0]">
                <div ref={containerRef} className="w-full h-full" />
            </div>
        </>
    )
}