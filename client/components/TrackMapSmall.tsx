interface TrackMapSmallProps {
  track: string;
}

export default function TrackMapSmall({ track }: TrackMapSmallProps) {
  const getTrackPath = (trackName: string) => {
    const trackPaths: Record<string, string> = {
      Monaco: "M 50 25 L 75 35 L 78 65 L 55 75 L 25 70 L 20 40 Z",
      "Le Mans": "M 35 20 L 80 25 L 82 70 L 40 80 L 18 55 Z",
      "Spa-Francorchamps": "M 40 15 L 85 40 L 78 85 L 30 75 L 20 35 Z",
      Silverstone: "M 45 18 L 80 30 L 75 75 L 40 82 L 22 50 Z",
      Monza: "M 50 20 L 85 28 L 80 72 L 42 85 L 18 50 Z",
      Suzuka: "M 48 18 L 80 42 L 72 82 L 35 78 L 22 42 Z",
      Nurburgring: "M 30 20 L 80 25 L 82 72 L 50 85 L 18 60 Z",
      Montreal: "M 42 18 L 82 32 L 80 78 L 42 85 L 20 55 Z",
    };
    return trackPaths[trackName] || "M 35 20 L 80 25 L 78 70 L 40 82 L 18 55 Z";
  };

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-16 h-16 opacity-35"
      style={{ minWidth: "64px", minHeight: "64px" }}
    >
      {/* Subtle outer circle */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        className="text-muted-foreground/30"
      />

      {/* Track outline - very thin and subtle */}
      <path
        d={getTrackPath(track)}
        fill="none"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
        stroke="rgb(240, 28, 28)"
      />

      {/* Starting grid marker */}
      <circle cx="50" cy="23" r="1.2" opacity="0.4" fill="rgb(240, 28, 28)" />
    </svg>
  );
}
