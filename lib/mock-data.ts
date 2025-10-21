export const user = {
  name: "Rose E.",
  age: 39,
  gender: "Female",
  avatar: "/placeholder-user.jpg",
};

interface Recommendation {
  product: string;
  reason: string;
}

interface Concern {
  name: string;
  score: number;
  ryg: "Green" | "Yellow" | "Red";
  description: string;
  recommendations: Recommendation[];
}

interface Analysis {
  summary: {
    skinType: string;
    skinAge: number;
    topConcerns: string[];
  };
  sensitivity: {
    redness: number;
    acne: number;
  };
  skinType: {
    type: string;
    description: string;
  };
  skinTone: {
    fitzpatrick: string;
    description: string;
  };
  concerns: Concern[];
}

export const analysis: Analysis = {
  summary: {
    skinType: "Combination",
    skinAge: 34,
    topConcerns: ["Under Eye", "Wrinkles", "Pores"],
  },
  sensitivity: {
    redness: 2,
    acne: 1,
  },
  skinType: {
    type: "Combination",
    description:
      "Your skin shows characteristics of both oily and dry types. An oily T-zone (forehead, nose, and chin) is common, while the cheeks may be drier. This can be influenced by factors like genetics, hormones, and even seasonal weather changes.",
  },
  skinTone: {
    fitzpatrick: "III",
    description:
      "This skin tone is characterized by light brown or olive skin that tans easily and is less prone to burning.",
  },
  concerns: [
    {
      name: "Pores",
      score: 4.4,
      ryg: "Red",
      description:
        "Visible sebaceous filaments and larger apparent pore size on nose; mild on...",
      recommendations: [
        {
          product: "Salicylic Acid Cleanser",
          reason: "Helps to exfoliate and clear out pores.",
        },
      ],
    },
    {
      name: "Wrinkles",
      score: 3.3,
      ryg: "Yellow",
      description:
        "Visible sebaceous filaments and larger apparent pore size on nose; mild on...",
      recommendations: [
        {
          product: "Retinol Serum",
          reason: "Promotes collagen production and reduces fine lines.",
        },
      ],
    },
    {
      name: "Pigmentation",
      score: 2.8,
      ryg: "Yellow",
      description:
        "Tightness and flakiness of skin, particularly on cheeks and forehead...",
      recommendations: [
        {
          product: "Vitamin C Serum",
          reason: "Brightens skin and fades dark spots.",
        },
      ],
    },
    {
      name: "Redness",
      score: 2.1,
      ryg: "Green",
      description:
        "Visible sebaceous filaments and larger apparent pore size on nose; mild on...",
      recommendations: [
        {
          product: "Niacinamide Serum",
          reason: "Calms inflammation and reduces redness.",
        },
      ],
    },
    {
      name: "Skin Texture",
      score: 1.0,
      ryg: "Green",
      description:
        "Visible sebaceous filaments and larger apparent pore size on nose; mild on...",
      recommendations: [
        {
          product: "AHA/BHA Exfoliant",
          reason: "Improves skin texture by removing dead skin cells.",
        },
      ],
    },
    {
      name: "Acne",
      score: 1.0,
      ryg: "Green",
      description:
        "Visible sebaceous filaments and larger apparent pore size on nose; mild on...",
      recommendations: [],
    },
    {
      name: "Under Eye",
      score: 1.0,
      ryg: "Green",
      description:
        "Visible sebaceous filaments and larger apparent pore size on nose; mild on...",
      recommendations: [
        {
          product: "Caffeine Eye Cream",
          reason: "Reduces puffiness and the appearance of dark circles.",
        },
      ],
    },
  ],
};
