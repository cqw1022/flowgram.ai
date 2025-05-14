import React, { useState } from 'react';
import { Tooltip, IconButton, Modal } from '@douyinfe/semi-ui';
import { IconApps } from '@douyinfe/semi-icons';
import { BlockManager } from '../block-manager';
import { useI18n } from '../../context/i18n-context';

export const BlockManagerButton: React.FC<{
  disabled?: boolean;
}> = ({ disabled }) => {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  const openBlockManager = () => {
    setVisible(true);
  };

  const closeBlockManager = () => {
    setVisible(false);
  };

  return (
    <>
      <Tooltip content={t('BlockManager')}>
        <IconButton
          type="tertiary"
          theme="borderless"
          icon={<IconApps />}
          disabled={disabled}
          onClick={openBlockManager}
        />
      </Tooltip>

      <Modal
        title={t('BlockManager')}
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
