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
  },
  {
    id: 'fact-2',
    type: 'did-you-know',
    content: {
      statement: "Your skin is your body's largest organ.",
      explanation: "It accounts for about 15% of your total body weight and hosts over 1,000 different species of bacteria."
    }
  },
  {
    id: 'tip-2',
    type: 'tip',
    content: {
      statement: "Apply Vitamin C in the morning.",
      explanation: "It boosts your sunscreen's efficacy by neutralizing free radicals from UV exposure and pollution."
    }
  },
  {
    id: 'myth-4',
    type: 'myth',
    content: {
      question: "Myth or Fact?",
      statement: "Pores can open and close.",
      explanation: "False. Pores lack muscles to open or close. Steam might loosen debris, but it doesn't 'open' them."
    }
  },
  {
    id: 'fact-3',
    type: 'did-you-know',
    content: {
      statement: "Retinoids are the gold standard for aging.",
      explanation: "They are the only FDA-approved topical ingredient proven to actually repair DNA damage and rebuild collagen."
    }
  },
  {
    id: 'tip-3',
    type: 'tip',
    content: {
      statement: "Don't forget your neck.",
      explanation: "The skin on your neck is thinner and shows aging signs faster. Take your skincare down to your chest!"
    }
  },
  {
    id: 'myth-5',
    type: 'myth',
    content: {
      question: "Myth or Fact?",
      statement: "Oily skin creates fewer wrinkles.",
      explanation: "False. Oily skin might stay moister, but wrinkles are caused by collagen loss, not dryness. Sun protection is key for all."
    }
  },
  {
    id: 'fact-4',
    type: 'did-you-know',
    content: {
      statement: "You shed 30,000-40,000 skin cells every minute.",
      explanation: "That's nearly 4kg of skin per year. Dust in your home is largely made up of these dead skin cells."
    }
  },
  {
    id: 'tip-4',
    type: 'tip',
    content: {
      statement: "Wait before applying acids.",
      explanation: "Let your face dry completely after washing. Wet skin absorbs products faster, which can increase irritation with active acids."
    }
  },
  {
    id: 'myth-6',
    type: 'myth',
    content: {
      question: "Myth or Fact?",
      statement: "Higher SPF means 100% protection.",
      explanation: "False. SPF 30 blocks ~97% of UVB rays, while SPF 50 blocks ~98%. No sunscreen blocks 100%."
    }
  },
  {
    id: 'fact-5',
    type: 'did-you-know',
    content: {
      statement: "Hyaluronic acid holds 1,000x its weight in water.",
      explanation: "It acts like a sponge, drawing moisture from the environment into your skin to keep it plump."
    }
  },
  {
    id: 'tip-5',
    type: 'tip',
    content: {
      statement: "Patch test new products.",
      explanation: "Apply a small amount behind your ear for 24 hours before using it on your face to check for reactions."
    }
  },
  {
    id: 'myth-7',
    type: 'myth',
    content: {
      question: "Myth or Fact?",
      statement: "You can scrub away acne.",
      explanation: "False. Harsh scrubbing causes inflammation and can spread bacteria, making breakouts worse. Gentle is better."
    }
  }
]
