import { FC } from 'react';

import { NodePanelRenderProps } from '@flowgram.ai/free-node-panel-plugin';
import { Popover } from '@douyinfe/semi-ui';

import { NodePlaceholder } from './node-placeholder';
import { NodeList } from './node-list';
import './index.less';
import { FlowNodeRegistry } from '../../typings';

export const NodePanel: FC<NodePanelRenderProps> = (props) => {
  const { onSelect, position, onClose, panelProps } = props;

  console.log('NodePanel received panelProps:', panelProps);

  const { enableNodePlaceholder, nodeRegistries } = panelProps as {
    enableNodePlaceholder?: boolean;
    nodeRegistries: FlowNodeRegistry[];
  };

  console.log('NodePanel extracted nodeRegistries:', nodeRegistries);

  return (
    <Popover
      trigger="click"
      visible={true}
      onVisibleChange={(v) => (v ? null : onClose())}
      content={<NodeList onSelect={onSelect} nodeRegistries={nodeRegistries} />}
      placement="right"
      popupAlign={{ offset: [30, 0] }}
      overlayStyle={{
        padding: 0,
      }}
    >
      <div
        style={
          enableNodePlaceholder
            ? {
                position: 'absolute',
                top: position.y - 61.5,
                left: position.x,
                width: 360,
                height: 100,
              }
            : {
                position: 'absolute',
                top: position.y,
                left: position.x,
                width: 0,
                height: 0,
              }
        }
      >
        {enableNodePlaceholder && <NodePlaceholder />}
      </div>
    </Popover>
  );
};
