// Ambient declarations for npm modules in Angular

declare module "hono" {
  export * from "hono";
  export default Hono;
}

declare module "hono/middleware" {
  // Hono middleware exports
  export { cors, logger } from "hono/middleware";
}

declare module "@supabase/supabase-js" {
  // Supabase JS client
  import * as supabase from "@supabase/supabase-js";
  export * from "@supabase/supabase-js";
  export default supabase;
}
