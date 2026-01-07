import { describe, it, expect, vi, beforeEach } from 'vitest'
import { enrichRecommendations } from './data-enrichment'

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
} as any

describe('enrichRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should enrich ingredients', async () => {
    const recommendations: any = {
      key_ingredients: [
        { ingredient_slug: 'vit-c', reason: 'brightening' }
      ]
    }

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
    const recommendations: any = {
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

    await enrichRecommendations(mockSupabase, recommendations)

    expect(mockFrom).toHaveBeenCalledWith('products_1')
    expect(mockIn).toHaveBeenCalledWith('product_slug', ['cleanser-1'])
    
    expect(recommendations.routine.am[0].products[0]).toEqual({
      product_slug: 'cleanser-1',
      name: 'Gentle Cleanser',
      brand: 'Brand X',
      image_url: 'c1.jpg'
    })
  })
})
