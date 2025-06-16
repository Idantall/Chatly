'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import './login.css'; // אם יש קובץ CSS ספציפי

// לטעון את טופס ההתחברות באופן דינמי, בלי להראות את אנימציית הטעינה האפורה שגורמת לבעיות
const LoginForm = dynamic(() => import('./LoginForm'), { 
  ssr: false,
  loading: () => null
});

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
} 