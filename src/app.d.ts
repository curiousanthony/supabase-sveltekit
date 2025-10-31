// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from './database.types.ts' // import generated types

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      supabase: SupabaseClient<Database>
      safeGetSession: () => Promise<{ session: Session | null; user: User | null }>
      session: Session | null
      user: User | null
    }
    interface PageData {
      session: Session | null
    }
    // interface PageState {}
    // interface Platform {}

    /* -- Header Types returned by each +page.server.ts -- */
    type HeaderAction =
| {
    type: 'badge';
    icon?: string;
    text: string;
    className?: string;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | undefined;
}
| {
    type: 'button';
    icon?: string;
    text: string;
    className?: string;
    href?: string;
    variant?: "link" | 'default' | 'destructive' | 'outline' | 'secondary' | "ghost" | undefined;
}
| {
    type: 'separator';
    orientation?: 'vertical';
};

   type Header = {
    pageName: string;
    actions: HeaderAction[];
}; 
  }
}

export {}