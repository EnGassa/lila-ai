import { vi } from 'vitest'

// Mock Environment Variables for Supabase
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase-url.com'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key'

// Mock ResizeObserver (often needed for UI tests)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
