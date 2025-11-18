"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const ingredients = [
  {
    name: "Salicylic Acid 1.5-2%",
    description: "Unclogs pores and removes oil and debris.",
    concerns: ["Unclog oily pores", "Remove blackheads"],
    image: "/ingredients/ingredient-placeholder.png"
  },
  {
    name: "Niacinamide 5-10%",
    description: "Improves skin barrier and reduces redness.",
    concerns: ["Reduce redness", "Improve texture"],
    image: "/ingredients/ingredient-placeholder.png"
  },
  {
    name: "Hyaluronic Acid",
    description: "Hydrates and plumps the skin.",
    concerns: ["Hydration", "Plumping"],
    image: "/ingredients/ingredient-placeholder.png"
  },
];

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

export function RecommendationsTab() {
  const [activeTab, setActiveTab] = useState('AM');

  return (
    <div className="space-y-6">
      <InfoCard
        label="INGREDIENTS & PRODUCTS"
        value={
          <p className="text-sm font-light text-muted-foreground">
            Understanding ingredients required for your skin concerns and add products to build your routine.
          </p>
        }
        className="col-span-1 sm:col-span-2 text-center"
      />

      <div>
        <h2 className="text-base font-light text-muted-foreground p-4 bg-white rounded-t-lg">
          KEY INGREDIENTS FOR YOUR CONCERNS
        </h2>
        <div className="flex space-x-4 overflow-x-auto p-4 bg-white rounded-b-lg">
          {ingredients.map((ingredient, index) => (
            <Card key={index} className="min-w-[280px] shadow-sm border">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-md flex-shrink-0">
                    <img src={ingredient.image} alt={ingredient.name} className="w-full h-full object-cover rounded-md" />
                  </div>
                  <h3 className="font-semibold">{ingredient.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{ingredient.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ingredient.concerns.map((concern, i) => (
                    <Badge key={i} variant="outline" className="border-brown-500 text-brown-500">{concern}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-base font-light text-muted-foreground p-4 bg-white rounded-t-lg">
          ADD PRODUCTS TO YOUR ROUTINE
        </h2>
        <div className="p-4 bg-white rounded-b-lg">
        <div className="flex space-x-2 mb-4">
            <Button
              onClick={() => setActiveTab('AM')}
              className={activeTab === 'AM' ? "bg-brown-500 text-white" : "border-brown-500 text-brown-500"}
              variant={activeTab === 'AM' ? "default" : "outline"}
            >
              AM
            </Button>
            <Button
              onClick={() => setActiveTab('PM')}
              className={activeTab === 'PM' ? "bg-brown-500 text-white" : "border-brown-500 text-brown-500"}
              variant={activeTab === 'PM' ? "default" : "outline"}
            >
              PM
            </Button>
            <Button
              onClick={() => setActiveTab('Weekly')}
              className={activeTab === 'Weekly' ? "bg-brown-500 text-white" : "border-brown-500 text-brown-500"}
              variant={activeTab === 'Weekly' ? "default" : "outline"}
            >
              Weekly
            </Button>
          </div>

        <Accordion type="single" collapsible defaultValue="item-0">
            {products.map((product, index) => (
              <AccordionItem value={`item-${index}`} key={index} className="border-b-2 border-brown-500">
                <AccordionTrigger className="text-lg font-semibold text-gray-800">{product.step}</AccordionTrigger>
                <AccordionContent>
                  <div className="p-4">
                    <Card className="shadow-sm border">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="w-24 h-24 bg-gray-100 rounded-md flex-shrink-0">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-md" />
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-bold">{product.name}</h3>
                            <p className="text-sm text-muted-foreground">Compatibility: {product.compatibility}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {product.tags.map((tag, i) => (
                                <Badge key={i} variant="outline">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm mt-4">
                          <span className="font-semibold">Why:</span> {product.why}
                        </p>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-lg font-bold">{product.price}</span>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="border-brown-500 text-brown-500">View Details</Button>
                            <Button size="sm" className="bg-brown-500 text-white">Add to Cart</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
      <div className="text-center mt-6">
        <Button size="lg" className="bg-brown-500 text-white">View Routine</Button>
      </div>
    </div>
  );
}
