import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  ArrowLeft,
  Clock,
  Gauge,
  Target,
  TrendingUp,
  Droplet,
} from "lucide-react";
import { formatCarName } from "@/lib/utils";

// Mock race data database
const racesDatabase: Record<string, any> = {
  "race-1": {
    date: "Jan 28, 2024",
    sim: "F1 24",
    track: "Monaco",
    car: "Ferrari SF-24",
    position: 1,
    qualiPos: 2,
    bestLap: "1:14.234",
    raceTime: "1h 45m 32.567s",
    totalLaps: 78,
    avgLapTime: "1:21.456",
    topSpeed: "280 km/h",
    lowestSpeed: "45 km/h",
    fuelUsed: "92.4 liters",
    tireWear: { front: 78, rear: 82 },
    isFastestLap: true,
    driver: "Alex Chen",
    driverAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop",
    lapTimes: [
      "1:21.567",
      "1:20.892",
      "1:20.145",
      "1:19.678",
      "1:19.234",
      "1:18.901",
      "1:18.567",
      "1:18.234",
      "1:17.901",
      "1:14.234",
      "1:19.567",
      "1:20.145",
      "1:21.234",
      "1:22.123",
      "1:21.456",
    ],
    positionHistory: [2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
  "race-2": {
    date: "Jan 26, 2024",
    sim: "iRacing",
    track: "Spa-Francorchamps",
    car: "McLaren GT",
    position: 2,
    qualiPos: 3,
    bestLap: "2:01.567",
    raceTime: "1h 52m 18.234s",
    totalLaps: 45,
    avgLapTime: "2:29.405",
    topSpeed: "320 km/h",
    lowestSpeed: "60 km/h",
    fuelUsed: "78.5 liters",
    tireWear: { front: 85, rear: 88 },
    isFastestLap: false,
    driver: "Alex Chen",
    driverAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop",
    lapTimes: [
      "2:32.145",
      "2:29.567",
      "2:28.234",
      "2:27.891",
      "2:26.567",
      "2:25.234",
      "2:24.123",
      "2:23.567",
      "2:22.891",
      "2:01.567",
      "2:25.234",
      "2:26.145",
      "2:27.234",
      "2:28.567",
      "2:29.123",
    ],
    positionHistory: [3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  },
  "race-3": {
    date: "Jan 25, 2024",
    sim: "Assetto Corsa",
    track: "Suzuka",
    car: "GT1 Nissan GT-R",
    position: 3,
    qualiPos: 4,
    bestLap: "1:32.891",
    raceTime: "1h 48m 45.123s",
    totalLaps: 67,
    avgLapTime: "1:37.821",
    topSpeed: "290 km/h",
    lowestSpeed: "50 km/h",
    fuelUsed: "85.2 liters",
    tireWear: { front: 72, rear: 75 },
    isFastestLap: true,
    driver: "Alex Chen",
    driverAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop",
    lapTimes: [
      "1:39.234",
      "1:38.567",
      "1:37.891",
      "1:37.123",
      "1:36.456",
      "1:35.789",
      "1:35.234",
      "1:34.567",
      "1:32.891",
      "1:33.567",
      "1:34.123",
      "1:35.234",
      "1:36.456",
      "1:37.234",
      "1:38.123",
    ],
    positionHistory: [4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  },
};

export default function RaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const race = racesDatabase[id!] || racesDatabase["race-1"];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        {/* Race Header */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden mb-8">
          <div className="px-6 py-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {race.track}
                </h1>
                <p className="text-muted-foreground">{race.sim}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">
                  {race.date}
                </p>
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                    race.position === 1
                      ? "bg-yellow-50 dark:bg-yellow-950/20 text-gold"
                      : race.position === 2
                        ? "bg-gray-100 dark:bg-gray-800/40 text-silver"
                        : race.position === 3
                          ? "bg-orange-50 dark:bg-orange-950/20 text-bronze"
                          : "bg-secondary text-foreground"
                  }`}
                >
                  Position: {race.position}
                </span>
              </div>
            </div>

            {/* Race Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-secondary rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                  Car
                </p>
                <p className="font-semibold text-foreground">{formatCarName(race.car)}</p>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                  Best Lap
                </p>
                <p
                  className={`font-semibold ${race.isFastestLap ? "text-purple-500 dark:text-purple-400" : "text-foreground"}`}
                >
                  {race.bestLap}
                  {race.isFastestLap && " 🏁"}
                </p>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                  Quali Position
                </p>
                <p className="font-semibold text-foreground">{race.qualiPos}</p>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                  Total Laps
                </p>
                <p className="font-semibold text-foreground">
                  {race.totalLaps}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Race Metrics */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <Gauge className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                Race Metrics
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Race Time</span>
                <span className="font-semibold text-foreground">
                  {race.raceTime}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Avg Lap Time</span>
                <span className="font-semibold text-foreground">
                  {race.avgLapTime}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Top Speed</span>
                <span className="font-semibold text-foreground">
                  {race.topSpeed}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Lowest Speed</span>
                <span className="font-semibold text-foreground">
                  {race.lowestSpeed}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground">Fuel Used</span>
                <span className="font-semibold text-foreground">
                  {race.fuelUsed}
                </span>
              </div>
            </div>
          </div>

          {/* Tire & Car Status */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <Droplet className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Tire Wear</h2>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Front Tires</span>
                  <span className="font-semibold text-foreground">
                    {race.tireWear.front}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${race.tireWear.front}%`,
                      backgroundColor: "rgb(240, 28, 28)",
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Rear Tires</span>
                  <span className="font-semibold text-foreground">
                    {race.tireWear.rear}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${race.tireWear.rear}%`,
                      backgroundColor: "rgb(240, 28, 28)",
                    }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-3">
                  Performance Analysis
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Tire degradation: Moderate</li>
                  <li>• Fuel efficiency: Good</li>
                  <li>• Consistency: Excellent</li>
                  <li>• Aggression level: Balanced</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Lap Chart */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Lap Times</h2>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {race.lapTimes.map((time, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg text-center border ${
                  time === race.bestLap
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-500"
                    : "bg-secondary border-border"
                }`}
              >
                <p className="text-xs font-bold text-muted-foreground mb-1">
                  Lap {index + 1}
                </p>
                <p className="font-bold text-foreground">{time}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-secondary rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Best lap achieved on lap{" "}
              <span className="font-bold text-foreground">10</span> with time{" "}
              <span className="font-bold text-purple-500">{race.bestLap}</span>
            </p>
          </div>
        </div>

        {/* Position History */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Race Progress</h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Started in position {race.positionHistory[0]}, finished in
              position{" "}
              <span className="font-bold text-foreground">{race.position}</span>
            </p>

            <div className="flex items-end justify-between gap-2 h-32">
              {race.positionHistory.map((pos, index) => (
                <div
                  key={index}
                  className="flex-1 relative group"
                  style={{
                    height: `${((race.totalLaps - pos + 1) / race.totalLaps) * 100}%`,
                  }}
                >
                  <div
                    className="w-full h-full rounded-lg transition-all cursor-pointer relative"
                    style={{
                      background:
                        "linear-gradient(to top, rgb(240, 28, 28), rgba(240, 28, 28, 0.6))",
                    }}
                  >
                    {index % 3 === 0 && (
                      <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold text-primary-foreground opacity-75">
                        P{pos}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-center mt-2 text-muted-foreground">
                    L{index + 1}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
