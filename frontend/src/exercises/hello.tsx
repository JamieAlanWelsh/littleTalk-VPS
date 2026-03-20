import 'vite/modulepreload-polyfill';
import { createRoot } from 'react-dom/client';
import Counter from '../components/MyFirstComponent.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}
const root = createRoot(rootElement);
root.render(<Counter/>)