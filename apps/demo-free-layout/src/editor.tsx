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

export const Editor = () => {
  const editorProps = useEditorProps(initialData, staticNodeRegistries);
  const { t } = useI18n();

  return (
    <div className="doc-free-feature-overview">
      <NodeRegistriesProvider value={editorProps.nodeRegistries}>
        {/* @ts-ignore */}
        <FreeLayoutEditorProvider {...editorProps} panelProps={{ nodeRegistries: editorProps.nodeRegistries }}>
          <SidebarProvider>
            <div className="demo-container">
              <div className="demo-header">
                <h1>{t('FreeLayout')}</h1>
                <LanguageSelector />
              </div>
              <EditorRenderer className="demo-editor" />
            </div>
            <DemoTools />
            <SidebarRenderer />
          </SidebarProvider>
        </FreeLayoutEditorProvider>
      </NodeRegistriesProvider>
    </div>
  );
};
