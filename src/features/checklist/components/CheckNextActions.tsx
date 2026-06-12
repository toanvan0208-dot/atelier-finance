import { Button, Card, CardBody, CardHeader } from "@/components/ui";

type CheckNextActionsProps = {
  onNavigate: (key: string) => void;
};

export function CheckNextActions({ onNavigate }: CheckNextActionsProps) {
  return (
    <Card>
      <CardHeader title="Bước tiếp theo" description="Chọn bước học hoặc kiểm chứng gần nhất." />
      <CardBody className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => onNavigate("learning")}>Quay lại học tập</Button>
        <Button variant="secondary" onClick={() => onNavigate("financials")}>Kiểm tra BCTC</Button>
        <Button variant="secondary" onClick={() => onNavigate("risk")}>Kiểm tra rủi ro</Button>
      </CardBody>
    </Card>
  );
}
