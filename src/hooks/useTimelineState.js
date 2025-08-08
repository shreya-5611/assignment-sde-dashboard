import { useCallback, useEffect } from 'react';
import { addHours, subHours, differenceInHours, isAfter, isBefore } from 'date-fns';
import useDashboardStore from '../store/dashboardStore';

export const useTimelineState = () => {
  const {
    currentTime,
    timeRange,
    isRangeMode,
    isPlaying,
    setCurrentTime,
    setTimeRange,
    setPlaying,
    getTimeWindow
  } = useDashboardStore();

  // Timeline boundaries (15 days before and after current date)
  const timelineStart = subHours(new Date(), 15 * 24);
  const timelineEnd = addHours(new Date(), 15 * 24);

  const moveTimeForward = useCallback((hours = 1) => {
    if (isRangeMode) {
      const duration = differenceInHours(timeRange.end, timeRange.start);
      const newStart = addHours(timeRange.start, hours);
      const newEnd = addHours(newStart, duration);
      
      // Check boundaries
      if (isAfter(newEnd, timelineEnd)) {
        setPlaying(false);
        return false;
      }
      
      setTimeRange({ start: newStart, end: newEnd });
    } else {
      const newTime = addHours(currentTime, hours);
      
      // Check boundaries
      if (isAfter(newTime, timelineEnd)) {
        setPlaying(false);
        return false;
      }
      
      setCurrentTime(newTime);
    }
    
    return true;
  }, [isRangeMode, currentTime, timeRange, timelineEnd, setCurrentTime, setTimeRange, setPlaying]);

  const moveTimeBackward = useCallback((hours = 1) => {
    if (isRangeMode) {
      const duration = differenceInHours(timeRange.end, timeRange.start);
      const newStart = subHours(timeRange.start, hours);
      const newEnd = addHours(newStart, duration);
      
      // Check boundaries
      if (isBefore(newStart, timelineStart)) {
        return false;
      }
      
      setTimeRange({ start: newStart, end: newEnd });
    } else {
      const newTime = subHours(currentTime, hours);
      
      // Check boundaries
      if (isBefore(newTime, timelineStart)) {
        return false;
      }
      
      setCurrentTime(newTime);
    }
    
    return true;
  }, [isRangeMode, currentTime, timeRange, timelineStart, setCurrentTime, setTimeRange]);

  const jumpToTime = useCallback((targetTime) => {
    // Validate target time is within boundaries
    if (isBefore(targetTime, timelineStart) || isAfter(targetTime, timelineEnd)) {
      return false;
    }

    if (isRangeMode) {
      const duration = differenceInHours(timeRange.end, timeRange.start);
      const newEnd = addHours(targetTime, duration);
      
      // Adjust if end time exceeds boundary
      if (isAfter(newEnd, timelineEnd)) {
        const adjustedStart = subHours(timelineEnd, duration);
        setTimeRange({ start: adjustedStart, end: timelineEnd });
      } else {
        setTimeRange({ start: targetTime, end: newEnd });
      }
    } else {
      setCurrentTime(targetTime);
    }
    
    return true;
  }, [isRangeMode, timeRange, timelineStart, timelineEnd, setCurrentTime, setTimeRange]);

  const setTimeRangeDuration = useCallback((hours) => {
    const newEnd = addHours(timeRange.start, hours);
    
    // Validate new range is within boundaries
    if (isAfter(newEnd, timelineEnd)) {
      const adjustedStart = subHours(timelineEnd, hours);
      setTimeRange({ start: adjustedStart, end: timelineEnd });
    } else {
      setTimeRange({ start: timeRange.start, end: newEnd });
    }
  }, [timeRange.start, timelineEnd, setTimeRange]);

  const resetToNow = useCallback(() => {
    const now = new Date();
    
    if (isRangeMode) {
      const duration = differenceInHours(timeRange.end, timeRange.start);
      const newStart = subHours(now, duration / 2);
      const newEnd = addHours(now, duration / 2);
      
      setTimeRange({ start: newStart, end: newEnd });
    } else {
      setCurrentTime(now);
    }
  }, [isRangeMode, timeRange, setCurrentTime, setTimeRange]);

  const getTimeProgress = useCallback(() => {
    const window = getTimeWindow();
    const totalDuration = differenceInHours(timelineEnd, timelineStart);
    const currentPosition = differenceInHours(window.start, timelineStart);
    
    return (currentPosition / totalDuration) * 100;
  }, [getTimeWindow, timelineStart, timelineEnd]);

  const canMoveForward = useCallback(() => {
    const window = getTimeWindow();
    return isBefore(window.end, timelineEnd);
  }, [getTimeWindow, timelineEnd]);

  const canMoveBackward = useCallback(() => {
    const window = getTimeWindow();
    return isAfter(window.start, timelineStart);
  }, [getTimeWindow, timelineStart]);

  // Auto-play functionality with boundary checking
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const canContinue = moveTimeForward(1);
      if (!canContinue) {
        setPlaying(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, moveTimeForward, setPlaying]);

  return {
    moveTimeForward,
    moveTimeBackward,
    jumpToTime,
    setTimeRangeDuration,
    resetToNow,
    getTimeProgress,
    canMoveForward,
    canMoveBackward,
    timelineStart,
    timelineEnd
  };
};

export default useTimelineState;