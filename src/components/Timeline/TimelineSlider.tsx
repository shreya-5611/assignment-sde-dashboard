import React, { useState, useEffect, useCallback } from 'react';
import { Button, Switch, Space, Typography, Slider } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  StepBackwardOutlined, 
  StepForwardOutlined,
  CalendarOutlined 
} from '@ant-design/icons';
import { format, addHours, subHours, differenceInHours } from 'date-fns';
import useDashboardStore from '../../store/dashboardStore';

const { Text } = Typography;

const TimelineSlider: React.FC = () => {
  const {
    currentTime,
    timeRange,
    isRangeMode,
    isPlaying,
    setCurrentTime,
    setTimeRange,
    setRangeMode,
    setPlaying,
    getTimeWindow
  } = useDashboardStore();

  // Create 30-day window (15 days before and after current time)
  const timelineStart = subHours(new Date(), 15 * 24);
  const timelineEnd = addHours(new Date(), 15 * 24);
  const totalHours = differenceInHours(timelineEnd, timelineStart);

  // Convert time to slider value (0-100)
  const timeToSliderValue = useCallback((time: Date): number => {
    const hoursFromStart = differenceInHours(time, timelineStart);
    return (hoursFromStart / totalHours) * 100;
  }, [timelineStart, totalHours]);

  // Convert slider value to time
  const sliderValueToTime = useCallback((value: number): Date => {
    const hoursFromStart = (value / 100) * totalHours;
    return addHours(timelineStart, hoursFromStart);
  }, [timelineStart, totalHours]);

  const currentSliderValue = timeToSliderValue(currentTime);
  const rangeSliderValue: [number, number] = [
    timeToSliderValue(timeRange.start),
    timeToSliderValue(timeRange.end)
  ];

  // Handle single time selection
  const handleTimeChange = (value: number) => {
    const newTime = sliderValueToTime(value);
    setCurrentTime(newTime);
  };

  // Handle range selection
  const handleRangeChange = (values: number[]) => {
    if (values && values.length === 2) {
      const [start, end] = values;
      setTimeRange({
        start: sliderValueToTime(start),
        end: sliderValueToTime(end)
      });
    }
  };

  // Playback controls
  const handlePlay = () => {
    setPlaying(true);
  };

  const handlePause = () => {
    setPlaying(false);
  };

  const stepBackward = () => {
    if (isRangeMode) {
      const duration = differenceInHours(timeRange.end, timeRange.start);
      const newStart = subHours(timeRange.start, 1);
      const newEnd = addHours(newStart, duration);
      setTimeRange({ start: newStart, end: newEnd });
    } else {
      setCurrentTime(subHours(currentTime, 1));
    }
  };

  const stepForward = () => {
    if (isRangeMode) {
      const duration = differenceInHours(timeRange.end, timeRange.start);
      const newStart = addHours(timeRange.start, 1);
      const newEnd = addHours(newStart, duration);
      setTimeRange({ start: newStart, end: newEnd });
    } else {
      setCurrentTime(addHours(currentTime, 1));
    }
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (isRangeMode) {
        const duration = differenceInHours(timeRange.end, timeRange.start);
        const newStart = addHours(timeRange.start, 1);
        const newEnd = addHours(newStart, duration);
        
        // Stop if we reach the end
        if (newEnd > timelineEnd) {
          setPlaying(false);
          return;
        }
        
        setTimeRange({ start: newStart, end: newEnd });
      } else {
        const newTime = addHours(currentTime, 1);
        
        // Stop if we reach the end
        if (newTime > timelineEnd) {
          setPlaying(false);
          return;
        }
        
        setCurrentTime(newTime);
      }
    }, 1000); // 1 second interval

    return () => clearInterval(interval);
  }, [isPlaying, currentTime, timeRange, isRangeMode, timelineEnd, setPlaying, setCurrentTime, setTimeRange]);

  // Generate timeline markers
  const getTimelineMarkers = (): Record<number, { label: string; style: React.CSSProperties }> => {
    const markers: Record<number, { label: string; style: React.CSSProperties }> = {};
    const markerInterval = Math.floor(totalHours / 10); // ~10 markers
    
    for (let i = 0; i <= totalHours; i += markerInterval) {
      const time = addHours(timelineStart, i);
      const value = (i / totalHours) * 100;
      markers[value] = {
        label: format(time, 'MMM d'),
        style: { color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px' }
      };
    }
    
    return markers;
  };

  const timeWindow = getTimeWindow();
  const displayTime = isRangeMode 
    ? `${format(timeWindow.start, 'MMM d, HH:mm')} - ${format(timeWindow.end, 'MMM d, HH:mm')}`
    : format(timeWindow.start, 'MMM d, yyyy HH:mm');

  const containerStyle: React.CSSProperties = {
    width: '100%',
    padding: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px'
  };

  const timeDisplayStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '8px 16px',
    borderRadius: '8px',
    backdropFilter: 'blur(10px)'
  };

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const sliderContainerStyle: React.CSSProperties = {
    padding: '0 20px',
    position: 'relative'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={timeDisplayStyle}>
          <CalendarOutlined style={{ color: '#722ed1' }} />
          <Text strong style={{ color: 'white', fontSize: '14px' }}>
            {displayTime}
          </Text>
        </div>

        <Space size="middle">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>
              Single Point
            </Text>
            <Switch
              checked={isRangeMode}
              onChange={setRangeMode}
              style={{
                backgroundColor: isRangeMode ? '#722ed1' : 'rgba(255, 255, 255, 0.3)'
              }}
            />
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>
              Range
            </Text>
          </div>

          <div style={controlsStyle}>
            <Button
              icon={<StepBackwardOutlined />}
              size="small"
              onClick={stepBackward}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white'
              }}
            />
            
            {isPlaying ? (
              <Button
                icon={<PauseCircleOutlined />}
                type="primary"
                size="small"
                onClick={handlePause}
                style={{
                  background: 'linear-gradient(135deg, #722ed1, #9254de)',
                  borderColor: '#722ed1'
                }}
              >
                Pause
              </Button>
            ) : (
              <Button
                icon={<PlayCircleOutlined />}
                type="primary"
                size="small"
                onClick={handlePlay}
                style={{
                  background: 'linear-gradient(135deg, #722ed1, #9254de)',
                  borderColor: '#722ed1'
                }}
              >
                Play
              </Button>
            )}
            
            <Button
              icon={<StepForwardOutlined />}
              size="small"
              onClick={stepForward}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white'
              }}
            />
          </div>
        </Space>
      </div>

      <div style={sliderContainerStyle}>
        {isRangeMode ? (
          <Slider
            range
            value={rangeSliderValue}
            onChange={handleRangeChange}
            marks={getTimelineMarkers()}
            tooltip={{
              formatter: (value?: number) => 
                value !== undefined ? format(sliderValueToTime(value), 'MMM d, HH:mm') : ''
            }}
            trackStyle={[{ 
              background: 'linear-gradient(90deg, #722ed1, #9254de)',
              height: '6px'
            }]}
            railStyle={{
              background: 'rgba(255, 255, 255, 0.2)',
              height: '6px'
            }}
            handleStyle={[
              {
                border: '3px solid #722ed1',
                backgroundColor: '#ffffff',
                width: '16px',
                height: '16px',
                boxShadow: '0 0 10px rgba(114, 46, 209, 0.5)'
              },
              {
                border: '3px solid #722ed1',
                backgroundColor: '#ffffff',
                width: '16px',
                height: '16px',
                boxShadow: '0 0 10px rgba(114, 46, 209, 0.5)'
              }
            ]}
          />
        ) : (
          <Slider
            value={currentSliderValue}
            onChange={handleTimeChange}
            marks={getTimelineMarkers()}
            tooltip={{
              formatter: (value?: number) => 
                value !== undefined ? format(sliderValueToTime(value), 'MMM d, HH:mm') : ''
            }}
            trackStyle={{
              background: 'linear-gradient(90deg, #722ed1, #9254de)',
              height: '6px'
            }}
            railStyle={{
              background: 'rgba(255, 255, 255, 0.2)',
              height: '6px'
            }}
            handleStyle={{
              border: '3px solid #722ed1',
              backgroundColor: '#ffffff',
              width: '16px',
              height: '16px',
              boxShadow: '0 0 10px rgba(114, 46, 209, 0.5)'
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TimelineSlider;

















// import React, { useEffect, useCallback } from 'react';
// import { Button, Switch, Space, Typography, Slider } from 'antd';
// import {
//   PlayCircleOutlined,
//   PauseCircleOutlined,
//   StepBackwardOutlined,
//   StepForwardOutlined,
//   CalendarOutlined
// } from '@ant-design/icons';
// import { format, addHours, subHours, differenceInHours } from 'date-fns';
// import useDashboardStore from '../../store/dashboardStore';

// const { Text } = Typography;

// const TimelineSlider: React.FC = () => {
//   const {
//     currentTime,
//     timeRange,
//     isRangeMode,
//     isPlaying,
//     setCurrentTime,
//     setTimeRange,
//     setRangeMode,
//     setPlaying,
//     getTimeWindow
//   } = useDashboardStore();

//   const timelineStart = subHours(new Date(), 15 * 24);
//   const timelineEnd = addHours(new Date(), 15 * 24);
//   const totalHours = differenceInHours(timelineEnd, timelineStart);

//   const timeToSliderValue = useCallback(
//     (time: Date): number => {
//       const hoursFromStart = differenceInHours(time, timelineStart);
//       return (hoursFromStart / totalHours) * 100;
//     },
//     [timelineStart, totalHours]
//   );

//   const sliderValueToTime = useCallback(
//     (value: number): Date => {
//       const hoursFromStart = (value / 100) * totalHours;
//       return addHours(timelineStart, hoursFromStart);
//     },
//     [timelineStart, totalHours]
//   );

//   const currentSliderValue = timeToSliderValue(currentTime);
//   const rangeSliderValue: [number, number] = [
//     timeToSliderValue(timeRange.start),
//     timeToSliderValue(timeRange.end)
//   ];

//   const handleTimeChange = (value: number | null) => {
//     if (value !== null) {
//       setCurrentTime(sliderValueToTime(value));
//     }
//   };

//   const handleRangeChange = (values: number[]) => {
//     if (values && values.length === 2) {
//       const [start, end] = values;
//       setTimeRange({
//         start: sliderValueToTime(start),
//         end: sliderValueToTime(end)
//       });
//     }
//   };

//   const handlePlay = () => setPlaying(true);
//   const handlePause = () => setPlaying(false);

//   const stepBackward = () => {
//     if (isRangeMode) {
//       const duration = differenceInHours(timeRange.end, timeRange.start);
//       const newStart = subHours(timeRange.start, 1);
//       const newEnd = addHours(newStart, duration);
//       setTimeRange({ start: newStart, end: newEnd });
//     } else {
//       setCurrentTime(subHours(currentTime, 1));
//     }
//   };

//   const stepForward = () => {
//     if (isRangeMode) {
//       const duration = differenceInHours(timeRange.end, timeRange.start);
//       const newStart = addHours(timeRange.start, 1);
//       const newEnd = addHours(newStart, duration);
//       setTimeRange({ start: newStart, end: newEnd });
//     } else {
//       setCurrentTime(addHours(currentTime, 1));
//     }
//   };

//   useEffect(() => {
//     if (!isPlaying) return;

//     const interval = setInterval(() => {
//       if (isRangeMode) {
//         const duration = differenceInHours(timeRange.end, timeRange.start);
//         const newStart = addHours(timeRange.start, 1);
//         const newEnd = addHours(newStart, duration);

//         if (newEnd > timelineEnd) {
//           setPlaying(false);
//           return;
//         }

//         setTimeRange({ start: newStart, end: newEnd });
//       } else {
//         const newTime = addHours(currentTime, 1);

//         if (newTime > timelineEnd) {
//           setPlaying(false);
//           return;
//         }

//         setCurrentTime(newTime);
//       }
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [isPlaying, currentTime, timeRange, isRangeMode, timelineEnd, setPlaying, setCurrentTime, setTimeRange]);

//   const getTimelineMarkers = (): Record<number, { label: string; style: React.CSSProperties }> => {
//     const markers: Record<number, { label: string; style: React.CSSProperties }> = {};
//     const markerInterval = Math.floor(totalHours / 10);

//     for (let i = 0; i <= totalHours; i += markerInterval) {
//       const time = addHours(timelineStart, i);
//       const value = (i / totalHours) * 100;
//       markers[value] = {
//         label: format(time, 'MMM d'),
//         style: { color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px' }
//       };
//     }

//     return markers;
//   };

//   const timeWindow = getTimeWindow();
//   const displayTime = isRangeMode
//     ? `${format(timeWindow.start, 'MMM d, HH:mm')} - ${format(timeWindow.end, 'MMM d, HH:mm')}`
//     : format(timeWindow.start, 'MMM d, yyyy HH:mm');

//   return (
//     <div style={{ width: '100%', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
//       {/* Top Controls */}
//       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', padding: '8px 16px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
//           <CalendarOutlined style={{ color: '#722ed1' }} />
//           <Text strong style={{ color: 'white', fontSize: '14px' }}>{displayTime}</Text>
//         </div>

//         <Space size="middle">
//           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//             <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>Single Point</Text>
//             <Switch
//               checked={isRangeMode}
//               onChange={setRangeMode}
//               style={{ backgroundColor: isRangeMode ? '#722ed1' : 'rgba(255, 255, 255, 0.3)' }}
//             />
//             <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>Range</Text>
//           </div>

//           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//             <Button icon={<StepBackwardOutlined />} size="small" onClick={stepBackward} style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white' }} />
//             {isPlaying ? (
//               <Button icon={<PauseCircleOutlined />} type="primary" size="small" onClick={handlePause} style={{ background: 'linear-gradient(135deg, #722ed1, #9254de)', borderColor: '#722ed1' }}>
//                 Pause
//               </Button>
//             ) : (
//               <Button icon={<PlayCircleOutlined />} type="primary" size="small" onClick={handlePlay} style={{ background: 'linear-gradient(135deg, #722ed1, #9254de)', borderColor: '#722ed1' }}>
//                 Play
//               </Button>
//             )}
//             <Button icon={<StepForwardOutlined />} size="small" onClick={stepForward} style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white' }} />
//           </div>
//         </Space>
//       </div>

//       Slider
//       <div style={{ padding: '0 20px', position: 'relative' }}>
//         {isRangeMode ? (
//           <Slider
//             range
//             value={rangeSliderValue}
//             onChange={handleRangeChange}
//             marks={getTimelineMarkers()}
//             tooltip={{
//               formatter: (value?: number) =>
//                 value !== undefined ? format(sliderValueToTime(value), 'MMM d, HH:mm') : ''
//             }}
//             trackStyle={[{ background: 'linear-gradient(90deg, #722ed1, #9254de)', height: '6px' }]}
//             railStyle={{ background: 'rgba(255, 255, 255, 0.2)', height: '6px' }}
//             handleStyle={[
//               { border: '3px solid #722ed1', backgroundColor: '#ffffff', width: '16px', height: '16px', boxShadow: '0 0 10px rgba(114, 46, 209, 0.5)' },
//               { border: '3px solid #722ed1', backgroundColor: '#ffffff', width: '16px', height: '16px', boxShadow: '0 0 10px rgba(114, 46, 209, 0.5)' }
//             ]}
//           />
//         ) : (
//           <Slider
//             value={currentSliderValue}
//             onChange={handleTimeChange}
//             marks={getTimelineMarkers()}
//             tooltip={{
//               formatter: (value?: number) =>
//                 value !== undefined ? format(sliderValueToTime(value), 'MMM d, HH:mm') : ''
//             }}
//             trackStyle={[{ background: 'linear-gradient(90deg, #722ed1, #9254de)', height: '6px' }]}
//             railStyle={{ background: 'rgba(255, 255, 255, 0.2)', height: '6px' }}
//             handleStyle={{
//               border: '3px solid #722ed1',
//               backgroundColor: '#ffffff',
//               width: '16px',
//               height: '16px',
//               boxShadow: '0 0 10px rgba(114, 46, 209, 0.5)'
//             }}
//           />
//         )}
//       </div>
//     </div>
//   );
// };

// export default TimelineSlider;