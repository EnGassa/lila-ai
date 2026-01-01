export interface EducactionItem {
  id: string
  type: 'myth' | 'did-you-know' | 'tip'
  content: {
    question?: string
    statement: string
    explanation: string
  }
}

export const EDUCATION_ITEMS: EducactionItem[] = [
  {
    id: 'myth-1',
    type: 'myth',
    content: {
      question: "Myth or Fact?",
      statement: "Oily skin doesn't need moisturizer.",
      explanation: "False. Dehydration actually triggers your skin to produce MORE oil. Lightweight hydration is essential for balance."
    }
  },
  {
    id: 'fact-1',
    type: 'did-you-know',
    content: {
      statement: "Your skin regenerates itself approximately every 27 days.",
      explanation: "This turnover rate slows down as we age, which is why exfoliation becomes increasingly important for a glow."
    }
  },
  {
    id: 'myth-2',
    type: 'myth',
    content: {
      question: "Myth or Fact?",
      statement: "You don't need sunscreen on cloudy days.",
      explanation: "False. Up to 80% of UV rays can penetrate clouds. Daily SPF is the #1 anti-aging product."
    }
  },
  {
    id: 'tip-1',
    type: 'tip',
    content: {
      statement: "Layering Order Matters",
      explanation: "Always apply skincare from thinnest to thickest consistency: Toner -> Serum -> Moisturizer -> Oil."
    }
  },
  {
    id: 'myth-3',
    type: 'myth',
    content: {
      question: "Myth or Fact?",
      statement: "Natural ingredients are always better.",
      explanation: "Not always. Poison ivy is natural! 'Lab-made' often means more stable, safe, and effective formulations."
    }
  }
]
