"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  cards?: number;
}

export const DeviceLoadingState = ({ cards = 6 }: Props) => {
  const placeholder = Array.from({ length: cards });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {placeholder.map((_, idx) => (
          <Card key={idx} className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-16" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </div>

            <Skeleton className="h-8 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
};
