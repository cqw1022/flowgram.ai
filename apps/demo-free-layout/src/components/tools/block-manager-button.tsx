import React, { useState } from 'react';
import { Tooltip, IconButton, Modal } from '@douyinfe/semi-ui';
import { IconApps } from '@douyinfe/semi-icons';
import { BlockManager } from '../block-manager';

export const BlockManagerButton: React.FC<{
  disabled?: boolean;
}> = ({ disabled }) => {
  const [visible, setVisible] = useState(false);

  const openBlockManager = () => {
    setVisible(true);
  };

  const closeBlockManager = () => {
    setVisible(false);
  };

  return (
    <>
      <Tooltip content="任务块管理">
        <IconButton
          type="tertiary"
          theme="borderless"
          icon={<IconApps />}
          disabled={disabled}
          onClick={openBlockManager}
        />
      </Tooltip>

      <Modal
        title="任务块管理"
        visible={visible}
        onCancel={closeBlockManager}
        footer={null}
        width={1000}
        style={{ top: 20 }}
        bodyStyle={{ padding: '16px', maxHeight: 'calc(100vh - 150px)', overflow: 'auto' }}
      >
        <BlockManager />
      </Modal>
    </>
  );
};
