// Defines the shared TypeScript types that correspond to the Pydantic
// models in the Python backend (skin_lib.py).

export interface Product {
  product_id: string;
  name: string;
  brand: string;
  rationale: string;
  image_url?: string;
}

export interface Step {
  step: string;
  products: Product[];
  instructions: string;
}

export interface KeyIngredient {
  name: string;
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
