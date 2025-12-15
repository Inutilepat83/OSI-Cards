export interface Schema {
  /** Name of the section (will be dasherized) */
  name: string;
  
  /** Path to create the section in */
  path?: string;
  
  /** Section type identifier (defaults to name) */
  type?: string;
  
  /** Whether section uses fields array */
  usesFields?: boolean;
  
  /** Whether section uses items array */
  usesItems?: boolean;
  
  /** Default column span (1-4) */
  defaultColumns?: number;
  
  /** Description for documentation */
  description?: string;
  
  /** Angular project name */
  project?: string;
  
  /** Skip registry update */
  skipRegistry?: boolean;
  
  /** Skip style file creation */
  skipStyles?: boolean;
}








