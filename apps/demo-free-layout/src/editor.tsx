import { EditorRenderer, FreeLayoutEditorProvider } from '@flowgram.ai/free-layout-editor';

import '@flowgram.ai/free-layout-editor/index.css';
import './styles/index.css';
import { staticNodeRegistries } from './nodes';
import { initialData } from './initial-data';
import { useEditorProps } from './hooks';
import { DemoTools } from './components/tools';
import { SidebarProvider, SidebarRenderer } from './components/sidebar';
import { LanguageSelector } from './components/language-selector';
import { useI18n } from './context/i18n-context';
import { NodeRegistriesProvider } from './context/node-registries-context';
import { WorkflowListSidebar } from './components/sidebar/workflow-list-sidebar'; // Import the new component
import { Button } from '@douyinfe/semi-ui'; // Import Button for the toggle
import { IconList } from '@douyinfe/semi-icons'; // Import an icon for the button
import { useState } from 'react'; // Import useState for managing visibility
import { WorkflowDefinition } from './services'; // Import WorkflowDefinition

export const Editor = () => {
  const editorProps = useEditorProps(initialData, staticNodeRegistries);
  const { t } = useI18n();
  const [isWorkflowSidebarVisible, setIsWorkflowSidebarVisible] = useState(false);

  const handleWorkflowSelect = (workflow: WorkflowDefinition) => {
    console.log('handleWorkflowSelect called with workflow:', workflow); // Log the workflow object
    console.log('Current editorProps:', editorProps);
    if (editorProps && editorProps.editor) {
      editorProps.editor.clear(); // Clear current workflow
      // Assuming workflow object has nodes and edges properties
      // If the structure is different, this needs to be adjusted
      if (workflow.nodes && workflow.edges) {
        editorProps.editor.load({ nodes: workflow.nodes, edges: workflow.edges });
      } else {
        // Attempt to load the entire workflow object if nodes/edges are not direct properties
        // This might be necessary if the 'workflow' object itself is the data structure expected by 'load'
        // Or, if the API for 'listWorkflows' returns a structure that needs transformation
        // For now, we'll assume 'load' can handle the raw workflow object or it needs specific parsing
        // based on how 'WorkflowDefinition' is structured and what 'editor.load()' expects.
        // As a fallback, if the direct properties aren't there, try loading the whole object.
        // This part might need refinement based on the exact structure of WorkflowDefinition and editor.load() requirements.
        console.warn('Workflow object does not have direct nodes/edges properties, attempting to load entire object. This might not work as expected.', workflow);
        // editorProps.editor.load(workflow); // This line is commented out as it's speculative
        // If loading the entire object is not correct, you might need to fetch the full workflow data using workflow.flow_id
        // For example: const fullWorkflowData = await workflowService.getWorkflow(workflow.flow_id);
        // And then: editorProps.editor.load(fullWorkflowData);
      }
    }
    console.log('Selected workflow:', workflow);
    setIsWorkflowSidebarVisible(false); // Optionally hide sidebar after selection
  };

  const handleWorkflowAdded = () => {
    if (editorProps.editor) {
      editorProps.editor.clear(); // Clear all nodes and edges
    }
  };

  return (
    <div className="doc-free-feature-overview">
      <NodeRegistriesProvider value={editorProps.nodeRegistries}>
        {/* @ts-ignore */}
        <FreeLayoutEditorProvider {...editorProps} panelProps={{ nodeRegistries: editorProps.nodeRegistries }}>
          <SidebarProvider>
            <div className="demo-container">
              <div className="demo-header">
                <h1>{t('FreeLayout')}</h1>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    icon={<IconList />}
                    onClick={() => setIsWorkflowSidebarVisible(!isWorkflowSidebarVisible)}
                    style={{ marginRight: '10px' }}
                  >
                    {t('Workflows')}
                  </Button>
                  <LanguageSelector />
                </div>
              </div>
              <EditorRenderer className="demo-editor" />
            </div>
            <DemoTools />
            <SidebarRenderer />
            {isWorkflowSidebarVisible && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '300px',
                  height: '100%',
                  backgroundColor: 'white',
                  boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
                  zIndex: 1000, // Ensure it's above other content
                  overflowY: 'auto'
                }}
              >
                <WorkflowListSidebar onWorkflowSelect={handleWorkflowSelect} onWorkflowAdded={handleWorkflowAdded} />
              </div>
            )}
          </SidebarProvider>
        </FreeLayoutEditorProvider>
      </NodeRegistriesProvider>
    </div>
  );
};
