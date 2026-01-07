import { describe, it, expect } from 'vitest'
import { ProductSchema } from './schemas'

describe('ProductSchema Validation', () => {
  it('should validate a valid product', () => {
    const validProduct = {
      name: 'Hydrating Serum',
      brand: 'Lila Skin',
      category: 'Serum',
      description: 'A nice serum',
      imageUrl: 'https://example.com/image.jpg',
      rating: 4.5,
      review_count: 100,
      attributes: 'Hydrating, Vegan',
      benefits: 'Moisturizes',
      active_ingredients: 'Hyaluronic Acid',
      concerns: 'Dryness'
    }

    const result = ProductSchema.safeParse(validProduct)
    expect(result.success).toBe(true)
  })

  it('should fail with missing required fields', () => {
    const invalidProduct = {
      name: '', // Empty
      brand: 'Lila Skin',
      // Missing category
    }

    const result = ProductSchema.safeParse(invalidProduct)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toHaveProperty('name')
      expect(result.error.flatten().fieldErrors).toHaveProperty('category')
    }
  })

  it('should allow optional fields to be missing', () => {
    const minimalProduct = {
      name: 'Minimal Product',
      brand: 'Simple Brand',
      category: 'Cream'
    }

    const result = ProductSchema.safeParse(minimalProduct)
    expect(result.success).toBe(true)
  })

  it('should enforce rating constraints (0-5)', () => {
    const highRating = {
      name: 'Product',
      brand: 'Brand',
      category: 'Cat',
      rating: 6 
    }

    const result = ProductSchema.safeParse(highRating)
    expect(result.success).toBe(false)
  })

  it('should enforce numeric coercion', () => {
    const stringRating = {
      name: 'Product',
      brand: 'Brand',
      category: 'Cat',
      rating: "4.5", // String input simulating FormData
      review_count: "10"
    }

    const result = ProductSchema.safeParse(stringRating)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.rating).toBe(4.5)
      expect(result.data.review_count).toBe(10)
    }
  })
})
