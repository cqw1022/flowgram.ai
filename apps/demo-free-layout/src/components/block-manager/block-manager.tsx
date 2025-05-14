import React, { useEffect, useState, useRef } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Typography, Toast } from '@douyinfe/semi-ui';
import { IconPlus, IconEdit, IconDelete } from '@douyinfe/semi-icons';
import { BlockDefinition, BlockInputDef, BlockOutputDef } from '../../typings/block';
import { BlockService } from '../../services/block-service';
import { useClientContext } from '@flowgram.ai/free-layout-editor';
import { useI18n } from '../../context/i18n-context';

/**
 * 块管理组件
 */
export const BlockManager: React.FC = () => {
  const { container } = useClientContext();
  const blockService = container.get(BlockService);
  const { t } = useI18n();
  const [blocks, setBlocks] = useState<BlockDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockDefinition | null>(null);

  // 使用useRef代替Form.useForm
  const formRef = useRef<any>(null);

  // 加载块定义
  const loadBlocks = async () => {
    setLoading(true);
    try {
      const blockDefinitions = await blockService.loadBlockDefinitions();
      setBlocks(blockDefinitions);
    } catch (error) {
      Toast.error(t('LoadBlocksFailed'));
      console.error(t('LoadBlocksFailed'), error);
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
        Toast.success(t('UpdateBlockSuccess'));
      } else {
        // 添加新块
        await blockService.addTaskBlock(blockData);
        Toast.success(t('AddBlockSuccess'));
      }

      setModalVisible(false);
      loadBlocks(); // 重新加载数据
    } catch (error) {
      Toast.error(editingBlock ? t('UpdateBlockFailed') : t('AddBlockFailed'));
      console.error(editingBlock ? t('UpdateBlockFailed') : t('AddBlockFailed'), error);
    }
  };

  // 删除块
  const handleDelete = async (block: BlockDefinition) => {
    try {
      const blockId = `${block.type}_${block.executor.name}`;
      await blockService.deleteTaskBlock(blockId);
      Toast.success(t('DeleteBlockSuccess'));
      loadBlocks(); // 重新加载数据
    } catch (error) {
      Toast.error(t('DeleteBlockFailed'));
      console.error(t('DeleteBlockFailed'), error);
    }
  };

  // 打开编辑模态框
  const openEditModal = (block: BlockDefinition) => {
    setEditingBlock(block);
    // 使用延时确保Form组件已经渲染
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.setValues({
          type: block.type,
          name: block.name,
          description: block.description,
          executor: block.executor.name,
          entry: block.executor.entry,
          inputs: formatInputs(block.inputs_def),
          outputs: formatOutputs(block.outputs_def),
        });
      }
    }, 0);
    setModalVisible(true);
  };

  // 打开添加模态框
  const openAddModal = () => {
    setEditingBlock(null);
    // 使用延时确保Form组件已经渲染
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.reset();
      }
    }, 0);
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
      title: t('BlockType'),
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: t('BlockName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('BlockDescription'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('BlockExecutor'),
      dataIndex: 'executor.name',
      key: 'executor',
    },
    {
      title: t('BlockInputsCount'),
      key: 'inputsCount',
      render: (text: string, record: BlockDefinition) => {
        return record?.inputs_def?.length || 0;
      },
    },
    {
      title: t('BlockOutputsCount'),
      key: 'outputsCount',
      render: (text: string, record: BlockDefinition) => {
        return record?.outputs_def?.length || 0;
      },
    },
    {
      title: t('BlockActions'),
      key: 'action',
      render: (text: string, record: BlockDefinition) => {
        if (!record) return null;
        return (
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
        );
      },
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
          {t('AddBlock')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={blocks}
        rowKey={(record) => record ? `${record.type}_${record.executor.name}` : ''}
        loading={loading}
      />

      <Modal
        title={editingBlock ? t('EditBlock') : t('AddBlock')}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          ref={formRef}
          layout="vertical"
          onSubmit={handleSave}
        >
          <Form.Input
            field="type"
            label={t('BlockType')}
            rules={[{ required: true, message: `${t('Please input')} ${t('BlockType')}` }]}
            placeholder={`${t('Input')} ${t('BlockType')}, ${t('e.g.')}: http_request`}
          />

          <Form.Input
            field="name"
            label={t('BlockName')}
            rules={[{ required: true, message: `${t('Please input')} ${t('BlockName')}` }]}
            placeholder={`${t('Input')} ${t('BlockName')}, ${t('e.g.')}: HTTP ${t('Request')}`}
          />

          <Form.TextArea
            field="description"
            label={t('BlockDescription')}
            placeholder={`${t('Input')} ${t('BlockDescription')}`}
            rows={2}
          />

          <Form.Select
            field="executor"
            label={t('BlockExecutor')}
            rules={[{ required: true, message: `${t('Please select')} ${t('BlockExecutor')}` }]}
            placeholder={`${t('Select')} ${t('BlockExecutor')}`}
          >
            <Select.Option value="rust">Rust</Select.Option>
            <Select.Option value="python">Python</Select.Option>
            <Select.Option value="nodejs">NodeJS</Select.Option>
            <Select.Option value="shell">Shell</Select.Option>
          </Form.Select>

          <Form.Input
            field="entry"
            label={t('BlockEntry')}
            placeholder={`${t('Input')} ${t('BlockEntry')}, ${t('e.g.')}: main.py`}
          />

          <Form.TextArea
            field="inputs"
            label={t('BlockInputs')}
            placeholder={t('BlockInputs')}
            rows={4}
            extraText={t('InputsFormat')}
          />

          <Form.TextArea
            field="outputs"
            label={t('BlockOutputs')}
            placeholder={t('BlockOutputs')}
            rows={4}
            extraText={t('OutputsFormat')}
          />

          <div style={{ marginTop: 20, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>{t('Cancel')}</Button>
              <Button type="primary" htmlType="submit">
                {t('Save')}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
