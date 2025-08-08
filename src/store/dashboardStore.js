import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addHours, subHours, format, parseISO } from 'date-fns';

const useDashboardStore = create(
  persist(
    (set, get) => ({
      // Timeline state
      currentTime: new Date(),
      timeRange: {
        start: subHours(new Date(), 24),
        end: addHours(new Date(), 24)
      },
      isRangeMode: false,
      isPlaying: false,
      playbackSpeed: 1000, // milliseconds
      
      // Map state
      mapCenter: [52.52, 13.41],
      mapZoom: 10,
      
      // Polygons state
      polygons: [],
      activePolygon: null,
      drawingMode: false,
      
      // Data sources state
      dataSources: [
        {
          id: 'temperature',
          name: 'Temperature',
          field: 'temperature_2m',
          unit: '°C',
          colorRules: [
            { operator: '<', value: 0, color: '#1890ff' },
            { operator: '>=', value: 0, operator2: '<', value2: 15, color: '#52c41a' },
            { operator: '>=', value: 15, operator2: '<', value2: 25, color: '#faad14' },
            { operator: '>=', value: 25, color: '#f5222d' }
          ]
        },
        {
          id: 'humidity',
          name: 'Humidity',
          field: 'relativehumidity_2m',
          unit: '%',
          colorRules: [
            { operator: '<', value: 30, color: '#f5222d' },
            { operator: '>=', value: 30, operator2: '<', value2: 60, color: '#faad14' },
            { operator: '>=', value: 60, operator2: '<', value2: 80, color: '#52c41a' },
            { operator: '>=', value: 80, color: '#1890ff' }
          ]
        },
        {
          id: 'precipitation',
          name: 'Precipitation',
          field: 'precipitation',
          unit: 'mm',
          colorRules: [
            { operator: '=', value: 0, color: '#d9d9d9' },
            { operator: '>', value: 0, operator2: '<', value2: 1, color: '#91d5ff' },
            { operator: '>=', value: 1, operator2: '<', value2: 5, color: '#40a9ff' },
            { operator: '>=', value: 5, color: '#096dd9' }
          ]
        }
      ],
      
      // Weather data cache
      weatherDataCache: new Map(),
      
      // Actions
      setCurrentTime: (time) => set({ currentTime: time }),
      
      setTimeRange: (range) => set({ timeRange: range }),
      
      setRangeMode: (isRange) => set({ isRangeMode: isRange }),
      
      setPlaying: (playing) => set({ isPlaying: playing }),
      
      setMapCenter: (center) => set({ mapCenter: center }),
      
      setMapZoom: (zoom) => set({ mapZoom: zoom }),
      
      addPolygon: (polygon) => {
        const newPolygon = {
          ...polygon,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          dataSource: 'temperature', // default
          name: `Polygon ${get().polygons.length + 1}`,
          data: null
        };
        set(state => ({
          polygons: [...state.polygons, newPolygon],
          activePolygon: newPolygon.id
        }));
        return newPolygon.id;
      },
      
      updatePolygon: (id, updates) => set(state => ({
        polygons: state.polygons.map(p => 
          p.id === id ? { ...p, ...updates } : p
        )
      })),
      
      deletePolygon: (id) => set(state => ({
        polygons: state.polygons.filter(p => p.id !== id),
        activePolygon: state.activePolygon === id ? null : state.activePolygon
      })),
      
      setActivePolygon: (id) => set({ activePolygon: id }),
      
      setDrawingMode: (mode) => set({ drawingMode: mode }),
      
      updateDataSource: (sourceId, updates) => set(state => ({
        dataSources: state.dataSources.map(ds =>
          ds.id === sourceId ? { ...ds, ...updates } : ds
        )
      })),
      
      addColorRule: (sourceId, rule) => set(state => ({
        dataSources: state.dataSources.map(ds =>
          ds.id === sourceId 
            ? { ...ds, colorRules: [...ds.colorRules, rule] }
            : ds
        )
      })),
      
      updateColorRule: (sourceId, ruleIndex, updates) => set(state => ({
        dataSources: state.dataSources.map(ds =>
          ds.id === sourceId
            ? {
                ...ds,
                colorRules: ds.colorRules.map((rule, index) =>
                  index === ruleIndex ? { ...rule, ...updates } : rule
                )
              }
            : ds
        )
      })),
      
      deleteColorRule: (sourceId, ruleIndex) => set(state => ({
        dataSources: state.dataSources.map(ds =>
          ds.id === sourceId
            ? {
                ...ds,
                colorRules: ds.colorRules.filter((_, index) => index !== ruleIndex)
              }
            : ds
        )
      })),
      
      cacheWeatherData: (key, data) => {
        const cache = get().weatherDataCache;
        cache.set(key, {
          data,
          timestamp: Date.now()
        });
        set({ weatherDataCache: new Map(cache) });
      },
      
      getCachedWeatherData: (key) => {
        const cached = get().weatherDataCache.get(key);
        if (!cached) return null;
        
        // Cache expires after 1 hour
        if (Date.now() - cached.timestamp > 3600000) {
          const cache = get().weatherDataCache;
          cache.delete(key);
          set({ weatherDataCache: new Map(cache) });
          return null;
        }
        
        return cached.data;
      },
      
      // Utility functions
      getTimeWindow: () => {
        const state = get();
        if (state.isRangeMode) {
          return state.timeRange;
        } else {
          return {
            start: state.currentTime,
            end: addHours(state.currentTime, 1)
          };
        }
      },
      
      getPolygonById: (id) => {
        return get().polygons.find(p => p.id === id);
      },
      
      getDataSourceById: (id) => {
        return get().dataSources.find(ds => ds.id === id);
      },
      
      getColorForValue: (sourceId, value) => {
        const dataSource = get().getDataSourceById(sourceId);
        if (!dataSource || value === null || value === undefined) {
          return '#666666';
        }
        
        for (const rule of dataSource.colorRules) {
          if (matchesRule(value, rule)) {
            return rule.color;
          }
        }
        
        return '#666666'; // default color
      }
    }),
    {
      name: 'dashboard-store',
      partialize: (state) => ({
        polygons: state.polygons,
        dataSources: state.dataSources,
        mapCenter: state.mapCenter,
        mapZoom: state.mapZoom
      })
    }
  )
);

// Helper function to match color rules
function matchesRule(value, rule) {
  const { operator, value: ruleValue, operator2, value2 } = rule;
  
  let matches = false;
  
  switch (operator) {
    case '=':
    case '==':
      matches = value === ruleValue;
      break;
    case '<':
      matches = value < ruleValue;
      break;
    case '<=':
      matches = value <= ruleValue;
      break;
    case '>':
      matches = value > ruleValue;
      break;
    case '>=':
      matches = value >= ruleValue;
      break;
    default:
      matches = false;
  }
  
  // Handle compound rules (e.g., >= 10 and < 25)
  if (matches && operator2 && value2 !== undefined) {
    switch (operator2) {
      case '<':
        matches = matches && value < value2;
        break;
      case '<=':
        matches = matches && value <= value2;
        break;
      case '>':
        matches = matches && value > value2;
        break;
      case '>=':
        matches = matches && value >= value2;
        break;
      default:
        break;
    }
  }
  
  return matches;
}

export default useDashboardStore;