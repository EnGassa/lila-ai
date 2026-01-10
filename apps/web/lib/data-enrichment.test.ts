import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SupabaseClient } from '@supabase/supabase-js'
import { enrichRecommendations } from './data-enrichment'
import { Recommendations, Product } from './types'

// Mock Supabase client
const mockSelect = vi.fn()
const mockIn = vi.fn()
const mockFrom = vi.fn(() => ({
  select: mockSelect.mockReturnValue({
    in: mockIn
  })
}))

const mockSupabase = {
  from: mockFrom
} as unknown as SupabaseClient

describe('enrichRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should enrich ingredients', async () => {
    const recommendations = {
      key_ingredients: [
        { ingredient_slug: 'vit-c', reason: 'brightening' }
      ]
    } as unknown as Recommendations

    // Mock DB response
    mockIn.mockResolvedValueOnce({
      data: [
        { ingredient_slug: 'vit-c', name: 'Vitamin C', image_url: 'vitc.jpg' }
      ]
    })

    await enrichRecommendations(mockSupabase, recommendations)

    expect(mockFrom).toHaveBeenCalledWith('ingredients_1')
    expect(mockIn).toHaveBeenCalledWith('ingredient_slug', ['vit-c'])
    
    // Check mutation
    expect(recommendations.key_ingredients[0]).toEqual({
      ingredient_slug: 'vit-c',
      reason: 'brightening',
      name: 'Vitamin C',
      image_url: 'vitc.jpg'
    })
  })

  it('should enrich products in routine', async () => {
    const recommendations = {
      routine: {
        am: [
          {
            step_name: 'Cleanse',
            products: [{ product_slug: 'cleanser-1' }]
          }
        ],
        pm: [], 
        weekly: []
      }
    }

    // Mock products call (ingredients enrichment is skipped due to missing prop)
    mockIn.mockResolvedValueOnce({
      data: [
        { product_slug: 'cleanser-1', name: 'Gentle Cleanser', brand: 'Brand X', image_url: 'c1.jpg' }
      ]
    })

    await enrichRecommendations(mockSupabase, recommendations as unknown as Recommendations)

    expect(mockFrom).toHaveBeenCalledWith('products_1')
    expect(mockIn).toHaveBeenCalledWith('product_slug', ['cleanser-1'])
    
    expect(recommendations.routine.am[0].products[0]).toEqual({
      product_slug: 'cleanser-1',
      name: 'Gentle Cleanser',
      brand: 'Brand X',
      image_url: 'c1.jpg',
      purchase_options: []
    })
  })
  it('should enrich purchase options with sorting and filtering', async () => {
    const recommendations = {
      routine: {
        am: [
          {
            step_name: 'Moisturize',
            products: [{ product_slug: 'cream-1' }]
          }
        ],
        pm: [],
        weekly: []
      }
    }

    const mockProductData = {
      product_slug: 'cream-1',
      name: 'Cream',
      brand: 'Brand',
      image_url: 'img.jpg',
      product_purchase_options: [
        {
          id: 'opt-1',
          url: 'https://store1.com',
          price: 10,
          priority: 5, // Lower priority
          is_active: true,
          retailers: { id: 'r1', name: 'Store 1', is_active: true, country_code: 'US' }
        },
        {
          id: 'opt-2',
          url: 'https://store2.com',
          price: 12,
          priority: 10, // Higher priority
          is_active: true,
          retailers: { id: 'r2', name: 'Store 2', is_active: true, country_code: 'US' }
        },
        {
          id: 'opt-3',
          url: 'https://store3.com',
          price: 15,
          priority: 2,
          is_active: false, // Disabled Option
          retailers: { id: 'r3', name: 'Store 3', is_active: true, country_code: 'US' }
        },
        {
          id: 'opt-4',
          url: 'https://store4.com',
          price: 20,
          priority: 2,
          is_active: true,
          retailers: { id: 'r4', name: 'Store 4', is_active: false, country_code: 'US' } // Disabled Retailer
        }
      ]
    }

    mockIn.mockResolvedValueOnce({
      data: [mockProductData]
    })

    await enrichRecommendations(mockSupabase, recommendations as unknown as Recommendations)

    const enrichedProduct = recommendations.routine.am[0].products[0] as unknown as Product
    const options = enrichedProduct.purchase_options || []



    // Should filter out inactive options (opt-3) and inactive retailers (opt-4)
    expect(options).toHaveLength(2)

    // Should sort by priority descending (opt-2 first, then opt-1)
    expect(options[0].id).toBe('opt-2')
    expect(options[1].id).toBe('opt-1')
    
    // Check mapping
    expect(options[0].retailer_name).toBe('Store 2')
  })
})
