import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { formatLapDelta, formatCarName } from "@/lib/utils";

export default function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showFullStandings, setShowFullStandings] = useState(false);

  // Mock data - in a real app, this would come from an API
  const challengeData: Record<string, any> = {
    ch1: {
      title: "Monza Speed Challenge",
      game: "F1 24",
      track: "Monza",
      car: "Ferrari SF-24",
      fastestLap: "1:20.123",
      targetTime: "1:20.000",
      participants: 342,
      status: "Live",
      timeRemaining: "6h 24m remaining",
      yourPosition: 18,
      yourLap: "1:21.456",
      description:
        "Race the legendary Monza circuit in Ferrari. Can you beat the current fastest lap record?",
      rules: [
        "Single lap qualifying session",
        "Clean racing required (no collisions)",
        "Stock setup - no tuning allowed",
        "Fuel consumption: realistic",
        "Damage: off",
      ],
    },
    ch2: {
      title: "Silverstone Qualifier",
      game: "F1 24",
      track: "Silverstone",
      car: "Mercedes W15",
      fastestLap: "1:26.789",
      targetTime: "1:26.500",
      participants: 267,
      status: "Live",
      timeRemaining: "2h 15m remaining",
      yourPosition: 12,
      yourLap: "1:27.234",
      description:
        "British Grand Prix qualifier at Silverstone. Top 10 advance to the race event.",
      rules: [
        "Single lap qualifying",
        "Clean racing required",
        "Stock setup",
        "Full fuel and tires",
        "No assists",
      ],
    },
    ch3: {
      title: "Spa-Francorchamps Endurance",
      game: "iRacing",
      track: "Spa",
      car: "LMP2",
      fastestLap: "2:01.567",
      targetTime: "2:02.000",
      participants: 189,
      status: "Upcoming",
      timeRemaining: "2d 4h until start",
      yourPosition: undefined,
      yourLap: undefined,
      description:
        "Multi-lap endurance challenge at the legendary Belgian circuit. Build your consistency over multiple laps.",
      rules: [
        "Multiple lap session (5 laps)",
        "Fuel consumption: realistic",
        "Tire degradation: realistic",
        "Clean racing required",
        "Top 5 fastest average lap times qualify",
      ],
    },
    ch4: {
      title: "Nurburgring Sprint",
      game: "Assetto Corsa",
      track: "Nurburgring",
      car: "GT3 Class",
      fastestLap: "6:45.234",
      targetTime: "6:50.000",
      participants: 134,
      status: "Finished",
      timeRemaining: undefined,
      yourPosition: 42,
      yourLap: "7:12.456",
      description:
        "The ultimate GT3 challenge at the Nurburgring. This event is now closed for submissions.",
      rules: [
        "Single lap qualifying",
        "GT3 class vehicles only",
        "Stock setup required",
        "Penalties: realistic collisions",
        "Results locked",
      ],
    },
    t1: {
      title: "Season 3 Championship - Round 2",
      game: "F1 24",
      track: "Monaco",
      car: "F1 2024",
      fastestLap: "1:14.234",
      targetTime: "1:14.000",
      participants: 512,
      status: "Live",
      timeRemaining: "Tomorrow at 19:00 UTC",
      yourPosition: 45,
      yourLap: "1:15.123",
      description:
        "Official Season 3 Championship Round 2 at the prestigious Monaco Grand Prix.",
      rules: [
        "Official F1 2024 cars only",
        "Qualifying + Race format",
        "Full damage model enabled",
        "Dynamic weather enabled",
        "Pro drivers: qualifying required",
      ],
    },
    t2: {
      title: "iRacing Pro Series - Week 5",
      game: "iRacing",
      track: "Road America",
      car: "Indycar",
      fastestLap: "1:38.567",
      targetTime: "1:38.000",
      participants: 287,
      status: "Upcoming",
      timeRemaining: "3d until start",
      yourPosition: undefined,
      yourLap: undefined,
      description:
        "Professional iRacing series featuring open-wheel competition at Road America.",
      rules: [
        "Indycar vehicles only",
        "Qualifying required",
        "Race distance: 30 minutes",
        "SR 3000+ required",
        "Safety rating enforced",
      ],
    },
    t3: {
      title: "Assetto Corsa Cup Finals",
      game: "Assetto Corsa",
      track: "LeMans",
      car: "ORECA LMP2",
      fastestLap: "3:24.123",
      targetTime: "3:25.000",
      participants: 64,
      status: "Finished",
      timeRemaining: undefined,
      yourPosition: undefined,
      yourLap: undefined,
      description:
        "The championship finale at LeMans. Results are now official.",
      rules: [
        "LMP2 vehicles only",
        "Multi-class allowed",
        "Pit stops required (minimum 2)",
        "Fuel consumption: realistic",
        "Championship points awarded",
      ],
    },
  };

  const challenge = challengeData[id as string] || challengeData.ch1;

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Back Button */}
        <button
          onClick={() => navigate("/challenges")}
          className="flex items-center gap-2 px-4 py-2 bg-black border border-white/20 text-white hover:bg-black/80 transition-all rounded-lg mb-8 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Return
        </button>

        {/* Header */}
        <div className="mb-8">
          <div
            className={`inline-block px-3 py-1 rounded text-xs font-semibold mb-4 ${
              challenge.status === "Live"
                ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-200"
                : challenge.status === "Upcoming"
                  ? "bg-blue-500/10 border border-blue-500/20 text-blue-200"
                  : "bg-white/5 border border-white/10 text-white/50"
            }`}
          >
            {challenge.status}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {challenge.title}
          </h1>
          <p className="text-muted-foreground/70 text-sm">
            {challenge.description}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Left Column - Challenge Info */}
          <div className="md:col-span-2">
            {/* Challenge Details Card */}
            <div className="bg-card/20 backdrop-blur-lg rounded-lg border border-white/6 p-6 mb-8">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-6">
                Challenge Details
              </h2>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
                    Game
                  </p>
                  <p className="text-base text-white font-medium">
                    {challenge.game}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
                    Track
                  </p>
                  <p className="text-base text-white font-medium">
                    {challenge.track}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
                    Vehicle
                  </p>
                  <p className="text-base text-white font-medium">
                    {formatCarName(challenge.car)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
                    Target
                  </p>
                  <p className="text-base text-white font-medium">
                    {challenge.targetTime}
                  </p>
                </div>
              </div>

              <div className="border-t border-white/3 pt-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Rules
                </h3>
                <ul className="space-y-2">
                  {challenge.rules.map((rule: string, i: number) => (
                    <li
                      key={i}
                      className="text-sm text-white/70 flex items-start gap-3"
                    >
                      <span
                        className="font-bold"
                        style={{ color: "rgb(240, 28, 28)" }}
                      >
                        ✓
                      </span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Your Performance */}
          <div>
            <div className="bg-card/20 backdrop-blur-lg rounded-lg border border-white/6 p-6 sticky top-20">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-6">
                Your Performance
              </h2>

              <div className="space-y-6">
                {challenge.yourPosition ? (
                  <div className="bg-white/3 rounded-lg p-4">
                    <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
                      Position
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: "rgb(240, 28, 28)" }}
                    >
                      #{challenge.yourPosition}
                    </p>
                    <p className="text-xs text-white/60 mt-2">
                      of {challenge.participants} drivers
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/3 rounded-lg p-4">
                    <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
                      Status
                    </p>
                    <p className="text-sm text-white font-medium">
                      {challenge.status}
                    </p>
                    <p className="text-xs text-white/60 mt-2">
                      {challenge.timeRemaining}
                    </p>
                  </div>
                )}

                {challenge.yourLap && (
                  <div className="bg-white/3 rounded-lg p-4">
                    <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
                      Your Best
                    </p>
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-white">
                        {challenge.yourLap}
                      </p>
                      {parseFloat(challenge.yourLap) -
                        parseFloat(challenge.fastestLap) >
                        0 && (
                        <p className="text-xs text-white/60 mt-1">
                          +{" "}
                          {formatLapDelta(
                            (parseFloat(challenge.yourLap) -
                              parseFloat(challenge.fastestLap)) *
                              1000
                          )}
                        </p>
                      )}
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1">
                      <div
                        className="rounded-full h-1"
                        style={{
                          width: "68%",
                          backgroundColor: "rgb(240, 28, 28)",
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="bg-white/3 rounded-lg p-4">
                  <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
                    Fastest
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {challenge.fastestLap}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Standings */}
        <div className="bg-card/20 backdrop-blur-lg rounded-lg border border-white/6 p-6">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-6">
            Standings
          </h2>

          {/* Leaderboard Rows */}
          <div className="space-y-2">
            {[
              { pos: 1, name: "Jordan Park", time: "1:20.123", gap: "-" },
              {
                pos: 2,
                name: "Casey Williams",
                time: "1:20.567",
                gap: "+0.444s",
              },
              {
                pos: 3,
                name: "Sarah Mitchell",
                time: "1:20.892",
                gap: "+0.769s",
              },
              ...(showFullStandings
                ? [
                    {
                      pos: 4,
                      name: "Marcus Johnson",
                      time: "1:21.012",
                      gap: "+0.889s",
                    },
                    {
                      pos: 5,
                      name: "Emma Rodriguez",
                      time: "1:21.156",
                      gap: "+1.033s",
                    },
                    {
                      pos: 6,
                      name: "David Zhang",
                      time: "1:21.234",
                      gap: "+1.111s",
                    },
                    {
                      pos: 7,
                      name: "Lisa Anderson",
                      time: "1:21.345",
                      gap: "+1.222s",
                    },
                    {
                      pos: 8,
                      name: "Michael Brown",
                      time: "1:21.456",
                      gap: "+1.333s",
                    },
                    {
                      pos: 9,
                      name: "Sarah Taylor",
                      time: "1:21.567",
                      gap: "+1.444s",
                    },
                    {
                      pos: 10,
                      name: "James Wilson",
                      time: "1:21.678",
                      gap: "+1.555s",
                    },
                  ]
                : []),
              ...(challenge.yourPosition && challenge.yourLap
                ? [
                    {
                      pos: challenge.yourPosition,
                      name: "Alex Chen",
                      time: challenge.yourLap,
                      gap:
                        challenge.yourPosition === 1
                          ? "-"
                          : `+${formatLapDelta((parseFloat(challenge.yourLap) - parseFloat(challenge.fastestLap)) * 1000)}`,
                      highlight: true,
                    },
                  ]
                : []),
            ].map((entry) => (
              <div
                key={entry.pos}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  (entry as any).highlight ? "border" : "hover:bg-white/2"
                }`}
                style={
                  (entry as any).highlight
                    ? {
                        backgroundColor: "rgba(240, 28, 28, 0.1)",
                        borderColor: "rgba(240, 28, 28, 0.5)",
                      }
                    : {}
                }
              >
                <div className="flex items-center gap-4 flex-1">
                  <p className="text-sm font-bold text-white w-6 text-center">
                    {entry.pos}
                  </p>
                  <p className="text-sm text-white font-medium flex-1">
                    {entry.name}
                  </p>
                </div>
                <div className="flex items-center gap-8 ml-4">
                  <div className="w-24 text-right">
                    <p className="text-sm font-semibold text-white">
                      {entry.time}
                    </p>
                    <p className="text-xs text-white/60 mt-0.5">{entry.gap}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show More Button */}
          <button
            onClick={() => setShowFullStandings(!showFullStandings)}
            className="w-full mt-6 px-4 py-2.5 text-xs font-medium text-white transition-all rounded"
            style={{
              backgroundColor: "rgb(240, 28, 28)",
              borderColor: "rgb(200, 20, 20)",
              borderWidth: "1px",
            }}
          >
            {showFullStandings ? "Show Less" : "Show More"}
          </button>
        </div>
      </div>
    </div>
  );
}
