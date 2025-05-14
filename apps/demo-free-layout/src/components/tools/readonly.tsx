import { useCallback } from 'react';

import { usePlayground } from '@flowgram.ai/free-layout-editor';
import { IconButton, Tooltip } from '@douyinfe/semi-ui';
import { IconUnlock, IconLock } from '@douyinfe/semi-icons';
import { useI18n } from '../../context/i18n-context';

export const Readonly = () => {
  const playground = usePlayground();
  const { t } = useI18n();

  const toggleReadonly = useCallback(() => {
    playground.config.readonly = !playground.config.readonly;
  }, [playground]);

  return playground.config.readonly ? (
    <Tooltip content={t('Editable')}>
      <IconButton
        theme="borderless"
        type="tertiary"
        icon={<IconLock size="default" />}
        onClick={toggleReadonly}
      />
    </Tooltip>
  ) : (
    <Tooltip content={t('Readonly')}>
      <IconButton
        theme="borderless"
        type="tertiary"
        icon={<IconUnlock size="default" />}
        onClick={toggleReadonly}
      />
    </Tooltip>
  );
};
