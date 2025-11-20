"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, RefreshCw } from 'lucide-react';

interface Product {
  brand: string;
  name: string;
  rationale: string;
}

interface Step {
  step: string;
  instructions?: string;
  products: Product[];
}

interface Routine {
  am: Step[];
  pm: Step[];
  weekly?: Step[];
}

interface KeyIngredient {
  name: string;
  description: string;
  concerns: string[];
  image_url?: string;
}

interface Recommendations {
  key_ingredients: KeyIngredient[];
  routine: Routine;
}

const products = [
  {
    step: "Step 1: Cleanse",
    name: "ANUA Salicylic Acid Low Ph Cleanser",
    price: "₹699",
    compatibility: "94%",
    tags: ["Vegan", "Fragrance Free"],
    why: "The Salicylic Acid is clinically proven to be effective for unclogging pores.",
    image: "/ingredients/product-placeholder.png"
  },
  {
    step: "Step 2: Treat",
    name: "Product B",
    price: "₹799",
    compatibility: "92%",
    tags: ["Vegan"],
    why: "This is why you should use this product.",
    image: "/ingredients/product-placeholder.png"
  },
  {
    step: "Step 3: Hydrate",
    name: "Product C",
    price: "₹899",
    compatibility: "95%",
    tags: ["Fragrance Free"],
    why: "This is why you should use this product.",
    image: "/ingredients/product-placeholder.png"
  },
  {
    step: "Step 4: Protect",
    name: "Product D",
    price: "₹999",
    compatibility: "98%",
    tags: ["Vegan", "Fragrance Free"],
    why: "This is why you should use this product.",
    image: "/ingredients/product-placeholder.png"
  }
];

function InfoCard({ label, value, description, className }: { label: string, value: React.ReactNode, description?: string, className?: string }) {
  return (
    <Card className={`p-4 rounded-lg bg-white ${className}`}>
      <p className="text-sm font-light text-muted-foreground">{label}</p>
      <div>{value}</div>
      {description && (
        <p className="text-sm font-light text-muted-foreground">
          {description}
        </p>
      )}
    </Card>
  );
}

interface RecommendationsTabProps {
  recommendations: Recommendations;
}

export function RecommendationsTab({ recommendations }: RecommendationsTabProps) {
  const [activeTab, setActiveTab] = useState<'AM' | 'PM' | 'Weekly'>('AM');

  const routine = recommendations?.routine || {};
  const currentSteps = activeTab === 'AM' ? routine.am : activeTab === 'PM' ? routine.pm : routine.weekly || [];

  if (!recommendations) {
    return <div className="p-4 text-center text-muted-foreground">No recommendations available yet.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-light text-muted-foreground p-4 bg-white rounded-t-lg">
          KEY INGREDIENTS FOR YOUR CONCERNS
        </h2>
        <div className="flex space-x-4 overflow-x-auto p-4 bg-white rounded-b-lg">
          {recommendations.key_ingredients.map((ingredient, index) => (
            <Card key={index} className="min-w-[280px] shadow-sm border">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <img src={ingredient.image_url || "/ingredients/ingredient-placeholder.png"} alt={ingredient.name} className="w-16 h-16 rounded-md object-cover" />
                  <div>
                    <h3 className="font-bold text-base text-[#1C1B1F]">{ingredient.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{ingredient.description}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ingredient.concerns.map((concern, cIndex) => (
                      <Badge key={cIndex} variant="secondary">{concern}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-base font-light text-muted-foreground p-4 bg-white rounded-t-lg">
          YOUR ROUTINE
        </h2>
        <div className="p-4 bg-white rounded-b-lg">
        <div className="flex space-x-2 mb-6">
            <Button
              onClick={() => setActiveTab('AM')}
              className={activeTab === 'AM' ? "bg-[#B98579] text-white hover:bg-[#a06e63]" : "bg-[rgba(174,104,86,0.03)] text-[#646464] border border-[rgba(170,103,90,0.34)] hover:bg-[rgba(174,104,86,0.1)]"}
              variant={activeTab === 'AM' ? "default" : "outline"}
            >
              <Sun className="mr-2 h-4 w-4" /> AM
            </Button>
            <Button
              onClick={() => setActiveTab('PM')}
              className={activeTab === 'PM' ? "bg-[#B98579] text-white hover:bg-[#a06e63]" : "bg-[rgba(174,104,86,0.03)] text-[#646464] border border-[rgba(170,103,90,0.34)] hover:bg-[rgba(174,104,86,0.1)]"}
              variant={activeTab === 'PM' ? "default" : "outline"}
            >
              <Moon className="mr-2 h-4 w-4" /> PM
            </Button>
            <Button
              onClick={() => setActiveTab('Weekly')}
              className={activeTab === 'Weekly' ? "bg-[#B98579] text-white hover:bg-[#a06e63]" : "bg-[rgba(174,104,86,0.03)] text-[#646464] border border-[rgba(170,103,90,0.34)] hover:bg-[rgba(174,104,86,0.1)]"}
              variant={activeTab === 'Weekly' ? "default" : "outline"}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Weekly
            </Button>
          </div>

        {currentSteps.length === 0 ? (
            <p className="text-muted-foreground p-4">No steps found for this routine.</p>
        ) : (
            <Accordion type="single" collapsible defaultValue="item-0" className="space-y-4">
                {currentSteps.map((step: Step, index: number) => (
                <AccordionItem value={`item-${index}`} key={index} className="border-b border-[#BC8B80]">
                    <AccordionTrigger className="text-lg font-bold text-[#1C1B1F] capitalize hover:no-underline">
                        <div className="flex items-center gap-2">
                          {step.step}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-4">
                    <div className="space-y-4">
                        {step.instructions && (
                          <p className="text-sm text-muted-foreground italic">
                            {step.instructions}
                          </p>
                        )}
                        {step.products && step.products.map((product: Product, pIndex: number) => (
                            <div key={pIndex} className="bg-[#F9F9F8] rounded-xl p-4 border border-[rgba(0,0,0,0.06)] shadow-sm">
                                <div className="flex flex-col sm:flex-row gap-4">
                                  {/* Product Image */}
                                  <div className="w-24 h-24 sm:w-[117px] sm:h-[141px] bg-gray-100 rounded-[9px] flex-shrink-0 overflow-hidden mx-auto sm:mx-0">
                                      <img src="/ingredients/product-placeholder.png" alt={product.name} className="w-full h-full object-cover" />
                                  </div>
                                  
                                  {/* Product Details */}
                                  <div className="flex-grow flex flex-col justify-between">
                                      <div>
                                          <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-base text-[#1C1B1F]">{product.brand} - {product.name}</h3>
                                            {/* Placeholder Price if available, else hidden for now */}
                                            {/* <span className="font-bold text-xl text-[#1C1B1F]">₹---</span> */}
                                          </div>
                                          
                                          {/* Badges/Tags Placeholder - Can be dynamic later */}
                                          <div className="flex flex-wrap gap-2 mt-2 mb-3">
                                            <Badge variant="secondary" className="bg-[rgba(0,71,241,0.07)] text-[rgba(0,43,183,0.77)] hover:bg-[rgba(0,71,241,0.1)]">
                                              Recommended
                                            </Badge>
                                          </div>

                                          <p className="text-sm text-[#1C1B1F] leading-relaxed">
                                            <span className="font-semibold">Why:</span> {product.rationale}
                                          </p>
                                      </div>

                                      {/* Action Buttons */}
                                      <div className="flex gap-2 mt-4 justify-end sm:justify-start">
                                        <Button variant="outline" size="sm" className="border-[#BC8B80] text-[#B07669] hover:bg-[#fdf8f7]">
                                          View Details
                                        </Button>
                                        <Button size="sm" className="bg-[#B98579] text-white hover:bg-[#a06e63]">
                                          Add to Cart
                                        </Button>
                                      </div>
                                  </div>
                                </div>
                            </div>
                        ))}
                        {(!step.products || step.products.length === 0) && (
                             <p className="text-sm text-muted-foreground">No specific product recommendations for this step.</p>
                        )}
                    </div>
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
        )}
        </div>
      </div>
      <div className="text-center mt-6">
        <Button size="lg" className="bg-brown-500 text-white">View Routine</Button>
      </div>
    </div>
  );
}
