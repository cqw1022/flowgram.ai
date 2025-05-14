import React, { useCallback } from 'react';
import { FlowNodeEntity, useNodeRender } from '@flowgram.ai/free-layout-editor';
import { ConfigProvider } from '@douyinfe/semi-ui';
import { BlockDefinition } from '../../typings/block';
import { NodeRenderContext } from '../../context';
import { NodeWrapper } from '../base-node/node-wrapper';
import { useI18n } from '../../context/i18n-context';

interface BlockNodeProps {
  node: FlowNodeEntity;
}

export const BlockNodeRender: React.FC<BlockNodeProps> = (props) => {
  const { node } = props;
  // 使用 nodeRender 钩子获取节点渲染相关方法
  const nodeRender = useNodeRender();
  // 获取表单
  const form = nodeRender.form;
  const { t } = useI18n();

  // 用于让 Tooltip 跟随节点缩放
  const getPopupContainer = useCallback(() => node.renderData.node || document.body, []);

  // 使用 any 类型转换访问自定义属性
  const nodeAny = node as any;

  // 尝试从自定义属性中获取块定义
  const blockDefinition = nodeAny.custom?.blockDefinition as BlockDefinition | undefined;

  // 获取节点类型信息
  const nodeType = nodeAny.type || '';
  const nodeTitle = nodeAny.data?.title;

  // 检查是否为内置节点类型（start、end、condition、llm、loop、comment）
  const isBuiltInNode = ['start', 'end', 'condition', 'llm', 'loop', 'comment'].includes(nodeType);

  // 准备节点内容渲染
  const renderNodeContent = () => {
    // 如果是内置节点或没有块定义，使用默认渲染
    if (isBuiltInNode || !blockDefinition) {
      return renderDefaultNode();
    }

    // 渲染自定义块节点
    return renderBlockNode(blockDefinition);
  };

  // 渲染默认节点
  const renderDefaultNode = () => {
    // 获取节点标题
    let title = nodeTitle;

    // 如果没有标题，尝试从节点类型生成一个标题
    if (!title) {
      // 使用翻译获取默认标题
      title = t(nodeType);
    }

    return (
      <div className={`default-node node-type-${nodeType}`}>
        <div className="node-header">{title}</div>
        <div className="node-type">{nodeType}</div>
        {/* 渲染节点表单 */}
        {form && form.render()}
      </div>
    );
  };

  // 渲染块节点
  const renderBlockNode = (block: BlockDefinition) => {
    // 根据执行器类型选择不同样式
    const executorClass = `executor-${block.executor.name}`;
    const blockTypeClass = `block-type-${block.type}`;

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
          {/* 显示输入端口 */}
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

          {/* 渲染节点表单 */}
          {form && form.render()}

          {/* 显示输出端口 */}
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

        {/* 显示额外信息 */}
        <div className="block-footer">
          <span className="block-type">{block.type}</span>
          <span className="block-executor">{block.executor.name}</span>
        </div>
      </div>
    );
  };

  // 渲染完整的节点（包括ConfigProvider和NodeRenderContext）
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

// 渲染执行器图标
function renderExecutorIcon(executor: string) {
  const iconMap: Record<string, React.ReactNode> = {
    'rust': <span className="icon-rust">🦀</span>,
    'python': <span className="icon-python">🐍</span>,
    'nodejs': <span className="icon-nodejs">📦</span>,
    'shell': <span className="icon-shell">💻</span>,
  };

  return iconMap[executor] || <span className="icon-default">📄</span>;
}
