import L from 'leaflet';

export const calculatePolygonCenter = (coordinates) => {
  if (!coordinates || coordinates.length === 0) return null;
  
  const totalLat = coordinates.reduce((sum, coord) => sum + coord[0], 0);
  const totalLng = coordinates.reduce((sum, coord) => sum + coord[1], 0);
  
  return {
    lat: totalLat / coordinates.length,
    lng: totalLng / coordinates.length
  };
};

export const calculatePolygonBounds = (coordinates) => {
  if (!coordinates || coordinates.length === 0) return null;
  
  const lats = coordinates.map(coord => coord[0]);
  const lngs = coordinates.map(coord => coord[1]);
  
  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs)
  };
};

export const calculatePolygonArea = (coordinates) => {
  if (!coordinates || coordinates.length < 3) return 0;
  
  // Use Leaflet's built-in area calculation
  const polygon = L.polygon(coordinates);
  return L.GeometryUtil ? L.GeometryUtil.geodesicArea(polygon.getLatLngs()[0]) : 0;
};

export const isPointInPolygon = (point, polygon) => {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
};

export const validatePolygonCoordinates = (coordinates) => {
  const errors = [];
  
  if (!Array.isArray(coordinates)) {
    errors.push('Coordinates must be an array');
    return errors;
  }
  
  if (coordinates.length < 3) {
    errors.push('Polygon must have at least 3 points');
  }
  
  if (coordinates.length > 12) {
    errors.push('Polygon cannot have more than 12 points');
  }
  
  coordinates.forEach((coord, index) => {
    if (!Array.isArray(coord) || coord.length !== 2) {
      errors.push(`Invalid coordinate at index ${index}: must be [lat, lng]`);
      return;
    }
    
    const [lat, lng] = coord;
    
    if (typeof lat !== 'number' || isNaN(lat)) {
      errors.push(`Invalid latitude at index ${index}: must be a number`);
    } else if (lat < -90 || lat > 90) {
      errors.push(`Invalid latitude at index ${index}: must be between -90 and 90`);
    }
    
    if (typeof lng !== 'number' || isNaN(lng)) {
      errors.push(`Invalid longitude at index ${index}: must be a number`);
    } else if (lng < -180 || lng > 180) {
      errors.push(`Invalid longitude at index ${index}: must be between -180 and 180`);
    }
  });
  
  return errors;
};

export const simplifyPolygon = (coordinates, tolerance = 0.001) => {
  if (!coordinates || coordinates.length <= 3) return coordinates;
  
  // Douglas-Peucker algorithm implementation
  const douglasPeucker = (points, epsilon) => {
    if (points.length <= 2) return points;
    
    // Find the point with the maximum distance
    let dmax = 0;
    let index = 0;
    const start = points[0];
    const end = points[points.length - 1];
    
    for (let i = 1; i < points.length - 1; i++) {
      const d = perpendicularDistance(points[i], start, end);
      if (d > dmax) {
        index = i;
        dmax = d;
      }
    }
    
    // If max distance is greater than epsilon, recursively simplify
    if (dmax > epsilon) {
      const recResults1 = douglasPeucker(points.slice(0, index + 1), epsilon);
      const recResults2 = douglasPeucker(points.slice(index), epsilon);
      
      return recResults1.slice(0, -1).concat(recResults2);
    } else {
      return [start, end];
    }
  };
  
  return douglasPeucker(coordinates, tolerance);
};

const perpendicularDistance = (point, lineStart, lineEnd) => {
  const [x0, y0] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  
  const A = x0 - x1;
  const B = y0 - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) return Math.sqrt(A * A + B * B);
  
  let param = dot / lenSq;
  
  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = x0 - xx;
  const dy = y0 - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

export const formatCoordinatesForDisplay = (coordinates) => {
  if (!coordinates || coordinates.length === 0) return '';
  
  return coordinates.map(coord => 
    `${coord[0].toFixed(4)}, ${coord[1].toFixed(4)}`
  ).join(' | ');
};

export const coordinatesToGeoJSON = (coordinates) => {
  if (!coordinates || coordinates.length === 0) return null;
  
  // Close the polygon if not already closed
  const coords = coordinates[0][0] === coordinates[coordinates.length - 1][0] && 
                 coordinates[0][1] === coordinates[coordinates.length - 1][1] 
                 ? coordinates 
                 : [...coordinates, coordinates[0]];
  
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coords.map(coord => [coord[1], coord[0]])] // GeoJSON uses [lng, lat]
    }
  };
};

export const geoJSONToCoordinates = (geoJSON) => {
  if (!geoJSON || !geoJSON.geometry || !geoJSON.geometry.coordinates) return [];
  
  const coords = geoJSON.geometry.coordinates[0];
  return coords.map(coord => [coord[1], coord[0]]); // Convert back to [lat, lng]
};

export const calculateDistance = (coord1, coord2) => {
  const [lat1, lng1] = coord1;
  const [lat2, lng2] = coord2;
  
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
};

export const getOptimalZoomLevel = (bounds, mapDimensions) => {
  const WORLD_DIM = { height: 256, width: 256 };
  const ZOOM_MAX = 18;
  
  function latRad(lat) {
    const sin = Math.sin(lat * Math.PI / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  }
  
  function zoom(mapPx, worldPx, fraction) {
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  }
  
  const latFraction = (latRad(bounds.north) - latRad(bounds.south)) / Math.PI;
  const lngDiff = bounds.east - bounds.west;
  const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;
  
  const latZoom = zoom(mapDimensions.height, WORLD_DIM.height, latFraction);
  const lngZoom = zoom(mapDimensions.width, WORLD_DIM.width, lngFraction);
  
  return Math.min(latZoom, lngZoom, ZOOM_MAX);
};

export const createPolygonStyle = (options = {}) => {
  return {
    fillColor: options.fillColor || '#722ed1',
    fillOpacity: options.fillOpacity || 0.6,
    color: options.borderColor || '#722ed1',
    weight: options.borderWeight || 2,
    opacity: options.borderOpacity || 0.8,
    className: options.className || ''
  };
};

export const createActivePolygonStyle = (baseStyle = {}) => {
  return {
    ...baseStyle,
    color: '#ffffff',
    weight: 3,
    fillOpacity: 0.7,
    className: 'active-polygon'
  };
};

export const getBoundsFromCoordinates = (coordinates) => {
  if (!coordinates || coordinates.length === 0) return null;
  
  return L.latLngBounds(coordinates);
};

export const normalizeCoordinates = (coordinates) => {
  return coordinates.map(coord => [
    Math.round(coord[0] * 100000) / 100000, // Round to 5 decimal places
    Math.round(coord[1] * 100000) / 100000
  ]);
};

export default {
  calculatePolygonCenter,
  calculatePolygonBounds,
  calculatePolygonArea,
  isPointInPolygon,
  validatePolygonCoordinates,
  simplifyPolygon,
  formatCoordinatesForDisplay,
  coordinatesToGeoJSON,
  geoJSONToCoordinates,
  calculateDistance,
  getOptimalZoomLevel,
  createPolygonStyle,
  createActivePolygonStyle,
  getBoundsFromCoordinates,
  normalizeCoordinates
};