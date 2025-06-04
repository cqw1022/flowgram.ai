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
import { WorkflowDefinition } from './services/workflow-service'; // Assuming WorkflowDefinition is defined here or adjust path

export const Editor = () => {
  const [currentInitialData, setCurrentInitialData] = useState(initialData);
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowDefinition | null>(null); // Add state for current workflow
  const [editorKey, setEditorKey] = useState(0); // Add a key state
  const editorProps = useEditorProps(currentInitialData, staticNodeRegistries);
  const { t } = useI18n();
  const [isWorkflowSidebarVisible, setIsWorkflowSidebarVisible] = useState(false);

  const handleWorkflowSelect = (workflow: any) => {
    // Logic to handle workflow selection, e.g., load it into the editor
    console.log('Selected workflow:', workflow);
    // Assuming workflow object has the structure of initialData (nodes, edges)
    // You might need to fetch the full workflow data here if 'workflow' is just a summary
    if (workflow && workflow.flow_id) { // Ensure workflow and flow_id exist
      console.log('Loaded workflow into editor:', workflow);
      setCurrentInitialData({ nodes: workflow.nodes || [], edges: workflow.edges || [] });
      setCurrentWorkflow(workflow as WorkflowDefinition); // Set the current workflow
      setEditorKey(prevKey => prevKey + 1); // Increment key to force re-render
    } else {
      // Fallback or error handling if workflow data is not as expected
      setCurrentInitialData(initialData);
      setCurrentWorkflow(null); // Reset current workflow
      setEditorKey(prevKey => prevKey + 1); // Increment key to force re-render
      console.warn('Selected workflow does not contain nodes and edges, or flow_id is missing, loading default data.');
    }
    setIsWorkflowSidebarVisible(false); // Optionally hide sidebar after selection
  };

  const handleWorkflowAdded = () => {
    // if (editorProps.editor) {
    //   editorProps.editor.clear(); // Clear all nodes and edges
    // }
  };

  console.error(editorProps);

  return (
    <div className="doc-free-feature-overview">
      <NodeRegistriesProvider value={editorProps.nodeRegistries}>
        {/* @ts-ignore */}
        <FreeLayoutEditorProvider key={editorKey} {...editorProps} panelProps={{ nodeRegistries: editorProps.nodeRegistries }}>
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
            <DemoTools currentWorkflow={currentWorkflow} />
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
