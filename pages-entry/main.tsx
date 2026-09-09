import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/app/globals.css';
import { CommerceOpsApp } from '@/components/commerce-ops-app';

const root = document.getElementById('root');

if (!root) throw new Error('Application root not found');

createRoot(root).render(
  <StrictMode>
    <CommerceOpsApp />
  </StrictMode>,
);
