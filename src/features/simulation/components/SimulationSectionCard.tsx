import type { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui";

type SimulationSectionCardProps = {
  title: string;
  description?: string;
  icon?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function SimulationSectionCard({
  action,
  children,
  description,
  icon,
  title,
}: SimulationSectionCardProps) {
  return (
    <Card>
      <CardHeader
        action={action}
        description={description}
        icon={icon}
        title={title}
      />
      <CardBody>{children}</CardBody>
    </Card>
  );
}
