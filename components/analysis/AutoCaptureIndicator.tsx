interface AutoCaptureIndicatorProps {
  progress: number; // A value from 0 to 1
}

export default function AutoCaptureIndicator({ progress }: AutoCaptureIndicatorProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - progress * circumference;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        className="transform -scale-x-100"
      >
        <circle
          stroke="rgba(255, 255, 255, 0.3)"
          fill="transparent"
          strokeWidth="8"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          stroke="#34D399" // A green color
          fill="transparent"
          strokeWidth="8"
          strokeLinecap="round"
          r={radius}
          cx="60"
          cy="60"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeOffset,
            transition: "stroke-dashoffset 0.1s linear",
          }}
        />
        <text
          x="-50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          fill="white"
          fontSize="20"
          fontWeight="bold"
          transform="scale(-1, 1)"
        >
          Hold
        </text>
      </svg>
    </div>
  );
}
