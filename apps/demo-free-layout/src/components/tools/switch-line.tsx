import { useCallback } from 'react';

import { useService, WorkflowLinesManager } from '@flowgram.ai/free-layout-editor';
import { IconButton, Tooltip } from '@douyinfe/semi-ui';
import { useI18n } from '../../context/i18n-context';

import { IconSwitchLine } from '../../assets/icon-switch-line';

export const SwitchLine = () => {
  const linesManager = useService(WorkflowLinesManager);
  const { t } = useI18n();

  const switchLine = useCallback(() => {
    linesManager.switchLineType();
  }, [linesManager]);

  return (
    <Tooltip content={t('SwitchLine')}>
      <IconButton type="tertiary" theme="borderless" onClick={switchLine} icon={IconSwitchLine} />
    </Tooltip>
  );
};
