"use client";

import {
  LabelList,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";

const renderPolarAngleAxis = ({ payload, x, y, cx, cy, ...rest }: any) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const fontSize = isMobile ? 10 : 12;
  const yOffset = (y - cy) / 9;
  const xOffset = (x - cx) / 9;

  const finalX = x + xOffset;
  const finalY = y + yOffset;

  const originalValue = payload.value.replace("_", " ");
  const words = originalValue.split(" ");
  const isLong = originalValue.length > 8;

  return (
    <g transform={`translate(${finalX}, ${finalY})`}>
      <text
        {...rest}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        className="fill-gray-500"
      >
        {isLong && words.length > 1 ? (
          <>
            <tspan x="0" dy="-0.5em">
              {words[0]}
            </tspan>
            <tspan x="0" dy="1.1em">
              {words.slice(1).join(" ")}
            </tspan>
          </>
        ) : (
          originalValue
        )}
      </text>
    </g>
  );
};

interface SeverityRadarProps {
  radarData: {
    axis_order: string[];
    values_1_5: number[];
  };
}

export function SeverityRadar({ radarData }: SeverityRadarProps) {
  const chartData = radarData.axis_order.map((axis, index) => ({
    name: axis.charAt(0).toUpperCase() + axis.slice(1),
    score: radarData.values_1_5[index],
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart
        cx="50%"
        cy="50%"
        outerRadius="80%"
        data={chartData}
        className="pointer-events-none"
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <PolarGrid />
        <PolarAngleAxis dataKey="name" tick={renderPolarAngleAxis} />
        <Radar
          name="Severity"
          dataKey="score"
          stroke="#B07669"
          fill="#B07669"
          fillOpacity={0.6}
        >
          <LabelList
            dataKey="score"
            position="top"
            offset={5}
            className="text-xs font-semibold fill-amber-900"
          />
        </Radar>
      </RadarChart>
    </ResponsiveContainer>
  );
}
