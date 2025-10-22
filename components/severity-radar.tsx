"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Text,
} from "recharts";

const renderPolarAngleAxis = ({ payload, x, y, cx, cy, ...rest }: any) => {
  return (
    <Text
      {...rest}
      verticalAnchor="middle"
      y={y + (y - cy) / 10}
      x={x + (x - cx) / 10}
      className="text-sm font-medium fill-gray-500"
    >
      {payload.value}
    </Text>
  );
};

interface SeverityRadarProps {
  radarData: {
    axis_order: string[];
    values_0_100: number[];
  };
}

export function SeverityRadar({ radarData }: SeverityRadarProps) {
  const chartData = radarData.axis_order.map((axis, index) => ({
    name: axis.charAt(0).toUpperCase() + axis.slice(1),
    score: radarData.values_0_100[index],
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart
        cx="50%"
        cy="50%"
        outerRadius="80%"
        data={chartData}
      >
        <PolarGrid />
        <PolarAngleAxis dataKey="name" tick={renderPolarAngleAxis} />
        <Radar
          name="Severity"
          dataKey="score"
          stroke="#B07669"
          fill="#B07669"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
