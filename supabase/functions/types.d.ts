// Deno type declarations for Supabase Edge Functions
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    toObject(): Record<string, string>;
  }
  
  export const env: Env;
}

// Import serve function type
declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(handler: (req: Request) => Promise<Response>): void;
}

// Import Supabase client type
declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export function createClient(url: string, key: string): any;
}
