"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const mockData = {
  problems: {
    title: "Problems we are solving",
    description:
      "Your top issues are enlarged/clog-prone pores, fine lines and wrinkles, and uneven pigmentation/dark spots.",
  },
  solution: {
    title: "How we solve them",
    description:
      "We’ll address them with a morning vitamin C + niacinamide routine and daily SPF50, and at night alternate a retinoid with BHA or azelaic acid while buffering with a ceramide moisturizer and avoiding strong-acid + retinoid stacking.",
  },
  expectations: {
    title: "What to expect",
    description:
      "Over 8–12 weeks you should see smoother texture and smaller-looking pores, a brighter and more even skin tone, and softened fine lines, with results maintained by consistent sunscreen and steady, irritation-aware use.",
  },
  ingredients: {
    title: "Ingredients for your Skin Concerns",
    description:
      "Based on your primary skin concerns we’ve identified the following ingredients.",
    concerns: [
      {
        name: "Pores",
        severity: 4.4,
        actives: ["BHA (salicylic)", "Niacinamide", "Clay"],
      },
      {
        name: "Wrinkles",
        severity: 3.8,
        actives: ["Retinoids", "Peptides", "Vitamin C"],
      },
      {
        name: "Pigmentation",
        severity: 3.6,
        actives: ["Azelaic (10–15%)", "Alpha arbutin", "Vitamin C"],
      },
    ],
  },
  routine: {
    title: "Personalized Routine",
    am: [
      {
        step: "STEP 1: CLEANSER",
        product: "Brand Name Product",
        description: "Low PH cleanser because you have dry skin.",
        howToUse: [
          "Use Daily",
          "Full face & neck",
          "1-2 pea size",
          "Wash with water after application",
        ],
        actives: ["Niacinamide"],
      },
      {
        step: "STEP 2: TONER",
        product: "Brand Name Product",
        description: "Hydrating toner to prep the skin.",
        howToUse: ["Use Daily", "Apply with a cotton pad", "Focus on T-zone"],
        actives: ["Hyaluronic Acid"],
      },
      {
        step: "STEP 3: MOISTURIZER",
        product: "Brand Name Product",
        description: "Rich cream for deep hydration.",
        howToUse: ["Use Daily", "Apply on face & neck", "Use after toner"],
        actives: ["Shea Butter"],
      },
    ],
  },
};

export function RecommendationsSection() {
  const [routine, setRoutine] = React.useState("am");

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="font-semibold">{mockData.problems.title}</h3>
            <p className="text-sm text-muted-foreground">
              {mockData.problems.description}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">{mockData.solution.title}</h3>
            <p className="text-sm text-muted-foreground">
              {mockData.solution.description}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">{mockData.expectations.title}</h3>
            <p className="text-sm text-muted-foreground">
              {mockData.expectations.description}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{mockData.ingredients.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {mockData.ingredients.description}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockData.ingredients.concerns.map((concern) => (
            <Card key={concern.name} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{concern.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Severity: {concern.severity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-500">
                    {concern.severity}
                  </p>
                  <p className="text-xs text-muted-foreground">Severity: 1-5</p>
                </div>
              </div>
              <div className="mt-4">
                <h5 className="text-sm font-semibold">KEY ACTIVES</h5>
                <div className="flex flex-wrap gap-2 mt-2">
                  {concern.actives.map((active) => (
                    <Badge key={active} variant="outline">
                      {active}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{mockData.routine.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            value={routine}
            onValueChange={setRoutine}
            className="w-full"
          >
            <ToggleGroupItem value="am">AM</ToggleGroupItem>
            <ToggleGroupItem value="pm">PM</ToggleGroupItem>
            <ToggleGroupItem value="weekly">Weekly</ToggleGroupItem>
          </ToggleGroup>
          <div className="mt-6 space-y-4">
            {routine === "am" &&
              mockData.routine.am.map((item) => (
                <Card key={item.step} className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 bg-gray-200 rounded-md h-24"></div>
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {item.step}
                      </p>
                      <h4 className="font-semibold">{item.product}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.actives.map((active) => (
                          <Badge key={active} variant="secondary">
                            {active}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h5 className="font-semibold">How to Use</h5>
                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                      {item.howToUse.map((instruction) => (
                        <li key={instruction}>{instruction}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>
      <Button variant="outline" className="w-full">
        Additional skincare information
      </Button>
    </div>
  );
}
