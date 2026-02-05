export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  display_order?: number;
  created_at?: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  featured_image?: string;
  is_published: boolean;
  is_featured: boolean;
  meta_title?: string;
  meta_description?: string;
  jsonld_schema?: string;
  view_count?: number;
  created_at: string;
  updated_at?: string;
}