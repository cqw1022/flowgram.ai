import { usePlaygroundTools } from '@flowgram.ai/free-layout-editor';
import { IconButton, Tooltip } from '@douyinfe/semi-ui';
import { IconExpand } from '@douyinfe/semi-icons';
import { useI18n } from '../../context/i18n-context';

export const FitView = () => {
  const tools = usePlaygroundTools();
  const { t } = useI18n();

  return (
    <Tooltip content={t('FitView')}>
      <IconButton
        icon={<IconExpand />}
        type="tertiary"
        theme="borderless"
        onClick={() => tools.fitView()}
      />
    </Tooltip>
  );
};
