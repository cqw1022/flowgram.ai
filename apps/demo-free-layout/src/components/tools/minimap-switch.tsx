import { Tooltip, IconButton } from '@douyinfe/semi-ui';
import { useI18n } from '../../context/i18n-context';

import { UIIconMinimap } from './styles';

export const MinimapSwitch = (props: {
  minimapVisible: boolean;
  setMinimapVisible: (visible: boolean) => void;
}) => {
  const { minimapVisible, setMinimapVisible } = props;
  const { t } = useI18n();

  return (
    <Tooltip content={t('Minimap')}>
      <IconButton
        type="tertiary"
        theme="borderless"
        icon={<UIIconMinimap visible={minimapVisible} />}
        onClick={() => setMinimapVisible(!minimapVisible)}
      />
    </Tooltip>
  );
};
