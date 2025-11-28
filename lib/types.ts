// Defines the shared TypeScript types that correspond to the Pydantic
// models in the Python backend (skin_lib.py).

export interface Product {
  product_slug: string; // This will be the product_slug from the lean object
  name?: string;
  brand?: string;
  rationale: string;
  image_url?: string;
}

export interface Step {
  step: string;
  products: Product[];
  instructions: string;
  is_optional?: boolean;
}

export interface KeyIngredient {
  ingredient_slug: string;
  name?: string;
  description: string;
  concerns: string[];
  image_url?: string;
}

export interface Recommendations {
  key_ingredients: KeyIngredient[];
  routine: {
    am: Step[];
    pm: Step[];
    weekly?: Step[];
  };
}
