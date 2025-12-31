// Defines the shared TypeScript types that correspond to the Pydantic
// models in the Python backend (skin_lib.py).

export interface Product {
  product_slug: string; // This will be the product_slug from the lean object
  name?: string;
  brand?: string;
  rationale: string;
  image_url?: string;
  selection_type?: 'primary' | 'alternative';
  reason_for_alternative?: string;
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

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  image?: {
    url: string;
  };
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
  footer?: {
      text: string;
      icon_url?: string;
  };
}
