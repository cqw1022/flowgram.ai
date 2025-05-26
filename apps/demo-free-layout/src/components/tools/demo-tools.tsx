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

export const DemoTools = () => {
  const { history, playground, editor } = useClientContext();
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
    if (editor) {
      const workflowData = editor.document.toJSON();
      console.log('Running workflow with data:', workflowData);
      // 此处调用 API 运行工作流
      // 例如: await apiService.runWorkflow(workflowData);
      alert('运行工作流（请在控制台查看数据，并实现API调用）');
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
        <Save disabled={playground.config.readonly} />
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
