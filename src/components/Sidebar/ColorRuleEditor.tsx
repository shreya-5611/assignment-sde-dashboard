import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Select, 
  Space, 
  Typography, 
  Popconfirm,
  message,
  Card
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import useDashboardStore from '../../store/dashboardStore';

const { Text } = Typography;
const { Option } = Select;

type ColorRule = {
  operator: string;
  value: number;
  operator2?: string;
  value2?: number;
  color: string;
};

interface ColorRuleEditorProps {
  dataSourceId: string;
}

interface RuleFormProps {
  rule: ColorRule;
  isNew: boolean;
  onSave: () => void;
  onCancel: () => void;
  onChange: (rule: ColorRule) => void;
}

const ColorRuleEditor: React.FC<ColorRuleEditorProps> = ({ dataSourceId }) => {
  const { 
    getDataSourceById,
    addColorRule,
    updateColorRule,
    deleteColorRule
  } = useDashboardStore();

  const [isAdding, setIsAdding] = useState(false);
  const [editingRule, setEditingRule] = useState<(ColorRule & { index: number }) | null>(null);
  const [newRule, setNewRule] = useState<ColorRule>({
    operator: '>=',
    value: 0,
    operator2: '',
    value2: undefined,
    color: '#722ed1'
  });

  const dataSource = getDataSourceById(dataSourceId);
  
  if (!dataSource) return null;

  const operators = [
    { value: '=', label: '=' },
    { value: '<', label: '<' },
    { value: '<=', label: '≤' },
    { value: '>', label: '>' },
    { value: '>=', label: '≥' }
  ];

  const colors = [
    '#f5222d', '#fa541c', '#faad14', '#a0d911',
    '#52c41a', '#13c2c2', '#1890ff', '#2f54eb',
    '#722ed1', '#eb2f96', '#666666', '#d9d9d9'
  ];

  const handleAddRule = () => {
    if (newRule.value === null || newRule.value === undefined) {
      message.error('Please enter a value');
      return;
    }
    addColorRule(dataSourceId, { ...newRule });
    setNewRule({
      operator: '>=',
      value: 0,
      operator2: '',
      value2: undefined,
      color: '#722ed1'
    });
    setIsAdding(false);
    message.success('Color rule added');
  };

  const handleUpdateRule = (ruleIndex: number) => {
    if (!editingRule || editingRule.value === null || editingRule.value === undefined) {
      message.error('Please enter a value');
      return;
    }
    updateColorRule(dataSourceId, ruleIndex, editingRule);
    setEditingRule(null);
    message.success('Color rule updated');
  };

  const handleDeleteRule = (ruleIndex: number) => {
    deleteColorRule(dataSourceId, ruleIndex);
    message.success('Color rule deleted');
  };

  const startEdit = (rule: ColorRule, index: number) => {
    setEditingRule({ ...rule, index });
  };

  const cancelEdit = () => {
    setEditingRule(null);
  };

  const RuleForm: React.FC<RuleFormProps> = ({ rule, isNew, onSave, onCancel, onChange }) => (
    <Card 
      size="small" 
      style={{ 
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        marginBottom: '8px'
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px', minWidth: '15px' }}>
            If
          </Text>
          
          <Select
            value={rule.operator}
            onChange={(value) => onChange({ ...rule, operator: value })}
            size="small"
            style={{ minWidth: '60px' }}
          >
            {operators.map(op => (
              <Option key={op.value} value={op.value}>{op.label}</Option>
            ))}
          </Select>
          
          <Input
            type="number"
            value={rule.value}
            onChange={(e) => onChange({ ...rule, value: parseFloat(e.target.value) })}
            placeholder="Value"
            size="small"
            style={{ width: '70px' }}
          />

          {rule.operator !== '=' && (
            <>
              <Select
                value={rule.operator2}
                onChange={(value) => onChange({ ...rule, operator2: value, value2: value ? rule.value2 : undefined })}
                size="small"
                style={{ minWidth: '60px' }}
                allowClear
                placeholder="And"
              >
                <Option value="<">{"<"}</Option>
                <Option value="<=">≤</Option>
                <Option value=">">{">"}</Option>
                <Option value=">=">≥</Option>
              </Select>
              
              {rule.operator2 && (
                <Input
                  type="number"
                  value={rule.value2}
                  onChange={(e) => onChange({ ...rule, value2: parseFloat(e.target.value) })}
                  placeholder="Value 2"
                  size="small"
                  style={{ width: '70px' }}
                />
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>
            Color:
          </Text>
          
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {colors.map(color => (
              <div
                key={color}
                onClick={() => onChange({ ...rule, color })}
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: color,
                  borderRadius: '3px',
                  cursor: 'pointer',
                  border: rule.color === color ? '2px solid white' : '1px solid rgba(255, 255, 255, 0.3)',
                  boxSizing: 'border-box'
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button
            size="small"
            icon={<SaveOutlined />}
            type="primary"
            onClick={onSave}
            style={{
              background: 'linear-gradient(135deg, #52c41a, #73d13d)',
              borderColor: '#52c41a'
            }}
          >
            {isNew ? 'Add' : 'Save'}
          </Button>
          <Button
            size="small"
            icon={<CloseOutlined />}
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </Space>
    </Card>
  );

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <Text strong style={{ color: 'white', fontSize: '13px' }}>
          Manage Rules
        </Text>
        {!isAdding && (
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setIsAdding(true)}
            style={{
              background: 'rgba(114, 46, 209, 0.2)',
              border: '1px solid #722ed1',
              color: '#722ed1'
            }}
          >
            Add Rule
          </Button>
        )}
      </div>

      {isAdding && (
        <RuleForm
          rule={newRule}
          isNew={true}
          onSave={handleAddRule}
          onCancel={() => setIsAdding(false)}
          onChange={setNewRule}
        />
      )}

      <div style={{ maxHeight: '300px', overflow: 'auto' }}>
        {dataSource.colorRules.map((rule: ColorRule, index: number) => (
          <div key={index}>
            {editingRule && editingRule.index === index ? (
              <RuleForm
                rule={editingRule}
                isNew={false}
                onSave={() => handleUpdateRule(index)}
                onCancel={cancelEdit}
                onChange={(updatedRule) => setEditingRule({ ...updatedRule, index })}
              />
            ) : (
              <Card
                size="small"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '8px'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: rule.color,
                        borderRadius: '3px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        flexShrink: 0
                      }}
                    />
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>
                      {rule.operator} {rule.value}
                      {rule.operator2 && rule.value2 !== undefined && (
                        <span> and {rule.operator2} {rule.value2}</span>
                      )}
                    </Text>
                  </div>
                  
                  <Space size="small">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => startEdit(rule, index)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.6)'
                      }}
                    />
                    <Popconfirm
                      title="Delete this rule?"
                      onConfirm={() => handleDeleteRule(index)}
                      okText="Yes"
                      cancelText="No"
                      placement="topRight"
                    >
                      <Button
                        size="small"
                        icon={<DeleteOutlined />}
                        danger
                        style={{
                          background: 'transparent',
                          border: 'none'
                        }}
                      />
                    </Popconfirm>
                  </Space>
                </div>
              </Card>
            )}
          </div>
        ))}
      </div>

      {dataSource.colorRules.length === 0 && !isAdding && (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '12px'
        }}>
          No color rules defined.<br />
          Add rules to visualize data on polygons.
        </div>
      )}
    </div>
  );
};

export default ColorRuleEditor;
