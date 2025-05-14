import { createRoot } from 'react-dom/client';
import { I18nProvider } from './context/i18n-context';
import { Editor } from './editor';

const app = createRoot(document.getElementById('root')!);

app.render(
  <I18nProvider>
    <Editor />
  </I18nProvider>
);
