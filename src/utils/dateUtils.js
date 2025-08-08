import { format, parseISO, addHours, subHours, differenceInHours, isValid } from 'date-fns';

export const formatTimeForDisplay = (date, includeSeconds = false) => {
  if (!date || !isValid(new Date(date))) return 'Invalid Date';
  
  const formatString = includeSeconds ? 'MMM d, yyyy HH:mm:ss' : 'MMM d, yyyy HH:mm';
  return format(new Date(date), formatString);
};

export const formatTimeForSlider = (date) => {
  if (!date || !isValid(new Date(date))) return '';
  
  return format(new Date(date), 'MMM d, HH:mm');
};

export const formatTimeForApi = (date) => {
  if (!date || !isValid(new Date(date))) return '';
  
  return format(new Date(date), 'yyyy-MM-dd');
};

export const formatTimeRangeForDisplay = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (!isValid(start) || !isValid(end)) return 'Invalid Range';
  
  // If same day, show time range only
  if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
    return `${format(start, 'MMM d, HH:mm')} - ${format(end, 'HH:mm')}`;
  }
  
  return `${format(start, 'MMM d, HH:mm')} - ${format(end, 'MMM d, HH:mm')}`;
};

export const createTimeWindow = (centerTime, durationHours = 1) => {
  const center = new Date(centerTime);
  const halfDuration = durationHours / 2;
  
  return {
    start: subHours(center, halfDuration),
    end: addHours(center, halfDuration)
  };
};

export const expandTimeWindow = (currentWindow, additionalHours) => {
  const start = new Date(currentWindow.start);
  const end = new Date(currentWindow.end);
  
  return {
    start: subHours(start, additionalHours / 2),
    end: addHours(end, additionalHours / 2)
  };
};

export const moveTimeWindow = (currentWindow, moveHours) => {
  const start = new Date(currentWindow.start);
  const end = new Date(currentWindow.end);
  
  return {
    start: addHours(start, moveHours),
    end: addHours(end, moveHours)
  };
};

export const getTimeWindowDuration = (timeWindow) => {
  const start = new Date(timeWindow.start);
  const end = new Date(timeWindow.end);
  
  return differenceInHours(end, start);
};

export const isTimeWithinWindow = (time, window) => {
  const targetTime = new Date(time);
  const startTime = new Date(window.start);
  const endTime = new Date(window.end);
  
  return targetTime >= startTime && targetTime <= endTime;
};

export const generateHourlyTimestamps = (startDate, endDate) => {
  const timestamps = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let current = new Date(start);
  
  while (current <= end) {
    timestamps.push(new Date(current));
    current = addHours(current, 1);
  }
  
  return timestamps;
};

export const findClosestTimestamp = (targetTime, timestamps) => {
  if (!timestamps || timestamps.length === 0) return null;
  
  const target = new Date(targetTime);
  let closest = timestamps[0];
  let minDiff = Math.abs(target - new Date(closest));
  
  for (const timestamp of timestamps) {
    const diff = Math.abs(target - new Date(timestamp));
    if (diff < minDiff) {
      minDiff = diff;
      closest = timestamp;
    }
  }
  
  return closest;
};

export const parseApiTimestamp = (timestamp) => {
  try {
    // Handle different timestamp formats
    if (typeof timestamp === 'string') {
      // ISO string format
      if (timestamp.includes('T')) {
        return parseISO(timestamp);
      }
      // Date-only format
      return parseISO(timestamp + 'T00:00:00');
    }
    
    return new Date(timestamp);
  } catch (error) {
    console.error('Error parsing timestamp:', timestamp, error);
    return null;
  }
};

export const getRelativeTimeDescription = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diffHours = differenceInHours(target, now);
  
  if (Math.abs(diffHours) < 1) {
    return 'Now';
  } else if (diffHours > 0) {
    if (diffHours < 24) {
      return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffHours / 24);
      return `In ${days} day${days > 1 ? 's' : ''}`;
    }
  } else {
    const absHours = Math.abs(diffHours);
    if (absHours < 24) {
      return `${absHours} hour${absHours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(absHours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }
};

export default {
  formatTimeForDisplay,
  formatTimeForSlider,
  formatTimeForApi,
  formatTimeRangeForDisplay,
  createTimeWindow,
  expandTimeWindow,
  moveTimeWindow,
  getTimeWindowDuration,
  isTimeWithinWindow,
  generateHourlyTimestamps,
  findClosestTimestamp,
  parseApiTimestamp,
  getRelativeTimeDescription
};