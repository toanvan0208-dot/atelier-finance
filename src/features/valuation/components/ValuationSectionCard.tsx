import type { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui";

type ValuationSectionCardProps = {
  title: string;
  description?: string;
  icon?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function ValuationSectionCard({
  action,
  children,
  description,
  icon,
  title,
}: ValuationSectionCardProps) {
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
