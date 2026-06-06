import type { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui";

type TechnicalSectionCardProps = {
  title: string;
  description?: string;
  icon?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function TechnicalSectionCard({
  action,
  children,
  description,
  icon,
  title,
}: TechnicalSectionCardProps) {
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
