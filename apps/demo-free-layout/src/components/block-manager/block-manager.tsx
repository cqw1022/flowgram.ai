import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Typography, Toast } from '@douyinfe/semi-ui';
import { IconPlus, IconEdit, IconDelete } from '@douyinfe/semi-icons';
import { BlockDefinition, BlockInputDef, BlockOutputDef } from '../../typings/block';
import { BlockService } from '../../services/block-service';
import { useClientContext } from '@flowgram.ai/free-layout-editor';

/**
 * 块管理组件
 */
export const BlockManager: React.FC = () => {
  const { container } = useClientContext();
  const blockService = container.get(BlockService);
  const [blocks, setBlocks] = useState<BlockDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockDefinition | null>(null);
  const [form] = Form.useForm();

  // 加载块定义
  const loadBlocks = async () => {
    setLoading(true);
    try {
      const blockDefinitions = await blockService.loadBlockDefinitions();
      setBlocks(blockDefinitions);
    } catch (error) {
      Toast.error('加载块定义失败');
      console.error('加载块定义失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlocks();
  }, []);

  // 添加或更新块
  const handleSave = async (values: any) => {
    try {
      // 构建块定义对象
      const blockData: BlockDefinition = {
        type: values.type,
        name: values.name,
        description: values.description,
        executor: {
          name: values.executor,
          entry: values.entry || '',
        },
        inputs_def: parseInputs(values.inputs || ''),
        outputs_def: parseOutputs(values.outputs || ''),
      };

      if (editingBlock) {
        // 编辑现有块
        const blockId = `${editingBlock.type}_${editingBlock.executor.name}`;
        await blockService.updateTaskBlock(blockId, blockData);
        Toast.success('更新任务块成功');
      } else {
        // 添加新块
        await blockService.addTaskBlock(blockData);
        Toast.success('添加任务块成功');
      }

      setModalVisible(false);
      loadBlocks(); // 重新加载数据
    } catch (error) {
      Toast.error(editingBlock ? '更新任务块失败' : '添加任务块失败');
      console.error(editingBlock ? '更新任务块失败:' : '添加任务块失败:', error);
    }
  };

  // 删除块
  const handleDelete = async (block: BlockDefinition) => {
    try {
      const blockId = `${block.type}_${block.executor.name}`;
      await blockService.deleteTaskBlock(blockId);
      Toast.success('删除任务块成功');
      loadBlocks(); // 重新加载数据
    } catch (error) {
      Toast.error('删除任务块失败');
      console.error('删除任务块失败:', error);
    }
  };

  // 打开编辑模态框
  const openEditModal = (block: BlockDefinition) => {
    setEditingBlock(block);
    form.setValues({
      type: block.type,
      name: block.name,
      description: block.description,
      executor: block.executor.name,
      entry: block.executor.entry,
      inputs: formatInputs(block.inputs_def),
      outputs: formatOutputs(block.outputs_def),
    });
    setModalVisible(true);
  };

  // 打开添加模态框
  const openAddModal = () => {
    setEditingBlock(null);
    form.reset();
    setModalVisible(true);
  };

  // 解析输入定义
  const parseInputs = (inputsText: string): BlockInputDef[] => {
    try {
      if (!inputsText.trim()) return [];
      return inputsText.split('\n').map(line => {
        const [handle, type, optional, description] = line.split('|').map(item => item.trim());
        return {
          handle,
          type: type || 'string',
          optional: optional === 'true',
          description: description || '',
        };
      });
    } catch (e) {
      console.error('解析输入定义失败:', e);
      return [];
    }
  };

  // 解析输出定义
  const parseOutputs = (outputsText: string): BlockOutputDef[] => {
    try {
      if (!outputsText.trim()) return [];
      return outputsText.split('\n').map(line => {
        const [handle, type, description] = line.split('|').map(item => item.trim());
        return {
          handle,
          type: type || 'string',
          description: description || '',
        };
      });
    } catch (e) {
      console.error('解析输出定义失败:', e);
      return [];
    }
  };

  // 格式化输入定义为文本
  const formatInputs = (inputs: BlockInputDef[]): string => {
    return inputs.map(input =>
      `${input.handle}|${input.type || 'string'}|${input.optional ? 'true' : 'false'}|${input.description || ''}`
    ).join('\n');
  };

  // 格式化输出定义为文本
  const formatOutputs = (outputs: BlockOutputDef[]): string => {
    return outputs.map(output =>
      `${output.handle}|${output.type || 'string'}|${output.description || ''}`
    ).join('\n');
  };

  // 表格列定义
  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '执行器',
      dataIndex: 'executor.name',
      key: 'executor',
    },
    {
      title: '输入数量',
      key: 'inputsCount',
      render: (text: string, record: BlockDefinition) => record.inputs_def.length,
    },
    {
      title: '输出数量',
      key: 'outputsCount',
      render: (text: string, record: BlockDefinition) => record.outputs_def.length,
    },
    {
      title: '操作',
      key: 'action',
      render: (text: string, record: BlockDefinition) => (
        <Space>
          <Button
            icon={<IconEdit />}
            onClick={() => openEditModal(record)}
            theme="borderless"
            type="tertiary"
          />
          <Button
            icon={<IconDelete />}
            onClick={() => handleDelete(record)}
            theme="borderless"
            type="danger"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="block-manager">
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<IconPlus />}
          onClick={openAddModal}
        >
          添加任务块
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={blocks}
        rowKey={record => `${record.type}_${record.executor.name}`}
        loading={loading}
      />

      <Modal
        title={editingBlock ? '编辑任务块' : '添加任务块'}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onSubmit={handleSave}
        >
          <Form.Input
            field="type"
            label="类型"
            rules={[{ required: true, message: '请输入任务块类型' }]}
            placeholder="输入任务块类型，如：http_request"
          />

          <Form.Input
            field="name"
            label="名称"
            rules={[{ required: true, message: '请输入任务块名称' }]}
            placeholder="输入任务块名称，如：HTTP 请求"
          />

          <Form.TextArea
            field="description"
            label="描述"
            placeholder="输入任务块描述"
            rows={2}
          />

          <Form.Select
            field="executor"
            label="执行器"
            rules={[{ required: true, message: '请选择执行器' }]}
            placeholder="选择执行器"
          >
            <Select.Option value="rust">Rust</Select.Option>
            <Select.Option value="python">Python</Select.Option>
            <Select.Option value="nodejs">NodeJS</Select.Option>
            <Select.Option value="shell">Shell</Select.Option>
          </Form.Select>

          <Form.Input
            field="entry"
            label="入口"
            placeholder="输入执行器入口点，如：main.py"
          />

          <Form.TextArea
            field="inputs"
            label="输入定义"
            placeholder="输入定义"
            rows={4}
            extraText="每行一个输入，格式: 句柄|类型|是否可选|描述。例如: url|string|false|请求地址"
          />

          <Form.TextArea
            field="outputs"
            label="输出定义"
            placeholder="输出定义"
            rows={4}
            extraText="每行一个输出，格式: 句柄|类型|描述。例如: response|string|响应结果"
          />

          <div style={{ marginTop: 20, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
