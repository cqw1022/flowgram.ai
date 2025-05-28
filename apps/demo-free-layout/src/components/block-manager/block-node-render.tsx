import React, { useCallback, useState, useEffect } from 'react';
import { FlowNodeEntity, useNodeRender } from '@flowgram.ai/free-layout-editor';
import { ConfigProvider } from '@douyinfe/semi-ui';
import { BlockDefinition } from '../../typings/block';
import { NodeRenderContext } from '../../context';
import { NodeWrapper } from '../base-node/node-wrapper';
import { useI18n } from '../../context/i18n-context';
import { Button } from '@douyinfe/semi-ui';
import MonacoEditor from '@monaco-editor/react';
import { BlockService } from '../../services/block-service';
import { useClientContext } from '@flowgram.ai/free-layout-editor';
import { Toast } from '@douyinfe/semi-ui';

import './block-node-render.css';

interface BlockNodeProps {
  node: FlowNodeEntity;
}

export const BlockNodeRender: React.FC<BlockNodeProps> = (props) => {
  const { node } = props;
  const nodeRender = useNodeRender();
  const form = nodeRender.form;
  const { t } = useI18n();
  console.log('form?.initialValues.blockDefinition?.executor?.script', form);
  const [editorContent, setEditorContent] = useState(form?.initialValues.blockDefinition?.executor?.script || '');
  const { container } = useClientContext();
  const blockService = container.get(BlockService);

  useEffect(() => {
    setEditorContent(form?.initialValues.blockDefinition?.executor?.script || '');
  }, [form?.initialValues.blockDefinition?.executor?.script]);

  const getPopupContainer = useCallback(() => node.renderData.node || document.body, []);

  const nodeAny = node as any;
  const blockDefinition = form?.initialValues.blockDefinition as BlockDefinition | undefined;
  const nodeType = nodeAny.type || '';
  const nodeTitle = nodeAny.data?.title;

  const hasScript = useCallback(() => {
    return blockDefinition?.executor?.name !== 'rust' && blockDefinition?.executor?.script !== undefined;
  }, [blockDefinition]);

  const saveCode = useCallback(async (newCode: string) => {
    if (blockDefinition?.block_id) {
      try {
        await blockService.updateTaskBlock(blockDefinition.block_id, {
          ...blockDefinition,
          executor: {
            ...blockDefinition.executor,
            script: newCode
          }
        });
        Toast.success('脚本更新成功');
      } catch (error) {
        Toast.error('脚本更新失败');
        console.error('更新脚本失败:', error);
      }
    }
  }, [blockDefinition, blockService]);

  const getMonacoLanguage = useCallback((executorName: string) => {
    const languageMap: Record<string, string> = {
      'python': 'python',
      'nodejs': 'javascript',
      'shell': 'shell',
    };
    return languageMap[executorName] || 'plaintext';
  }, []);

  const renderNodeContent = () => {
    if (!blockDefinition) {
      return renderDefaultNode();
    }
    return renderBlockNode(blockDefinition);
  };

  const renderDefaultNode = () => {
    let title = nodeTitle;
    if (!title) {
      title = t(nodeType);
    }

    return (
      <div className={`default-node node-type-${nodeType}`}>
        <div className="node-header">{title}</div>
        <div className="node-type">{nodeType}</div>
        {form && form.render()}
      </div>
    );
  };

  const renderBlockNode = (block: BlockDefinition) => {
    const executorClass = `executor-${block.executor.name}`;
    const blockTypeClass = `block-type-${block.type}`;
    const monacoLanguage = getMonacoLanguage(block.executor.name);

    return (
      <div className={`block-node ${executorClass} ${blockTypeClass}`}>
        <div className="block-header">
          <span className="block-executor-icon">
            {renderExecutorIcon(block.executor.name)}
          </span>
          <span className="block-title">
            {nodeTitle || block.name || block.type || t('Unnamed Block')}
          </span>
        </div>

        <div className="block-body">
          <div className="block-inputs">
            {block.inputs_def.map(input => (
              <div key={input.handle} className="block-port block-input">
                <div className="port-handle" id={`port-${node.id}-${input.handle}`}>
                  {input.optional ? '○' : '●'}
                </div>
                <div className="port-label">
                  {input.handle} {input.type ? `(${input.type})` : ''}
                </div>
              </div>
            ))}
          </div>

          {form && form.render()}

          <div className="block-outputs">
            {block.outputs_def.map(output => (
              <div key={output.handle} className="block-port block-output">
                <div className="port-label">
                  {output.handle} {output.type ? `(${output.type})` : ''}
                </div>
                <div className="port-handle" id={`port-${node.id}-${output.handle}`}>
                  ●
                </div>
              </div>
            ))}
          </div>
        </div>

        {hasScript() && (
          <div className="block-script">
            <div className="script-header">
              <span>脚本</span>
              <Button onClick={() => saveCode(editorContent)}>保存</Button>
            </div>
            <MonacoEditor
              value={editorContent}
              onChange={(value: string | undefined) => setEditorContent(value || '')}
              language={monacoLanguage}
              height="100%"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 12,
                lineNumbers: 'on',
                wordWrap: 'on',
                automaticLayout: true,
                theme: 'vs-dark',
              }}
            />
          </div>
        )}

        <div className="block-footer">
          <span className="block-type">{block.type}</span>
          <span className="block-executor">{block.executor.name}</span>
        </div>
      </div>
    );
  };

  return (
    <ConfigProvider getPopupContainer={getPopupContainer}>
      <NodeRenderContext.Provider value={nodeRender}>
        <NodeWrapper>
          {form?.state.invalid && <div className="node-error-icon">⚠️</div>}
          {renderNodeContent()}
        </NodeWrapper>
      </NodeRenderContext.Provider>
    </ConfigProvider>
  );
};

function renderExecutorIcon(executor: string) {
  const iconMap: Record<string, React.ReactNode> = {
    'rust': <span className="icon-rust">🦀</span>,
    'python': <span className="icon-python">🐍</span>,
    'nodejs': <span className="icon-nodejs">📦</span>,
    'shell': <span className="icon-shell">💻</span>,
  };

  return iconMap[executor] || <span className="icon-default">📄</span>;
}
