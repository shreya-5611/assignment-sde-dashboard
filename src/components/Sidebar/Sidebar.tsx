import React, { useState } from 'react';
import {
  Card,
  List,
  Button,
  Input,
  Select,
  Typography,
  Collapse,
  Space,
  Badge,
  message,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  SettingOutlined,
  DatabaseOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import useDashboardStore from '../../store/dashboardStore';
import ColorRuleEditor from './ColorRuleEditor';
import DataSourceSelector from './DataSourceSelector';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

interface PolygonType {
  id: string;
  name: string;
  dataSource: string;
  data: number | null;
  color?: string;
  coordinates: [number, number][];
  createdAt: string;
}

interface DataSourceType {
  id: string;
  name: string;
  unit: string;
}

const Sidebar: React.FC = () => {
  const {
    polygons,
    activePolygon,
    dataSources,
    setActivePolygon,
    updatePolygon,
    deletePolygon,
    getDataSourceById,
  }: {
    polygons: PolygonType[];
    activePolygon: string | null;
    dataSources: DataSourceType[];
    setActivePolygon: (id: string) => void;
    updatePolygon: (id: string, updates: Partial<PolygonType>) => void;
    deletePolygon: (id: string) => void;
    getDataSourceById: (id: string) => DataSourceType | undefined;
  } = useDashboardStore();

  const [editingPolygon, setEditingPolygon] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleStartEdit = (polygon: PolygonType) => {
    setEditingPolygon(polygon.id);
    setEditingName(polygon.name);
  };

  const handleSaveEdit = (polygonId: string) => {
    if (editingName.trim()) {
      updatePolygon(polygonId, { name: editingName.trim() });
      message.success('Polygon renamed successfully');
    }
    setEditingPolygon(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingPolygon(null);
    setEditingName('');
  };

  const handleDeletePolygon = (polygonId: string) => {
    deletePolygon(polygonId);
    message.success('Polygon deleted successfully');
  };

  const handleDataSourceChange = (polygonId: string, dataSourceId: string) => {
    updatePolygon(polygonId, { dataSource: dataSourceId });
    message.success('Data source updated');
  };

  const sidebarStyle: React.CSSProperties = {
    height: '100%',
    padding: '20px',
    overflow: 'auto',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '16px',
  };

  const activePolygonStyle: React.CSSProperties = {
    ...cardStyle,
    border: '2px solid #722ed1',
    boxShadow: '0 0 10px rgba(114, 46, 209, 0.3)',
  };

  return (
    <div style={sidebarStyle}>
      <Title level={4} style={{ color: 'white', marginBottom: '20px' }}>
        <SettingOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
        Control Panel
      </Title>

      <Collapse
        defaultActiveKey={['polygons', 'datasources']}
        ghost
        style={{ background: 'transparent' }}
      >
        <Panel
          header={
            <div style={{ color: 'white', fontWeight: 'bold' }}>
              <DatabaseOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
              Polygons ({polygons.length})
            </div>
          }
          key="polygons"
        >
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {polygons.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '14px',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
                <div>No polygons created yet</div>
                <div>Click "Draw Polygon" on the map to start</div>
              </div>
            ) : (
              <List
                dataSource={polygons}
                renderItem={(polygon) => {
                  const dataSource = getDataSourceById(polygon.dataSource);
                  const isActive = activePolygon === polygon.id;

                  return (
                    <Card
                      size="small"
                      style={isActive ? activePolygonStyle : cardStyle}
                      hoverable
                      onClick={() => setActivePolygon(polygon.id)}
                    >
                      <div>
                        {editingPolygon === polygon.id ? (
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onPressEnter={() => handleSaveEdit(polygon.id)}
                              placeholder="Polygon name"
                              autoFocus
                            />
                            <Space>
                              <Button
                                size="small"
                                type="primary"
                                onClick={() => handleSaveEdit(polygon.id)}
                              >
                                Save
                              </Button>
                              <Button size="small" onClick={handleCancelEdit}>
                                Cancel
                              </Button>
                            </Space>
                          </Space>
                        ) : (
                          <>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                              }}
                            >
                              <Text strong style={{ color: 'white' }}>
                                {polygon.name}
                              </Text>
                              <Space size="small">
                                <Button
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEdit(polygon);
                                  }}
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: 'none',
                                    color: 'white',
                                  }}
                                />
                                <Button
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePolygon(polygon.id);
                                  }}
                                  style={{
                                    background: 'rgba(255, 77, 79, 0.2)',
                                    border: 'none',
                                  }}
                                />
                              </Space>
                            </div>

                            <div style={{ marginBottom: '8px' }}>
                              <Text
                                style={{
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  fontSize: '12px',
                                }}
                              >
                                Data Source:
                              </Text>
                              <Select
                                value={polygon.dataSource}
                                onChange={(value) =>
                                  handleDataSourceChange(polygon.id, value)
                                }
                                size="small"
                                style={{ width: '100%', marginTop: '4px' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {dataSources.map((ds) => (
                                  <Option key={ds.id} value={ds.id}>
                                    {ds.name} ({ds.unit})
                                  </Option>
                                ))}
                              </Select>
                            </div>

                            {polygon.data !== null && dataSource && (
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                }}
                              >
                                <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                  Current Value:
                                </span>
                                <Badge
                                  color={polygon.color || '#722ed1'}
                                  text={
                                    <span
                                      style={{
                                        color: 'white',
                                        fontWeight: 'bold',
                                      }}
                                    >
                                      {polygon.data.toFixed(1)} {dataSource.unit}
                                    </span>
                                  }
                                />
                              </div>
                            )}

                            <div
                              style={{
                                marginTop: '8px',
                                fontSize: '11px',
                                color: 'rgba(255, 255, 255, 0.5)',
                              }}
                            >
                              Points: {polygon.coordinates.length} | Created:{' '}
                              {new Date(polygon.createdAt).toLocaleDateString()}
                            </div>
                          </>
                        )}
                      </div>
                    </Card>
                  );
                }}
              />
            )}
          </div>
        </Panel>

        <Panel
          header={
            <div style={{ color: 'white', fontWeight: 'bold' }}>
              <BgColorsOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
              Data Sources & Color Rules
            </div>
          }
          key="datasources"
        >
          <DataSourceSelector />
        </Panel>

        {activePolygon && (
          <Panel
            header={
              <div style={{ color: 'white', fontWeight: 'bold' }}>
                <EyeOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
                Active Polygon Settings
              </div>
            }
            key="active"
          >
            <ActivePolygonSettings polygonId={activePolygon} />
          </Panel>
        )}
      </Collapse>
    </div>
  );
};

interface ActivePolygonSettingsProps {
  polygonId: string;
}

const ActivePolygonSettings: React.FC<ActivePolygonSettingsProps> = ({ polygonId }) => {
  const { getPolygonById, getDataSourceById } = useDashboardStore();
  const polygon = getPolygonById(polygonId) as PolygonType | undefined;
  const dataSource = polygon ? getDataSourceById(polygon.dataSource) : undefined;

  if (!polygon) return null;

  return (
    <Card
      size="small"
      style={{
        background: 'rgba(114, 46, 209, 0.1)',
        border: '1px solid rgba(114, 46, 209, 0.3)',
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong style={{ color: 'white' }}>
            {polygon.name}
          </Text>
        </div>

        {dataSource && (
          <div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Data Source: {dataSource.name}
            </Text>
          </div>
        )}

        {polygon.data !== null && dataSource && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '8px',
              borderRadius: '4px',
            }}
          >
            <div style={{ color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {polygon.data.toFixed(1)}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>{dataSource.unit}</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
          <div>Coordinates: {polygon.coordinates.length} points</div>
          <div>Created: {new Date(polygon.createdAt).toLocaleString()}</div>
        </div>
      </Space>
    </Card>
  );
};

export default Sidebar;
