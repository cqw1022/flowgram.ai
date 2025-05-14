import { useState } from 'react';

import { usePlayground, usePlaygroundTools } from '@flowgram.ai/free-layout-editor';
import { Divider, Dropdown } from '@douyinfe/semi-ui';
import { useI18n } from '../../context/i18n-context';

import { SelectZoom } from './styles';

export const ZoomSelect = () => {
  const tools = usePlaygroundTools();
  const playground = usePlayground();
  const { t } = useI18n();
  const [dropDownVisible, openDropDown] = useState(false);

  return (
    <Dropdown
      position="top"
      trigger="custom"
      visible={dropDownVisible}
      onClickOutSide={() => openDropDown(false)}
      render={
        <Dropdown.Menu>
          <Dropdown.Item onClick={() => tools.zoomin()}>{t('ZoomIn')}</Dropdown.Item>
          <Dropdown.Item onClick={() => tools.zoomout()}>{t('ZoomOut')}</Dropdown.Item>
          <Divider layout="horizontal" />
          <Dropdown.Item onClick={() => playground.config.updateZoom(0.5)}>
            {t('ZoomTo')} 50%
          </Dropdown.Item>
          <Dropdown.Item onClick={() => playground.config.updateZoom(1)}>
            {t('ZoomTo')} 100%
          </Dropdown.Item>
          <Dropdown.Item onClick={() => playground.config.updateZoom(1.5)}>
            {t('ZoomTo')} 150%
          </Dropdown.Item>
          <Dropdown.Item onClick={() => playground.config.updateZoom(2.0)}>
            {t('ZoomTo')} 200%
          </Dropdown.Item>
        </Dropdown.Menu>
      }
    >
      <SelectZoom onClick={() => openDropDown(true)}>{Math.floor(tools.zoom * 100)}%</SelectZoom>
    </Dropdown>
  );
};
