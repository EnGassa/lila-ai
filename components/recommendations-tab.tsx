"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, RefreshCw } from 'lucide-react';
import { Recommendations, Step, Product } from '@/lib/types';
import { IngredientCard } from './ingredient-card';

function InfoCard({ label, value, description, className }: { label: string, value: React.ReactNode, description?: string, className?: string }) {
  return (
    <Card className={`p-4 rounded-lg bg-card ${className}`}>
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
        <h2 className="text-lg font-medium text-muted-foreground p-4 bg-card rounded-t-lg">
          YOUR ROUTINE
        </h2>
        <div className="p-2 bg-card rounded-b-lg">
          <div className="flex space-x-2 mb-6">
            <Button
              onClick={() => setActiveTab("AM")}
              className={
                activeTab === "AM"
                  ? "bg-brand text-white hover:bg-brand-hover"
                  : "bg-brand-light text-muted-foreground border border-brand-border hover:bg-brand-light/50"
              }
              variant={activeTab === "AM" ? "default" : "outline"}
            >
              <Sun className="mr-2 h-4 w-4" /> AM
            </Button>
            <Button
              onClick={() => setActiveTab("PM")}
              className={
                activeTab === "PM"
                  ? "bg-brand text-white hover:bg-brand-hover"
                  : "bg-brand-light text-muted-foreground border border-brand-border hover:bg-brand-light/50"
              }
              variant={activeTab === "PM" ? "default" : "outline"}
            >
              <Moon className="mr-2 h-4 w-4" /> PM
            </Button>
            <Button
              onClick={() => setActiveTab("Weekly")}
              className={
                activeTab === "Weekly"
                  ? "bg-brand text-white hover:bg-brand-hover"
                  : "bg-brand-light text-muted-foreground border border-brand-border hover:bg-brand-light/50"
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
                  className="border-b border-brand-border"
                >
                  <AccordionTrigger className="text-lg font-bold text-foreground capitalize hover:no-underline">
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
                      {/* Instructions are now rendered once for the step */}
                      {step.instructions && (
                        <div className="bg-brand-light/30 p-5 rounded-xl mb-6 border border-brand-border/50 prose prose-sm max-w-none">
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs">i</span>
                            How to use
                          </h4>
                          <ReactMarkdown
                            components={{
                              p: ({node, ...props}) => <p className="text-sm text-foreground leading-relaxed" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-inside" {...props} />,
                              li: ({node, ...props}) => <li className="text-sm text-foreground leading-relaxed" {...props} />,
                            }}
                          >
                            {step.instructions.replace(/\\n/g, '\n')}
                          </ReactMarkdown>
                        </div>
                      )}

                      {/* Unified Product Carousel */}
                      {(() => {
                        const allProducts = [...(step.products || [])].sort((a, b) => {
                          const aType = a.selection_type || 'primary';
                          const bType = b.selection_type || 'primary';
                          if (aType === 'primary' && bType !== 'primary') return -1;
                          if (aType !== 'primary' && bType === 'primary') return 1;
                          return 0;
                        });

                        return (
                          <div className="flex overflow-x-auto space-x-4 pb-4 -mx-4 px-4 scrollbar-hide snap-x items-stretch">
                            {allProducts.map((product: Product, pIndex: number) => {
                              const isPrimary = !product.selection_type || product.selection_type === 'primary';
                              
                              return (
                                <div
                                  key={`prod-${pIndex}`}
                                  className={`min-w-[300px] w-[300px] bg-card rounded-2xl border shadow-sm snap-center flex flex-col overflow-hidden transition-all duration-300 ${isPrimary ? 'border-brand-border ring-1 ring-brand-border/50 shadow-md' : 'border-border'}`}
                                >
                                  {/* Image Area */}
                                  <div className="h-48 bg-secondary/30 flex items-center justify-center p-6 relative">
                                    <img
                                      src={
                                        product.image_url ||
                                        "/ingredients/product-placeholder.png"
                                      }
                                      alt={product.name || product.product_slug}
                                      className="h-full object-contain mix-blend-multiply"
                                    />
                                    {isPrimary && (
                                       <Badge className="absolute top-4 right-4 bg-brand text-white hover:bg-brand shadow-sm">Top Pick</Badge>
                                    )}
                                  </div>

                                  <div className="p-5 flex flex-col flex-grow">
                                    <div className="mb-3">
                                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{product.brand}</p>
                                      <h3 className="font-bold text-lg text-foreground leading-tight line-clamp-2 min-h-[50px]">
                                        {product.name}
                                      </h3>
                                    </div>

                                    {!isPrimary && product.reason_for_alternative && (
                                       <Badge variant="outline" className="self-start mb-4 bg-secondary/50 text-xs py-1 px-2 border-brand-border/30">
                                          {product.reason_for_alternative}
                                       </Badge>
                                    )}

                                    <div className="prose prose-sm max-w-none flex-grow">
                                      <p className="text-xs font-semibold text-foreground mb-1 mt-0">Why it matches:</p>
                                      <div className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                                        <ReactMarkdown>
                                            {product.rationale}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                      
                      {(!step.products || step.products.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-8 bg-secondary/30 rounded-xl">
                          No specific products needed for this step.
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
