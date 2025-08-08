import { useCallback, useEffect } from 'react';
import useDashboardStore from '../store/dashboardStore';
import { useOpenMeteo } from './useOpenMeteo';

export const usePolygons = () => {
  const {
    polygons,
    updatePolygon,
    getColorForValue,
    currentTime,
    timeRange,
    isRangeMode
  } = useDashboardStore();

  const { fetchMultiplePolygons } = useOpenMeteo();

  // Update all polygon data when time changes
  const refreshAllPolygonData = useCallback(async () => {
    if (polygons.length === 0) return;

    try {
      const results = await fetchMultiplePolygons(polygons);
      
      results.forEach(({ polygonId, value, error }) => {
        const polygon = polygons.find(p => p.id === polygonId);
        if (polygon) {
          const color = getColorForValue(polygon.dataSource, value);
          updatePolygon(polygonId, { 
            data: value, 
            color,
            lastUpdated: new Date().toISOString(),
            error 
          });
        }
      });
    } catch (error) {
      console.error('Error refreshing polygon data:', error);
    }
  }, [polygons, fetchMultiplePolygons, updatePolygon, getColorForValue]);

  // Auto-refresh data when time changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      refreshAllPolygonData();
    }, 500); // Debounce to avoid too many API calls

    return () => clearTimeout(debounceTimer);
  }, [currentTime, timeRange, isRangeMode, refreshAllPolygonData]);

  const refreshSinglePolygon = useCallback(async (polygonId) => {
    const polygon = polygons.find(p => p.id === polygonId);
    if (!polygon) return;

    try {
      const results = await fetchMultiplePolygons([polygon]);
      const result = results[0];
      
      if (result) {
        const color = getColorForValue(polygon.dataSource, result.value);
        updatePolygon(polygonId, { 
          data: result.value, 
          color,
          lastUpdated: new Date().toISOString(),
          error: result.error 
        });
      }
    } catch (error) {
      console.error('Error refreshing single polygon:', error);
    }
  }, [polygons, fetchMultiplePolygons, updatePolygon, getColorForValue]);

  const getPolygonStats = useCallback(() => {
    const stats = {
      total: polygons.length,
      withData: polygons.filter(p => p.data !== null).length,
      withErrors: polygons.filter(p => p.error).length,
      byDataSource: {}
    };

    // Group by data source
    polygons.forEach(polygon => {
      const ds = polygon.dataSource;
      if (!stats.byDataSource[ds]) {
        stats.byDataSource[ds] = 0;
      }
      stats.byDataSource[ds]++;
    });

    return stats;
  }, [polygons]);

  return {
    refreshAllPolygonData,
    refreshSinglePolygon,
    getPolygonStats
  };
};

export default usePolygons;