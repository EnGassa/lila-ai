import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionHeader } from './section-header'

describe('SectionHeader', () => {
  it('renders title and subtitle', () => {
    render(
      <SectionHeader 
        title="Header Title" 
        subtitle="Header Subtitle" 
      />
    )
    
    expect(screen.getByText('Header Title')).toBeDefined()
    expect(screen.getByText('Header Subtitle')).toBeDefined()
  })
})
