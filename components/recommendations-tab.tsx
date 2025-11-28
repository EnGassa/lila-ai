"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, RefreshCw } from 'lucide-react';
import { Recommendations, Step, Product } from '@/lib/types';
import { IngredientCard } from './ingredient-card';

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

  const processedSteps = Object.values(
    (currentSteps || []).reduce((acc: { [key: string]: Step }, step: Step) => {
      if (!acc[step.step]) {
        // If the step doesn't exist in the accumulator, create it with the current step's products
        acc[step.step] = { ...step };
      } else {
        // If the step already exists, concatenate the products
        acc[step.step].products = acc[step.step].products.concat(step.products);
      }
      // Always ensure the instructions are set if they exist on the current step
      if (step.instructions && !acc[step.step].instructions) {
        acc[step.step].instructions = step.instructions;
      }
      return acc;
    }, {})
  );

  if (!recommendations) {
    return <div className="p-4 text-center text-muted-foreground">No recommendations available yet.</div>;
  }

  const allImageUrls = processedSteps.flatMap(step => step.products.map(p => p.image_url).filter(Boolean));

  return (
    <div className="space-y-6">
      {/* Image Preloader */}
      <div style={{ display: "none" }}>
        {allImageUrls.map((url) => (
          <img key={url} src={url} alt="preloaded image" loading="eager" />
        ))}
      </div>

      <div>
        <h2 className="text-lg font-medium text-muted-foreground p-4 rounded-t-lg">
          KEY INGREDIENTS FOR YOUR CONCERNS
        </h2>
        <div className="flex space-x-4 overflow-x-auto p-2 rounded-b-lg">
          {recommendations.key_ingredients.map((ingredient, index) => (
            <IngredientCard
              key={index}
              name={ingredient.name || ingredient.ingredient_slug}
              imageUrl={
                ingredient.image_url ||
                "/ingredients/ingredient-placeholder.png"
              }
              description={ingredient.description}
              tags={ingredient.concerns}
              className="min-w-[280px] shadow-sm border"
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-muted-foreground p-4 bg-white rounded-t-lg">
          YOUR ROUTINE
        </h2>
        <div className="p-2 bg-white rounded-b-lg">
          <div className="flex space-x-2 mb-6">
            <Button
              onClick={() => setActiveTab("AM")}
              className={
                activeTab === "AM"
                  ? "bg-[#B98579] text-white hover:bg-[#a06e63]"
                  : "bg-[rgba(174,104,86,0.03)] text-[#646464] border border-[rgba(170,103,90,0.34)] hover:bg-[rgba(174,104,86,0.1)]"
              }
              variant={activeTab === "AM" ? "default" : "outline"}
            >
              <Sun className="mr-2 h-4 w-4" /> AM
            </Button>
            <Button
              onClick={() => setActiveTab("PM")}
              className={
                activeTab === "PM"
                  ? "bg-[#B98579] text-white hover:bg-[#a06e63]"
                  : "bg-[rgba(174,104,86,0.03)] text-[#646464] border border-[rgba(170,103,90,0.34)] hover:bg-[rgba(174,104,86,0.1)]"
              }
              variant={activeTab === "PM" ? "default" : "outline"}
            >
              <Moon className="mr-2 h-4 w-4" /> PM
            </Button>
            <Button
              onClick={() => setActiveTab("Weekly")}
              className={
                activeTab === "Weekly"
                  ? "bg-[#B98579] text-white hover:bg-[#a06e63]"
                  : "bg-[rgba(174,104,86,0.03)] text-[#646464] border border-[rgba(170,103,90,0.34)] hover:bg-[rgba(174,104,86,0.1)]"
              }
              variant={activeTab === "Weekly" ? "default" : "outline"}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Weekly
            </Button>
          </div>

          {processedSteps.length === 0 ? (
            <p className="text-muted-foreground p-4">
              No steps found for this routine.
            </p>
          ) : (
            <Accordion
              type="single"
              collapsible
              defaultValue="item-0"
              className="space-y-4"
            >
              {processedSteps.map((step: Step, index: number) => (
                <AccordionItem
                  value={`item-${index}`}
                  key={index}
                  className="border-b border-[#BC8B80]"
                >
                  <AccordionTrigger className="text-lg font-bold text-[#1C1B1F] capitalize hover:no-underline">
                    <div className="flex items-center gap-2">
                      Step {index + 1}: {step.step}
                      {step.is_optional && (
                        <Badge variant="outline">Optional</Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-4">
                    <div className="space-y-4">
                      {/* Instructions are now rendered inside each product card */}
                      {step.products &&
                        step.products.map(
                          (product: Product, pIndex: number) => (
                            <div
                              key={pIndex}
                              className="bg-[#F9F9F8] rounded-2xl border border-[#BC8B80] overflow-hidden"
                            >
                              <div className="p-6">
                                <div className="flex gap-6">
                                  {/* Product Image */}
                                  <div className="w-[117px] h-[117px] bg-white rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
                                    <img
                                      src={
                                        product.image_url ||
                                        "/ingredients/product-placeholder.png"
                                      }
                                      alt={product.name || product.product_slug}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>

                                  {/* Product Title & Brand */}
                                  <div className="flex-grow">
                                    <h3 className="font-bold text-lg text-[#1C1B1F] leading-tight">
                                      {product.brand} - {product.name}
                                    </h3>
                                  </div>
                                </div>

                                <div className="mt-4">
                                  <p className="text-sm text-[#1C1B1F] leading-relaxed">
                                    <span className="font-semibold">Why:</span>{" "}
                                    {product.rationale}
                                  </p>
                                </div>
                              </div>

                              {/* How to Use Section */}
                              {step.instructions && (
                                <div className="bg-[#ECE0DE] p-6 rounded-t-lg">
                                  <p className="text-sm text-[#1C1B1F] leading-relaxed">
                                    <span className="font-semibold">
                                      How to use:
                                    </span>{" "}
                                    {step.instructions}
                                  </p>
                                </div>
                              )}
                            </div>
                          )
                        )}
                      {(!step.products || step.products.length === 0) && (
                        <p className="text-sm text-muted-foreground">
                          No specific product recommendations for this step.
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
      {/* <div className="text-center mt-6">
        <Button size="lg" className="bg-brown-500 text-white">View Routine</Button>
      </div> */}
    </div>
  );
}
