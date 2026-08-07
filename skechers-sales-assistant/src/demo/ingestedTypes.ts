// Shapes for the auto-generated ingested demo data (Method 1). The ingestion
// runner (scripts/ingest-skechers.ts --update-demo) writes ingested.generated.ts
// against these types so the browser demo can show real (authorized-sample)
// Skechers products with their generated recommendations.

export interface IngestedDemoProduct {
  sku: string;
  style_number: string | null;
  name: string;
  category: string;
  subcategory: string | null;
  gender: string | null;
  color: string | null;
  size_range: string | null;
  price: number | null;
  currency: string;
  region: string;
  product_url: string | null;
  description: string | null;
  key_features: string[] | null;
  technology: string | null;
  activity_type: string | null;
}

export interface IngestedDemoEdge {
  source: string;
  target: string;
  type: string;
  priority: number;
  reason: string;
  benefit: string;
  need: string | null;
}
