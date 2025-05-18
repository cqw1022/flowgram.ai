import React, { useEffect, useState, useRef } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Typography, Toast, TextArea } from '@douyinfe/semi-ui';
import { IconPlus, IconEdit, IconDelete, IconPlusCircle } from '@douyinfe/semi-icons';
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

  // 多个输入/输出管理
  const [inputs, setInputs] = useState<{id: string, handle: string, type: string, optional: boolean, description: string}[]>([]);
  const [outputs, setOutputs] = useState<{id: string, handle: string, type: string, description: string}[]>([]);

  // 脚本内容
  const [scriptContent, setScriptContent] = useState('');

  // 使用formRef代替Form.useForm
  const formRef = useRef<Form>(null);

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
      // 验证输入和输出
      if (inputs.some(input => !input.handle)) {
        Toast.error(t('InputHandleRequired'));
        return;
      }

      if (outputs.some(output => !output.handle)) {
        Toast.error(t('OutputHandleRequired'));
        return;
      }

      // 构建输入和输出定义
      const inputDefs: BlockInputDef[] = inputs.map(input => ({
        handle: input.handle,
        type: input.type,
        optional: input.optional,
        description: input.description
      }));

      const outputDefs: BlockOutputDef[] = outputs.map(output => ({
        handle: output.handle,
        type: output.type,
        description: output.description
      }));

      // 构建块定义对象
      const blockData: BlockDefinition = {
        type: values.type || 'task_block',
        name: values.name,
        description: values.description,
        executor: {
          name: values.executor,
          entry: '', // 不需要Entry，由服务器指定
          script: scriptContent || undefined
        },
        inputs_def: inputDefs,
        outputs_def: outputDefs,
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

  // 添加新输入
  const addInput = () => {
    setInputs([...inputs, {
      id: `input_${Date.now()}`,
      handle: '',
      type: 'string',
      optional: false,
      description: ''
    }]);
  };

  // 删除输入
  const removeInput = (id: string) => {
    setInputs(inputs.filter(input => input.id !== id));
  };

  // 更新输入值
  const updateInput = (id: string, field: string, value: any) => {
    setInputs(inputs.map(input =>
      input.id === id ? { ...input, [field]: value } : input
    ));
  };

  // 添加新输出
  const addOutput = () => {
    setOutputs([...outputs, {
      id: `output_${Date.now()}`,
      handle: '',
      type: 'string',
      description: ''
    }]);
  };

  // 删除输出
  const removeOutput = (id: string) => {
    setOutputs(outputs.filter(output => output.id !== id));
  };

  // 更新输出值
  const updateOutput = (id: string, field: string, value: any) => {
    setOutputs(outputs.map(output =>
      output.id === id ? { ...output, [field]: value } : output
    ));
  };

  // 打开编辑模态框
  const openEditModal = (block: BlockDefinition) => {
    setEditingBlock(block);

    // 设置输入和输出
    if (block.inputs_def) {
      setInputs(block.inputs_def.map((input, index) => ({
        id: `input_${index}_${Date.now()}`,
        handle: input.handle,
        type: input.type || 'string',
        optional: input.optional,
        description: input.description || ''
      })));
    } else {
      setInputs([]);
    }

    if (block.outputs_def) {
      setOutputs(block.outputs_def.map((output, index) => ({
        id: `output_${index}_${Date.now()}`,
        handle: output.handle,
        type: output.type || 'string',
        description: output.description || ''
      })));
    } else {
      setOutputs([]);
    }

    // 设置脚本内容
    setScriptContent(block.executor.script || '');

    // 使用setTimeout确保DOM已渲染
    setTimeout(() => {
      if (formRef.current) {
        // 获取表单API
        const formApi = formRef.current.formApi;
        if (formApi) {
          // 设置初始值
          formApi.setValue('type', block.type);
          formApi.setValue('name', block.name);
          formApi.setValue('description', block.description || '');
          formApi.setValue('executor', block.executor.name);
        }
      }
    }, 0);

    setModalVisible(true);
  };

  // 打开添加模态框
  const openAddModal = () => {
    setEditingBlock(null);
    // 清空输入和输出
    setInputs([{
      id: `input_${Date.now()}`,
      handle: 'input',
      type: 'string',
      optional: false,
      description: ''
    }]);
    setOutputs([{
      id: `output_${Date.now()}`,
      handle: 'output',
      type: 'string',
      description: ''
    }]);
    // 清空脚本内容
    setScriptContent('');

    // 重置表单并设置默认值
    setTimeout(() => {
      if (formRef.current) {
        // 获取表单API
        const formApi = formRef.current.formApi;
        if (formApi) {
          // 使用formApi设置默认值
          formApi.setValue('type', 'task_block');
          formApi.setValue('executor', 'python');
        }
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
        width={800}
        bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}
      >
        <Form
          ref={formRef}
          layout="vertical"
          onSubmit={handleSave}
        >
          <Form.Select
            field="type"
            label={t('BlockType')}
            rules={[{ required: true, message: `${t('Please select')} ${t('BlockType')}` }]}
            placeholder={`${t('Select')} ${t('BlockType')}`}
          >
            <Select.Option value="task_block">task_block</Select.Option>
          </Form.Select>

          <Form.Input
            field="name"
            label={t('BlockName')}
            rules={[{ required: true, message: `${t('Please input')} ${t('BlockName')}` }]}
            placeholder={`${t('Input')} ${t('BlockName')}, ${t('e.g.')}: Python #1`}
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

          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography.Title heading={6}>{t('BlockInputs')}</Typography.Title>
              <Button
                type="primary"
                icon={<IconPlusCircle />}
                onClick={addInput}
                size="small"
              >
                {t('Add')}
              </Button>
            </div>

            {inputs.map((input, index) => (
              <div key={input.id} style={{
                border: '1px solid #e0e0e0',
                padding: '16px',
                borderRadius: '4px',
                marginBottom: '16px',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', right: '10px', top: '10px' }}>
                  {inputs.length > 1 && (
                    <Button
                      type="danger"
                      icon={<IconDelete />}
                      onClick={() => removeInput(input.id)}
                      size="small"
                    />
                  )}
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ marginBottom: '4px' }}>{t('handle')}</div>
                  <Input
                    placeholder="input"
                    value={input.handle}
                    onChange={(value) => updateInput(input.id, 'handle', value)}
                  />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ marginBottom: '4px' }}>{t('typeField')}</div>
                  <Select
                    value={input.type}
                    onChange={(value) => updateInput(input.id, 'type', value as string)}
                    style={{ width: '100%' }}
                  >
                    <Select.Option value="string">字符串</Select.Option>
                    <Select.Option value="number">数字</Select.Option>
                    <Select.Option value="boolean">布尔值</Select.Option>
                    <Select.Option value="object">对象</Select.Option>
                    <Select.Option value="array">数组</Select.Option>
                  </Select>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ marginBottom: '4px' }}>{t('Optional')}</div>
                  <Select
                    value={input.optional ? "true" : "false"}
                    onChange={(value) => updateInput(input.id, 'optional', value === "true")}
                    style={{ width: '100%' }}
                  >
                    <Select.Option value="true">是</Select.Option>
                    <Select.Option value="false">否</Select.Option>
                  </Select>
                </div>

                <div>
                  <div style={{ marginBottom: '4px' }}>{t('descriptionField')}</div>
                  <Input
                    placeholder="输入描述"
                    value={input.description}
                    onChange={(value) => updateInput(input.id, 'description', value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography.Title heading={6}>{t('BlockOutputs')}</Typography.Title>
              <Button
                type="primary"
                icon={<IconPlusCircle />}
                onClick={addOutput}
                size="small"
              >
                {t('Add')}
              </Button>
            </div>

            {outputs.map((output, index) => (
              <div key={output.id} style={{
                border: '1px solid #e0e0e0',
                padding: '16px',
                borderRadius: '4px',
                marginBottom: '16px',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', right: '10px', top: '10px' }}>
                  {outputs.length > 1 && (
                    <Button
                      type="danger"
                      icon={<IconDelete />}
                      onClick={() => removeOutput(output.id)}
                      size="small"
                    />
                  )}
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ marginBottom: '4px' }}>{t('handle')}</div>
                  <Input
                    placeholder="output"
                    value={output.handle}
                    onChange={(value) => updateOutput(output.id, 'handle', value)}
                  />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ marginBottom: '4px' }}>{t('typeField')}</div>
                  <Select
                    value={output.type}
                    onChange={(value) => updateOutput(output.id, 'type', value as string)}
                    style={{ width: '100%' }}
                  >
                    <Select.Option value="string">字符串</Select.Option>
                    <Select.Option value="number">数字</Select.Option>
                    <Select.Option value="boolean">布尔值</Select.Option>
                    <Select.Option value="object">对象</Select.Option>
                    <Select.Option value="array">数组</Select.Option>
                  </Select>
                </div>

                <div>
                  <div style={{ marginBottom: '4px' }}>{t('descriptionField')}</div>
                  <Input
                    placeholder="输出描述"
                    value={output.description}
                    onChange={(value) => updateOutput(output.id, 'description', value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <Typography.Title heading={6}>{t('ScriptContent')}</Typography.Title>
            <TextArea
              value={scriptContent}
              onChange={setScriptContent}
              placeholder={`# ${t('EnterPythonScript')}`}
              rows={10}
              style={{
                fontFamily: 'monospace',
                backgroundColor: '#282c34',
                color: '#abb2bf',
                padding: '10px'
              }}
            />
          </div>

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
