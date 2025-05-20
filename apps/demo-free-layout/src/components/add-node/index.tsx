import React from 'react';
import { Button } from '@douyinfe/semi-ui';
import { IconPlus } from '@douyinfe/semi-icons';
import { useI18n } from '../../context/i18n-context';

import { useAddNode } from './use-add-node';
import { FlowNodeRegistry } from '../../typings';

export const AddNode = (props: React.ComponentProps<typeof Button> & { nodeRegistries: FlowNodeRegistry[] }) => {
  const addNode = useAddNode(props.nodeRegistries);
  const { t } = useI18n();

  return (
    <Button
      icon={<IconPlus />}
      color="highlight"
      style={{ backgroundColor: 'rgba(171,181,255,0.3)', borderRadius: '8px' }}
      disabled={props.disabled}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        addNode(rect);
      }}
    >
      {t('AddNode')}
    </Button>
  );
};
