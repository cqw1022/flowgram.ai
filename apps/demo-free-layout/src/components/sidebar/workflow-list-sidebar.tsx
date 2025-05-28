import React, { useEffect, useState } from 'react';
import { List, Spin, Typography, Button, Modal, Input, Form, Space } from '@douyinfe/semi-ui';
import { IconPlus, IconDelete } from '@douyinfe/semi-icons';
import { WorkflowService, WorkflowDefinition } from '../../services/workflow-service';
import { useClientContext } from '@flowgram.ai/free-layout-editor';

interface WorkflowListSidebarProps {
  onWorkflowSelect: (workflow: WorkflowDefinition) => void;
  onWorkflowAdded?: () => void; // Callback to clear editor nodes
}

export const WorkflowListSidebar: React.FC<WorkflowListSidebarProps> = ({ onWorkflowSelect, onWorkflowAdded }) => {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { container } = useClientContext();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addFormApi, setAddFormApi] = useState<any>();

  const fetchWorkflows = async () => {
    if (!container) return;
    try {
      setLoading(true);
      const workflowService = container.get(WorkflowService);
      const result = await workflowService.listWorkflows();
      setWorkflows(result);
      setError(null);
    } catch (err) {
      console.error('Failed to load workflows:', err);
      setError('Failed to load workflows.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkflows();
  }, [container]);

  const showAddWorkflowModal = () => {
    setIsAddModalVisible(true);
  };

  const handleAddWorkflowCancel = () => {
    setIsAddModalVisible(false);
  };

  const handleAddWorkflowConfirm = async (values: any) => {
    if (!container) return;
    try {
      const workflowService = container.get(WorkflowService);
      await workflowService.addWorkflow({ name: values.name, description: values.description });
      setIsAddModalVisible(false);
      fetchWorkflows(); // Refresh list
      if (onWorkflowAdded) {
        onWorkflowAdded(); // Clear editor nodes
      }
    } catch (err) {
      console.error('Failed to add workflow:', err);
      Modal.error({ title: 'Error', content: 'Failed to add workflow.' });
    }
  };

  const handleDeleteWorkflow = async (flowId: string) => {
    if (!container) return;
    Modal.confirm({
      title: 'Delete Workflow',
      content: 'Are you sure you want to delete this workflow?',
      onOk: async () => {
        try {
          const workflowService = container.get(WorkflowService);
          await workflowService.deleteWorkflow(flowId);
          fetchWorkflows(); // Refresh list
        } catch (err) {
          console.error(`Failed to delete workflow ${flowId}:`, err);
          Modal.error({ title: 'Error', content: 'Failed to delete workflow.' });
        }
      },
    });
  };

  if (loading) {
    return <Spin tip="Loading workflows..." />;
  }

  if (error) {
    return <Typography.Text type="danger">{error}</Typography.Text>;
  }

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Typography.Title heading={5} style={{ margin: 0 }}>Workflows</Typography.Title>
        <Button icon={<IconPlus />} type="primary" onClick={showAddWorkflowModal}>Create</Button>
      </div>
      {workflows.length === 0 && !loading ? (
        <Typography.Text>No workflows found.</Typography.Text>
      ) : (
        <List
          style={{ flexGrow: 1, overflowY: 'auto' }}
          dataSource={workflows}
          renderItem={(item) => (
            <List.Item
              header={item.name}
              extra={
                <Space>
                  <Button type="tertiary" onClick={() => onWorkflowSelect(item)}>Open</Button>
                  <Button icon={<IconDelete />} type="danger" onClick={() => handleDeleteWorkflow(item.name)} />
                </Space>
              }
            >
              {item.description || 'No description'}
            </List.Item>
          )}
        />
      )}
      <Modal
        title="Create New Workflow"
        visible={isAddModalVisible}
        onOk={() => addFormApi?.submitForm()}
        onCancel={handleAddWorkflowCancel}
        centered
      >
        <Form getFormApi={setAddFormApi} onSubmit={handleAddWorkflowConfirm} labelPosition="left">
          <Form.Input field="name" label="Name" rules={[{ required: true, message: 'Name is required' }]} />
          <Form.Input field="description" label="Description" />
        </Form>
      </Modal>
    </div>
  );
};
