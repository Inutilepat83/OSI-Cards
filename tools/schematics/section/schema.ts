export interface Schema {
  name: string;
  path?: string;
  type: string;
  usesFields?: boolean;
  usesItems?: boolean;
  project?: string;
}

