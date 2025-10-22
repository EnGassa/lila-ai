import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
      </TabsList>
      {children}
    </Tabs>
  );
}
