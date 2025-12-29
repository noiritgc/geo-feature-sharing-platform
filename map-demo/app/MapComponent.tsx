'use client';

import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  CircleMarker,
  useMapEvent,
} from 'react-leaflet';
import L from 'leaflet';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

/* ---------------- LEAFLET FIX ---------------- */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/* ---------------- TYPES ---------------- */
interface MapComponentProps {
  createAreaActive: boolean;
  searchAreaActive: boolean;
  activeGroupId: string | null;
  personalCollection?: boolean;
  user?: any;
  selectedArea: any;
}

interface SavedPolygon {
  id: string;
  name: string;
  info: string;
  polygon: { lat: number; lng: number }[];
  group?: string;
  userId?: string;
}

/* ---------------- CREATE AREA ---------------- */
function PolygonDrawer({
  enabled,
  groupId,
  personalCollection,
  user,
}: {
  enabled: boolean;
  groupId: string | null;
  personalCollection?: boolean;
  user?: any;
}) {
  const [points, setPoints] = useState<[number, number][]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [info, setInfo] = useState('');

  useMapEvent('click', (e) => {
    if (!enabled) return;
    setPoints((prev) => {
      const next: [number, number][] = [...prev, [e.latlng.lat, e.latlng.lng]];
      if (next.length === 1) setShowForm(true);
      return next;
    });
  });

  const save = async () => {
    if (!name.trim()) return;

    const docData: any = {
      name,
      info,
      polygon: points.map(([lat, lng]) => ({ lat, lng })),
      createdAt: new Date(),
    };

    if (personalCollection && user) {
      docData.userId = user.uid;
    } else if (groupId) {
      docData.group = groupId;
    }

    await addDoc(collection(db, 'polygons'), docData);

    setPoints([]);
    setName('');
    setInfo('');
    setShowForm(false);
  };

  return (
    <>
      {points.map((p, i) => (
        <CircleMarker key={i} center={p} radius={5} />
      ))}
      {points.length >= 3 && <Polygon positions={points} />}
      {showForm && points[0] && (
        <Popup position={points[0]} closeOnClick={false}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <input
              placeholder="Area name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              placeholder="Info"
              value={info}
              onChange={(e) => setInfo(e.target.value)}
            />
            <button onClick={save}>Save</button>
          </div>
        </Popup>
      )}
    </>
  );
}

/* ---------------- MAP ---------------- */
export default function MapComponent({
  createAreaActive,
  searchAreaActive,
  activeGroupId,
  personalCollection,
  user,
  selectedArea,
}: MapComponentProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (p) => setPosition([p.coords.latitude, p.coords.longitude]),
      () => setPosition([40.7128, -74.006])
    );
  }, []);

  if (!position) return null;

  return (
    <div className="h-screen w-full">
      <MapContainer center={position} zoom={13} style={{ height: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={position}>
          <Popup>You are here</Popup>
        </Marker>

        <PolygonDrawer
          enabled={createAreaActive}
          groupId={activeGroupId}
          personalCollection={personalCollection}
          user={user}
        />

        {/* Render only selected area */}
        {selectedArea && (
          <>
            <Polygon
              positions={selectedArea.polygon.map((p) => [p.lat, p.lng])}
            />
            <Popup
              position={[
                selectedArea.polygon[0].lat,
                selectedArea.polygon[0].lng,
              ]}
            >
              <strong>{selectedArea.name}</strong>
              <br />
              {selectedArea.info}
            </Popup>
          </>
        )}
      </MapContainer>
    </div>
  );
}
