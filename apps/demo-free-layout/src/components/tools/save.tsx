import { useState, useEffect, useCallback } from 'react';
import { useClientContext, getNodeForm, FlowNodeEntity, DocumentModel } from '@flowgram.ai/free-layout-editor';
import { Button, Badge, Toast } from '@douyinfe/semi-ui';
import { useI18n } from '../../context/i18n-context';
import { WorkflowService, WorkflowDefinition} from '../../services/workflow-service'; // Import WorkflowService

interface SaveProps {
  disabled: boolean;
  currentWorkflow: WorkflowDefinition | null; // Add prop for current workflow
}

export function Save(props: SaveProps) {
  const [errorCount, setErrorCount] = useState(0);
  const clientContext = useClientContext();
  const { t } = useI18n();

  const updateValidateData = useCallback(() => {
    const allForms = clientContext.document.getAllNodes().map((node) => getNodeForm(node));
    const count = allForms.filter((form) => form?.state.invalid).length;
    setErrorCount(count);
  }, [clientContext]);

  /**
   * Validate all node and Save
   */
  const onSave = useCallback(async () => {
    if (!props.currentWorkflow) {
      Toast.error(t('No workflow selected to save.'));
      return;
    }

    const allForms = clientContext.document.getAllNodes().map((node) => getNodeForm(node));
    await Promise.all(allForms.map(async (form) => form?.validate()));

    const errorFormsCount = allForms.filter((form) => form?.state.invalid).length;
    if (errorFormsCount > 0) {
      Toast.error(t('Please fix validation errors before saving.'));
      return;
    }

    const workflowService = clientContext.container.get(WorkflowService);
    const currentDocumentData = clientContext.document.toJSON() as { nodes: FlowNodeEntity[], edges: DocumentModel.EdgeModel[] };

    const workflowUpdateData: Partial<WorkflowDefinition> = {
      flow_id: props.currentWorkflow.flow_id,
      name: props.currentWorkflow.name, // Assuming name might be updated elsewhere or is static for now
      description: props.currentWorkflow.description,
      nodes: currentDocumentData.nodes, // document.toJSON() likely already serializes nodes
      edges: currentDocumentData.edges, // document.toJSON() likely already serializes edges
    };

    try {
      await workflowService.updateWorkflow(props.currentWorkflow.flow_id, workflowUpdateData);
      Toast.success(t('Workflow saved successfully!'));
      console.log('>>>>> save data: ', workflowUpdateData);
    } catch (error) {
      console.error('Failed to save workflow:', error);
      Toast.error(t('Failed to save workflow.'));
    }
  }, [clientContext, props.currentWorkflow, t]);

  /**
   * Listen single node validate
   */
  useEffect(() => {
    const listenSingleNodeValidate = (node: FlowNodeEntity) => {
      const form = getNodeForm(node);
      if (form) {
        const formValidateDispose = form.onValidate(() => updateValidateData());
        node.onDispose(() => formValidateDispose.dispose());
      }
    };
    clientContext.document.getAllNodes().map((node) => listenSingleNodeValidate(node));
    const dispose = clientContext.document.onNodeCreate(({ node }) =>
      listenSingleNodeValidate(node)
    );
    return () => dispose.dispose();
  }, [clientContext]);

  if (errorCount === 0) {
    return (
      <Button
        disabled={props.disabled}
        onClick={onSave}
        style={{ backgroundColor: 'rgba(171,181,255,0.3)', borderRadius: '8px' }}
      >
        {t('Save')}
      </Button>
    );
  }
  return (
    <Badge count={errorCount} position="rightTop" type="danger">
      <Button
        type="danger"
        disabled={props.disabled}
        onClick={onSave}
        style={{ backgroundColor: 'rgba(255, 179, 171, 0.3)', borderRadius: '8px' }}
      >
          {t('Save')}
      </Button>
    </Badge>
  );
}
