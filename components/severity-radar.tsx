"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { useEffect, useState, useRef } from "react";

interface SeverityRadarProps {
  radarData: {
    axis_order: string[];
    values_1_5: number[];
  };
}

export function SeverityRadar({ radarData }: SeverityRadarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const centerRef = useRef({ cx: 0, cy: 0 });

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const renderPolarAngleAxis = ({ payload, x, y, cx, cy, ...rest }: any) => {
    // Capture center coordinates
    if (cx && cy) {
      centerRef.current = { cx, cy };
    }

    const fontSize = isMobile ? 10 : 12;
    const yOffset = (y - cy) / 16;
    const xOffset = (x - cx) / 16;

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

  const renderCustomLabel = (props: any) => {
    const { x, y, value } = props;
    // Try to get cx/cy from props, fallback to ref
    const cx = props.cx || centerRef.current.cx;
    const cy = props.cy || centerRef.current.cy;

    let finalX = x;
    let finalY = y;

    if (cx && cy) {
      // Calculate direction vector from center
      const dx = x - cx;
      const dy = y - cy;

      // Calculate angle
      const angle = Math.atan2(dy, dx);

      // Offset distance (push out by 15px)
      const offset = 15;

      finalX = x + Math.cos(angle) * offset;
      finalY = y + Math.sin(angle) * offset;
    }

    return (
      <text
        x={finalX}
        y={finalY}
        dy={4} // Center vertically roughly
        fontSize={11}
        fontWeight={600}
        textAnchor="middle"
        fill="#4A4238" // Darker brown for contrast
        stroke="#F2F0E9" // Light background color stroke for readability (halo)
        strokeWidth={3}
        paintOrder="stroke"
      >
        {value}
      </text>
    );
  };

  const chartData = radarData.axis_order.map((axis, index) => ({
    name: axis.charAt(0).toUpperCase() + axis.slice(1),
    score: radarData.values_1_5[index],
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart
        cx="50%"
        cy="50%"
        outerRadius="80%"
        data={chartData}
        className="pointer-events-none"
        margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
      >
        <PolarGrid gridType="polygon" className="severity-radar-grid" />
        <PolarAngleAxis dataKey="name" tick={renderPolarAngleAxis} />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 5]}
          ticks={[1, 2, 3, 4, 5] as any}
          tick={false}
          axisLine={false}
        />
        <Radar
          name="Severity"
          dataKey="score"
          stroke="#E6C8C0"
          strokeWidth={1}
          fill="#B07669"
          fillOpacity={0.6}
          label={renderCustomLabel}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
