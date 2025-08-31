// Ambient declarations for npm modules in Angular

declare module 'hono' {
  export class Hono {
    constructor();
    // Add other Hono methods as needed
  }
  export default Hono;
}

declare module 'hono/middleware' {
  export function cors(): any;
  export function logger(): any;
}

declare module '@supabase/supabase-js' {
  export class SupabaseClient {
    constructor(url: string, key: string);
    // Add other Supabase methods as needed
  }
  export function createClient(url: string, key: string): SupabaseClient;
}
