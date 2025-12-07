import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface IngredientCardProps {
  name: string;
  imageUrl: string;
  tags: string[];
  description: string;
  className?: string;
}

export function IngredientCard({ name, imageUrl, tags, description, className }: IngredientCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="w-18 flex-shrink-0">
            <img src={imageUrl} alt={name} className="w-full h-auto object-contain" />
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-bold text-foreground">{name}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  className="bg-brand text-white hover:bg-brand-hover rounded-md px-3 py-1"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4">{description}</p>
      </CardContent>
    </Card>
  );
}
