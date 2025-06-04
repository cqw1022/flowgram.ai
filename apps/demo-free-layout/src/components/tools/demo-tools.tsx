import React, { useState, useEffect } from 'react';

import { useRefresh } from '@flowgram.ai/free-layout-editor';
import { useClientContext } from '@flowgram.ai/free-layout-editor';
import { Tooltip, IconButton, Divider, Button } from '@douyinfe/semi-ui';
import { IconUndo, IconRedo, IconPlay } from '@douyinfe/semi-icons';

import { AddNode } from '../add-node';
import { ZoomSelect } from './zoom-select';
import { SwitchLine } from './switch-line';
import { ToolContainer, ToolSection } from './styles';
import { Save } from './save';
import { Readonly } from './readonly';
import { MinimapSwitch } from './minimap-switch';
import { Minimap } from './minimap';
import { Interactive } from './interactive';
import { FitView } from './fit-view';
import { Comment } from './comment';
import { AutoLayout } from './auto-layout';
import { BlockManagerButton } from './block-manager-button';
import { useI18n } from '../../context/i18n-context';
import { useNodeRegistries } from '../../context/node-registries-context';
import { WorkflowDefinition, RunWorkflowPayload, WorkflowService } from '../../services/workflow-service'; // Assuming WorkflowDefinition is defined here or adjust path

interface DemoToolsProps {
  currentWorkflow: WorkflowDefinition | null;
}

export const DemoTools: React.FC<DemoToolsProps> = ({ currentWorkflow }) => {
  const { history, playground,container } = useClientContext();
  const nodeRegistries = useNodeRegistries();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [minimapVisible, setMinimapVisible] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    const disposable = history.undoRedoService.onChange(() => {
      setCanUndo(history.canUndo());
      setCanRedo(history.canRedo());
    });
    return () => disposable.dispose();
  }, [history]);
  const refresh = useRefresh();

  useEffect(() => {
    const disposable = playground.config.onReadonlyOrDisabledChange(() => refresh());
    return () => disposable.dispose();
  }, [playground]);

  const handleRunWorkflow = async () => {
    console.log('Running workflow...', currentWorkflow,);
    if (currentWorkflow) {
      const workflowService = container.get(WorkflowService);
      // const workflowJson = editor.document.toJSON(); // 这是整个文档的JSON，可能不是运行工作流所需的payload
      // console.log('Current workflow document JSON:', workflowJson);

      // 构造 RunWorkflowPayload
      // 这里的 payload 结构需要根据您的API定义来确定
      // 假设 payload 只需要 block_path，您可以从 currentWorkflow 或其他地方获取
      // 例如，如果 block_path 是固定的或者可以从 currentWorkflow.name 推断
      const payload: RunWorkflowPayload = {
        block_path: currentWorkflow.name, // 假设使用工作流名称作为 block_path，请根据实际情况修改
        // input_values: {}, // 根据需要填充输入值
        // ... 其他 RunWorkflowPayload 所需的字段
      };

      try {
        console.log(`Running workflow ${currentWorkflow.flow_id} with payload:`, payload);
        const response = await workflowService.runWorkflow(currentWorkflow.flow_id, payload);
        console.log('Workflow run response:', response);
        alert(`工作流 ${currentWorkflow.name} 开始运行！`);
      } catch (error) {
        console.error('Failed to run workflow:', error);
        alert(`运行工作流 ${currentWorkflow.name} 失败: ${error.message}`);
      }
    } else {
      alert('请先选择一个工作流或编辑器未准备好。');
    }
  };

  return (
    <ToolContainer className="demo-free-layout-tools">
      <ToolSection>
        <Interactive />
        <AutoLayout />
        <SwitchLine />
        <ZoomSelect />
        <FitView />
        <MinimapSwitch minimapVisible={minimapVisible} setMinimapVisible={setMinimapVisible} />
        <Minimap visible={minimapVisible} />
        <Readonly />
        <Comment />
        <Tooltip content={t('Undo')}>
          <IconButton
            type="tertiary"
            theme="borderless"
            icon={<IconUndo />}
            disabled={!canUndo || playground.config.readonly}
            onClick={() => history.undo()}
          />
        </Tooltip>
        <Tooltip content={t('Redo')}>
          <IconButton
            type="tertiary"
            theme="borderless"
            icon={<IconRedo />}
            disabled={!canRedo || playground.config.readonly}
            onClick={() => history.redo()}
          />
        </Tooltip>
        <Divider layout="vertical" style={{ height: '16px' }} margin={3} />
        {nodeRegistries && (
          <AddNode disabled={playground.config.readonly} nodeRegistries={nodeRegistries} />
        )}
        <BlockManagerButton disabled={playground.config.readonly} />
        <Divider layout="vertical" style={{ height: '16px' }} margin={3} />
        <Save disabled={playground.config.readonly} currentWorkflow={currentWorkflow} />
        <Tooltip content={t('Run Workflow')}>
          <IconButton
            type="tertiary"
            theme="borderless"
            icon={<IconPlay />}
            disabled={playground.config.readonly}
            onClick={handleRunWorkflow}
          />
        </Tooltip>
      </ToolSection>
    </ToolContainer>
  );
};
