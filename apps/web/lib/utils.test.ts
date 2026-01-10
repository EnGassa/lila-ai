import { describe, it, expect } from 'vitest'
import { cn, getEulerAngles } from './utils'

describe('lib/utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('c-1', 'c-2')).toBe('c-1 c-2')
    })

    it('should handle conditional classes', () => {
      expect(cn('c-1', true && 'c-2', false && 'c-3')).toBe('c-1 c-2')
    })
    
    it('should handle tailwind conflicts', () => {
        expect(cn('p-4', 'p-2')).toBe('p-2')
    })
  })

  describe('getEulerAngles', () => {
    it('should return zeros for identity matrix', () => {
      const identity = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ]
      const result = getEulerAngles(identity)
      expect(result.yaw).toBeCloseTo(0)
      expect(result.pitch).toBeCloseTo(0)
      expect(result.roll).toBeCloseTo(0)
    })

    // 90 degrees rotation around Z axis (Roll)
    // cos(90)=0, sin(90)=1
    // [ 0 -1  0  0 ]
    // [ 1  0  0  0 ]
    // [ 0  0  1  0 ]
    // [ 0  0  0  1 ]
    it('should detect 90 degree roll', () => {
       const matrix = [
           0, -1, 0, 0,
           1, 0, 0, 0,
           0, 0, 1, 0,
           0, 0, 0, 1
       ] 
       const result = getEulerAngles(matrix)
       // Expecting roll to be close to 90
       expect(result.roll).toBeCloseTo(90)
       expect(result.pitch).toBeCloseTo(0)
       expect(result.yaw).toBeCloseTo(0)
    })
  })
})
