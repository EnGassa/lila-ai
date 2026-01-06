import {
  Card,
  Heading,
  Text,
  Flex,
  Box
} from "@radix-ui/themes";
import {
  ChevronRight,
  Eye,
  Droplets,
  Grip,
  CircleDotDashed,
  Menu,
  SunMoon,
  SquareDashedBottom,
} from "lucide-react";

interface ConcernCardProps {
  concern: {
    name: string;
    score: number;
    description: string;
  };
  onClick: () => void;
}

const iconMap: { [key: string]: React.ElementType } = {
  "Under_eye": Eye,
  Pores: Grip,
  Wrinkles: Menu,
  Pigmentation: Droplets,
  Redness: SunMoon,
  Texture: SquareDashedBottom,
  Acne: CircleDotDashed,
};

export function ConcernCard({ concern, onClick }: ConcernCardProps) {
  const Icon = iconMap[concern.name] || Grip;

  const getSeverityColor = (score: number) => {
    if (score < 2.5) return "border-green-500 text-green-500";
    if (score < 4) return "border-yellow-500 text-yellow-500";
    return "border-red-500 text-red-500";
  };

  const severityColor = getSeverityColor(concern.score);

  return (
    <Box
      className={`cursor-pointer transition-shadow hover:shadow-md rounded-2xl`}
      style={{
        borderLeft: `4px solid ${severityColor.includes('red') ? 'var(--red-7)' : severityColor.includes('yellow') ? 'var(--amber-7)' : 'var(--green-7)'}`,
        backgroundColor: 'var(--gray-2)'
      }}
      onClick={onClick}
    >
      <Flex direction="column" gap="4" p="4">
        <Flex justify="between" align="start">
          <Flex align="center" gap="3">
            <Flex
              width="32px"
              height="32px"
              align="center"
              justify="center"
              className="rounded-full bg-[var(--gray-3)]"
            >
              <Icon className="h-4 w-4 text-[var(--gray-11)]" />
            </Flex>
            <Heading size="4" weight="medium">
              {concern.name.replace(/_/g, ' ')}
            </Heading>
          </Flex>
          <Flex direction="column" align="end">
            <Text
              size="6"
              weight="bold"
              style={{ color: severityColor.includes('red') ? 'var(--red-9)' : severityColor.includes('yellow') ? 'var(--amber-9)' : 'var(--green-9)' }}
            >
              {concern.score.toFixed(1)}
            </Text>
            <Text size="1" color="gray">Severity: 1-5</Text>
          </Flex>
        </Flex>

        <Text size="2" color="gray" weight="light" className="line-clamp-2">
          {concern.description}
        </Text>

        <Flex align="center" gap="1">
          <Text size="2" weight="bold">View Details</Text>
          <ChevronRight className="h-3 w-3" />
        </Flex>
      </Flex>
    </Box>
  );
}
