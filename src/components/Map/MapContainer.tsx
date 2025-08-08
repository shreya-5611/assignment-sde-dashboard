import React, { useRef, useEffect, useState } from 'react';
import {
  MapContainer as LeafletMap,
  TileLayer,
  Polygon,
  Popup,
  useMap,
  useMapEvents
} from 'react-leaflet';
import { Button, message } from 'antd';
import L, { CircleMarker, LatLngTuple, LeafletMouseEvent } from 'leaflet';
import useDashboardStore from '../../store/dashboardStore';
import { useOpenMeteo } from '../../hooks/useOpenMeteo';
import MapControls from './MapControls';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// TYPES
type PolygonType = {
  id: string;
  name: string;
  coordinates: LatLngTuple[];
  bounds: string;
  data: number | null;
  dataSource: string;
};

type PolygonComponentProps = {
  polygon: PolygonType;
};

// Polygon drawing component
const PolygonDrawer: React.FC = () => {
  const map = useMap();
  const [drawingPoints, setDrawingPoints] = useState<LatLngTuple[]>([]);
  const [tempMarkers, setTempMarkers] = useState<CircleMarker[]>([]);
  const { drawingMode, setDrawingMode, addPolygon } = useDashboardStore();

  const completePolygon = (points: LatLngTuple[]) => {
    if (points.length < 3) {
      message.error('Polygon must have at least 3 points');
      return;
    }

    addPolygon({
      coordinates: points,
      bounds: L.latLngBounds(points).toBBoxString()
    });

    tempMarkers.forEach(marker => map.removeLayer(marker));
    setTempMarkers([]);
    setDrawingPoints([]);
    setDrawingMode(false);

    message.success('Polygon created successfully!');
  };

  useMapEvents({
    click(e: LeafletMouseEvent) {
      if (!drawingMode) return;

      const { lat, lng } = e.latlng;
      const newPoint: LatLngTuple = [lat, lng];
      const newPoints: LatLngTuple[] = [...drawingPoints, newPoint];

      if (newPoints.length > 12) {
        message.warning('Maximum 12 points allowed per polygon');
        return;
      }

      setDrawingPoints(newPoints);

      const marker = L.circleMarker(newPoint, {
        radius: 5,
        fillColor: '#722ed1',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.8
      }).addTo(map);

      setTempMarkers(prev => [...prev, marker]);

      if (newPoints.length >= 3) {
        const firstPoint = newPoints[0];
        const distance = map.distance(newPoint, firstPoint);
        if (distance < 100) {
          completePolygon(newPoints);
        }
      }
    },
    contextmenu(e) {
      if (!drawingMode || drawingPoints.length < 3) return;
      e.originalEvent.preventDefault();
      completePolygon(drawingPoints);
    }
  });

  useEffect(() => {
    if (drawingMode && drawingPoints.length === 0) {
      message.info('Click on the map to start drawing. Right-click or click near the first point to finish.');
    }
  }, [drawingMode, drawingPoints.length]);

  useEffect(() => {
    return () => {
      tempMarkers.forEach(marker => map.removeLayer(marker));
    };
  }, []);

  return null;
};

// Map event handler
const MapEventHandler: React.FC = () => {
  const { setMapCenter, setMapZoom } = useDashboardStore();

  useMapEvents({
    moveend(e) {
      const center = e.target.getCenter();
      setMapCenter([center.lat, center.lng]);
    },
    zoomend(e) {
      setMapZoom(e.target.getZoom());
    }
  });

  return null;
};

// Polygon Renderer
const PolygonComponent: React.FC<PolygonComponentProps> = ({ polygon }) => {
  const {
    updatePolygon,
    deletePolygon,
    setActivePolygon,
    activePolygon,
    getColorForValue,
    getDataSourceById
  } = useDashboardStore();

  const { fetchWeatherData } = useOpenMeteo();
  const [loading, setLoading] = useState(false);

  const dataSource = getDataSourceById(polygon.dataSource);
  const color = polygon.data !== null
    ? getColorForValue(polygon.dataSource, polygon.data)
    : '#666666';

  const pathOptions = {
    fillColor: color,
    fillOpacity: 0.6,
    color: activePolygon === polygon.id ? '#ffffff' : color,
    weight: activePolygon === polygon.id ? 3 : 2,
    opacity: 0.8
  };

  const handleClick = () => {
    setActivePolygon(polygon.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deletePolygon(polygon.id);
    message.success('Polygon deleted');
  };

  const refreshData = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);

    try {
      const bounds = L.latLngBounds(polygon.coordinates);
      const center = bounds.getCenter();

      const data = await fetchWeatherData(center.lat, center.lng, polygon.dataSource);
      updatePolygon(polygon.id, { data });
      message.success('Data updated');
    } catch (error) {
      message.error('Failed to update data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Polygon
      positions={polygon.coordinates}
      pathOptions={pathOptions}
      eventHandlers={{ click: handleClick }}
    >
      <Popup>
        <div style={{ minWidth: '200px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>{polygon.name}</h4>

          {dataSource && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Data Source:</strong> {dataSource.name}
            </div>
          )}

          {polygon.data !== null && dataSource && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Value:</strong> {polygon.data.toFixed(1)} {dataSource.unit}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <Button
              size="small"
              type="primary"
              loading={loading}
              onClick={refreshData}
            >
              Refresh Data
            </Button>
            <Button
              size="small"
              danger
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Popup>
    </Polygon>
  );
};

// Main Map Container
const MapContainerComponent: React.FC = () => {
  const {
    mapCenter,
    mapZoom,
    polygons,
    drawingMode,
    setDrawingMode
  } = useDashboardStore();

  const mapRef = useRef<L.Map>(null);

  const startDrawing = () => setDrawingMode(true);
  const stopDrawing = () => setDrawingMode(false);

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <LeafletMap
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventHandler />
        <PolygonDrawer />

        {polygons.map((polygon: PolygonType) => (
          <PolygonComponent key={polygon.id} polygon={polygon} />
        ))}
      </LeafletMap>

      <MapControls
        drawingMode={drawingMode}
        onStartDrawing={startDrawing}
        onStopDrawing={stopDrawing}
      />
    </div>
  );
};

export default MapContainerComponent;
