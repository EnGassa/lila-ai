import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { analysis } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

import React from "react";

export function RecommendationsSection({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList>
        <TabsTrigger
          value="overview"
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="recommendations"
        >
          Recommendations
        </TabsTrigger>
      </TabsList>
      {children}
      <TabsContent value="recommendations">
        <Card className="bg-white p-4 rounded-lg">
          <CardHeader>
            <CardTitle className="text-sm font-light text-muted-foreground">
              Product Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.concerns.map((concern) => (
              <div key={concern.name}>
                <h3 className="font-semibold text-lg">{concern.name}</h3>
                {concern.recommendations.length > 0 ? (
                  <ul className="space-y-2 mt-2">
                    {concern.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                          <span className="text-xs font-bold">✓</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {rec.product}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {rec.reason}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">
                    No recommendations for this concern.
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
