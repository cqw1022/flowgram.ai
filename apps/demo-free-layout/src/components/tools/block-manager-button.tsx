import React, { useState, useCallback, memo } from 'react';
import { Tooltip, IconButton, Modal } from '@douyinfe/semi-ui';
import { IconApps } from '@douyinfe/semi-icons';
import { BlockManager } from '../block-manager';
import { useI18n } from '../../context/i18n-context';

export const BlockManagerButton: React.FC<{
  disabled?: boolean;
}> = memo(({ disabled }) => {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  const openBlockManager = useCallback(() => {
    setVisible(true);
  }, []);

  const closeBlockManager = useCallback(() => {
    setVisible(false);
  }, []);

  const tooltipContent = t('BlockManager');
  const modalTitle = t('BlockManager');

  return (
    <>
      <Tooltip content={tooltipContent} trigger="hover">
        <IconButton
          type="tertiary"
          theme="borderless"
          icon={<IconApps />}
          disabled={disabled}
          onClick={openBlockManager}
        />
      </Tooltip>

      <Modal
        title={modalTitle}
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
});
