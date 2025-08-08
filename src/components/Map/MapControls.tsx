import React from 'react';
import { Button, Space, Tooltip } from 'antd';
import {
  PlusOutlined,
  StopOutlined
} from '@ant-design/icons';
import useDashboardStore from '../../store/dashboardStore';

// Props typing
type MapControlsProps = {
  drawingMode: boolean;
  onStartDrawing: () => void;
  onStopDrawing: () => void;
};

const MapControls: React.FC<MapControlsProps> = ({
  drawingMode,
  onStartDrawing,
  onStopDrawing
}) => {
  const { polygons } = useDashboardStore();

  const controlsStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const buttonStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: 'white',
    backdropFilter: 'blur(10px)'
  };

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #722ed1, #9254de)',
    borderColor: '#722ed1'
  };

  return (
    <div style={controlsStyle}>
      <Space direction="vertical">
        {!drawingMode ? (
          <Tooltip title="Draw new polygon" placement="right">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onStartDrawing}
              style={buttonStyle}
            >
              Draw Polygon
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title="Cancel drawing" placement="right">
            <Button
              danger
              icon={<StopOutlined />}
              onClick={onStopDrawing}
              style={activeButtonStyle}
            >
              Cancel Drawing
            </Button>
          </Tooltip>
        )}

        <div
          style={{
            ...buttonStyle,
            padding: '8px 12px',
            fontSize: '12px',
            textAlign: 'center',
            borderRadius: '6px'
          }}
        >
          Polygons: {polygons.length}
        </div>
      </Space>

      {drawingMode && (
        <div
          style={{
            ...buttonStyle,
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            maxWidth: '200px',
            lineHeight: '1.4'
          }}
        >
          <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
            Drawing Mode Active
          </div>
          <div>
            • Click to add points (3–12)<br />
            • Right-click to finish<br />
            • Click near start to close
          </div>
        </div>
      )}
    </div>
  );
};

export default MapControls;
