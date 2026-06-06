"use client";

import { useState } from "react";
import { Button, Card, CardBody, SectionHeader } from "@/components/ui";
import type {
  ScreeningDeepDiveData,
  ScreeningFunnelStepLabels,
} from "../types";
import { ScreeningFunnelStep } from "./ScreeningFunnelStep";

type ScreeningDeepDiveProps = {
  data: ScreeningDeepDiveData;
  stepLabels: ScreeningFunnelStepLabels;
};

export function ScreeningDeepDive({ data, stepLabels }: ScreeningDeepDiveProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section>
      <SectionHeader
        action={
          <Button
            variant={isOpen ? "secondary" : "primary"}
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? data.expandedLabel : data.collapsedLabel}
          </Button>
        }
        description={data.description}
        icon={data.icon}
        title={data.title}
      />

      {isOpen ? (
        <div className="space-y-3">
          {data.steps.map((step) => (
            <ScreeningFunnelStep
              key={`${step.step}-${step.title}`}
              labels={stepLabels}
              step={step}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardBody>
            <p className="text-sm leading-6 text-subtle">{data.description}</p>
          </CardBody>
        </Card>
      )}
    </section>
  );
}
