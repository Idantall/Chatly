'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect } from 'react';
import { Database } from '@/lib/database.types';

// Supabase provider component to maintain session state throughout the app
export default function SupabaseProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  // Create a new supabase browser client on every first render
  const [supabaseClient] = useState(() => 
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://trpdjsqnkztibrdjfjwi.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycGRqc3Fua3p0aWJyZGpmandpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5ODA1NzksImV4cCI6MjA2MjU1NjU3OX0.sy8SKBUc7fzFdA2V1dl-fRAarByKNSDcSHSM-yJmVPY'
    )
  );

  // Export the client for use in other files
  useEffect(() => {
    // Make the client available globally for easier debugging
    (window as any).supabase = supabaseClient;
  }, [supabaseClient]);

  // With the modern approach, we don't need a provider
  // The client can be imported as needed from our existing lib/supabase.ts
  return <>{children}</>;
} 