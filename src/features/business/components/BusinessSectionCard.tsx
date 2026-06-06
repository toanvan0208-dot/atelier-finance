import type { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui";

type BusinessSectionCardProps = {
  title: string;
  description?: string;
  icon?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function BusinessSectionCard({
  action,
  children,
  description,
  icon,
  title,
}: BusinessSectionCardProps) {
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
