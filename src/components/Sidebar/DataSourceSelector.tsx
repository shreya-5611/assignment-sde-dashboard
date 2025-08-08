import React, { useState } from 'react';
import { Card, Tabs, Typography, Space } from 'antd';
import { 
  ThunderboltOutlined, 
  CloudOutlined, 
  DropboxOutlined 
} from '@ant-design/icons';
import useDashboardStore from '../../store/dashboardStore';
import ColorRuleEditor from './ColorRuleEditor';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface ColorRule {
  operator: string;
  value: number;
  operator2?: string;
  value2?: number;
  color: string;
}

interface DataSource {
  id: string;
  name: string;
  field: string;
  unit: string;
  colorRules: ColorRule[];
}

const DataSourceSelector: React.FC = () => {
  const { dataSources }: { dataSources: DataSource[] } = useDashboardStore();
  const [activeTab, setActiveTab] = useState<string>(dataSources[0]?.id || 'temperature');

  const getDataSourceIcon = (id: string) => {
    switch (id) {
      case 'temperature':
        return <ThunderboltOutlined style={{ color: '#faad14' }} />;
      case 'humidity':
        return <CloudOutlined style={{ color: '#1890ff' }} />;
      case 'precipitation':
        return <DropboxOutlined style={{ color: '#52c41a' }} />;
      default:
        return <ThunderboltOutlined style={{ color: '#722ed1' }} />;
    }
  };

  const tabBarStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px 8px 0 0',
    margin: 0,
    padding: '0 8px'
  };

  return (
    <Card
      size="small"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <Tabs 
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        type="card"
        size="small"
        tabBarStyle={tabBarStyle}
      >
        {dataSources.map((dataSource) => (
          <TabPane
            key={dataSource.id}
            tab={
              <Space size="small">
                {getDataSourceIcon(dataSource.id)}
                <span style={{ color: 'white', fontSize: '12px' }}>
                  {dataSource.name}
                </span>
              </Space>
            }
          >
            <DataSourcePanel dataSource={dataSource} />
          </TabPane>
        ))}
      </Tabs>
    </Card>
  );
};

interface DataSourcePanelProps {
  dataSource: DataSource;
}

const DataSourcePanel: React.FC<DataSourcePanelProps> = ({ dataSource }) => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div>
        <Title level={5} style={{ color: 'white', margin: 0 }}>
          {dataSource.name}
        </Title>
        <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
          Field: {dataSource.field} | Unit: {dataSource.unit}
        </Text>
      </div>

      <div>
        <Text strong style={{ color: 'white', fontSize: '13px', marginBottom: '8px', display: 'block' }}>
          Color Rules:
        </Text>
        <ColorRulePreview dataSource={dataSource} />
      </div>

      <ColorRuleEditor dataSourceId={dataSource.id} />
    </Space>
  );
};

interface ColorRulePreviewProps {
  dataSource: DataSource;
}

const ColorRulePreview: React.FC<ColorRulePreviewProps> = ({ dataSource }) => {
  const getRuleText = (rule: ColorRule) => {
    if (rule.operator === '=' && rule.value === 0) {
      return 'No data';
    }
    
    if (rule.operator2 && rule.value2 !== undefined) {
      return `${rule.value} ${rule.operator === '>=' ? '≥' : rule.operator} x ${rule.operator2 === '<' ? '<' : rule.operator2} ${rule.value2}`;
    }
    
    const operatorMap: Record<string, string> = {
      '>=': '≥',
      '<=': '≤',
      '>': '>',
      '<': '<',
      '=': '=',
      '==': '='
    };
    
    return `x ${operatorMap[rule.operator] || rule.operator} ${rule.value}`;
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {dataSource.colorRules.map((rule, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              fontSize: '11px'
            }}
          >
            <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              {getRuleText(rule)}
            </span>
            <div
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: rule.color,
                borderRadius: '3px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                flexShrink: 0
              }}
            />
          </div>
        ))}
      </Space>
      
      {dataSource.colorRules.length === 0 && (
        <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', fontStyle: 'italic' }}>
          No color rules defined
        </Text>
      )}
    </div>
  );
};

export default DataSourceSelector;
