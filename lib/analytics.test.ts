import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analytics } from './analytics'
import posthog from 'posthog-js'

// Mock posthog-js
vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  },
}))

describe('lib/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('track', () => {
    it('should call posthog.capture with correct arguments', () => {
      const eventName = 'login_success'
      const properties = { flow: 'first_time' } as const

      analytics.track(eventName, properties)

      expect(posthog.capture).toHaveBeenCalledTimes(1)
      expect(posthog.capture).toHaveBeenCalledWith(eventName, properties)
    })

    it('should handle errors gracefully', () => {
      // Mock capture to throw
      vi.mocked(posthog.capture).mockImplementationOnce(() => {
        throw new Error('PostHog error')
      })
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Should not throw
      expect(() => analytics.track('login_attempt')).not.toThrow()
      
      expect(consoleSpy).toHaveBeenCalledWith('Analytics Error:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('identify', () => {
    it('should call posthog.identify', () => {
      const userId = 'user_123'
      const traits = { plan: 'premium' }

      analytics.identify(userId, traits)

      expect(posthog.identify).toHaveBeenCalledWith(userId, traits)
    })
  })

  describe('reset', () => {
    it('should call posthog.reset', () => {
      analytics.reset()
      expect(posthog.reset).toHaveBeenCalled()
    })
  })
})
