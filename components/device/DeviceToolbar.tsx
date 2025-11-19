"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { IconTerminal2, IconPlugConnected } from "@tabler/icons-react";

import type { DeviceView } from "@/types/device";

interface Props {
  view: DeviceView;
  onViewChange: (value: DeviceView) => void;
  onOpenTerminal: () => void;
  onOpenAdd: () => void;
}

export const DeviceToolbar = ({
  view,
  onViewChange,
  onOpenTerminal,
  onOpenAdd,
}: Props) => {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col gap-4 pt-4 md:flex-row md:items-center md:justify-between md:pt-6">
        
        {/* VIEW SWITCHER */}
        <Tabs
          value={view}
          onValueChange={(value) => onViewChange(value as DeviceView)}
        >
          <TabsList>
            <TabsTrigger value="grid">Card/Grid</TabsTrigger>
            <TabsTrigger value="groups">Group Panel</TabsTrigger>
            <TabsTrigger value="rows">Row/Table</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onOpenTerminal}>
            <IconTerminal2 className="size-4" />
            Terminal Mode
          </Button>

          <Button variant="outline" onClick={onOpenAdd}>
            <IconPlugConnected className="size-4" />
            Add Device
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
