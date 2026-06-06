import type { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui";

type FinancialsSectionCardProps = {
  title: string;
  description?: string;
  icon?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function FinancialsSectionCard({
  action,
  children,
  description,
  icon,
  title,
}: FinancialsSectionCardProps) {
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
