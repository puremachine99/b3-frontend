"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Props {
  total: number;
  poweredOn: number;
  errors: number;
  groups: number;
}

export const DeviceStatsCards = ({ total, poweredOn, errors, groups }: Props) => {
  const metrics = [
    { label: "Total Devices", value: total },
    { label: "Power On", value: poweredOn },
    { label: "Alerts", value: errors },
    { label: "Groups", value: groups },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((m) => (
        <Card key={m.label}>
          <CardHeader className="pb-3">
            <CardDescription className="font-medium text-muted-foreground">
              {m.label}
            </CardDescription>

            <CardTitle className="text-3xl font-bold tabular-nums">
              {m.value}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};
