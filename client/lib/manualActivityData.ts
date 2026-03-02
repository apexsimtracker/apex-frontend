/**
 * Manual Activity Data Configuration
 * 
 * Static configuration for manual activity creation form.
 * Provides sim-specific track and car options.
 */

export type ManualActivitySim = "IRACING" | "F1_25";

export interface SimOption {
  value: ManualActivitySim;
  label: string;
}

export interface TrackOption {
  id: string;
  name: string;
}

export interface CarOption {
  id: string;
  name: string;
}

export const MANUAL_ACTIVITY_SIMS: SimOption[] = [
  { value: "IRACING", label: "iRacing" },
  { value: "F1_25", label: "F1 25" },
];

const IRACING_TRACKS: TrackOption[] = [
  { id: "spa", name: "Circuit de Spa-Francorchamps" },
  { id: "monza", name: "Autodromo Nazionale Monza" },
  { id: "suzuka", name: "Suzuka International Racing Course" },
  { id: "silverstone", name: "Silverstone Circuit" },
  { id: "laguna_seca", name: "WeatherTech Raceway Laguna Seca" },
  { id: "nurburgring_gp", name: "Nürburgring Grand Prix" },
  { id: "nurburgring_nordschleife", name: "Nürburgring Nordschleife" },
  { id: "watkins_glen", name: "Watkins Glen International" },
  { id: "road_america", name: "Road America" },
  { id: "daytona", name: "Daytona International Speedway" },
  { id: "imola", name: "Autodromo Enzo e Dino Ferrari (Imola)" },
  { id: "brands_hatch", name: "Brands Hatch" },
];

const F1_25_TRACKS: TrackOption[] = [
  { id: "bahrain", name: "Bahrain International Circuit" },
  { id: "jeddah", name: "Jeddah Corniche Circuit" },
  { id: "albert_park", name: "Albert Park Circuit" },
  { id: "suzuka", name: "Suzuka International Racing Course" },
  { id: "shanghai", name: "Shanghai International Circuit" },
  { id: "miami", name: "Miami International Autodrome" },
  { id: "imola", name: "Autodromo Enzo e Dino Ferrari (Imola)" },
  { id: "monaco", name: "Circuit de Monaco" },
  { id: "montreal", name: "Circuit Gilles Villeneuve" },
  { id: "barcelona", name: "Circuit de Barcelona-Catalunya" },
  { id: "spielberg", name: "Red Bull Ring" },
  { id: "silverstone", name: "Silverstone Circuit" },
  { id: "hungaroring", name: "Hungaroring" },
  { id: "spa", name: "Circuit de Spa-Francorchamps" },
  { id: "zandvoort", name: "Circuit Zandvoort" },
  { id: "monza", name: "Autodromo Nazionale Monza" },
  { id: "baku", name: "Baku City Circuit" },
  { id: "singapore", name: "Marina Bay Street Circuit" },
  { id: "austin", name: "Circuit of the Americas" },
  { id: "mexico", name: "Autódromo Hermanos Rodríguez" },
  { id: "interlagos", name: "Autódromo José Carlos Pace (Interlagos)" },
  { id: "las_vegas", name: "Las Vegas Street Circuit" },
  { id: "lusail", name: "Lusail International Circuit" },
  { id: "yas_marina", name: "Yas Marina Circuit" },
];

const IRACING_CARS: CarOption[] = [
  { id: "mx5_cup", name: "Mazda MX-5 Cup" },
  { id: "porsche_cup", name: "Porsche 911 GT3 Cup (992)" },
  { id: "ferrari_gt3", name: "Ferrari 296 GT3" },
  { id: "bmw_gt3", name: "BMW M4 GT3" },
  { id: "mercedes_gt3", name: "Mercedes-AMG GT3" },
  { id: "audi_gt3", name: "Audi R8 LMS GT3 evo II" },
  { id: "corvette_gt3", name: "Chevrolet Corvette Z06 GT3.R" },
  { id: "lmp2", name: "Dallara P217 LMP2" },
  { id: "hypercar", name: "Porsche 963 GTP" },
  { id: "f4", name: "Formula Vee" },
  { id: "ir04", name: "iR-04" },
  { id: "w12", name: "Mercedes-AMG W12" },
  { id: "w13", name: "Mercedes-AMG W13" },
];

const F1_25_CARS: CarOption[] = [
  { id: "f1_car", name: "F1 Car" },
  { id: "f2_car", name: "F2 Car" },
  { id: "f1_classic", name: "F1 Classic Car" },
];

const TRACKS_BY_SIM: Record<ManualActivitySim, TrackOption[]> = {
  IRACING: IRACING_TRACKS,
  F1_25: F1_25_TRACKS,
};

const CARS_BY_SIM: Record<ManualActivitySim, CarOption[]> = {
  IRACING: IRACING_CARS,
  F1_25: F1_25_CARS,
};

export function getTracksForSim(sim: ManualActivitySim | null): TrackOption[] {
  if (!sim) return [];
  return TRACKS_BY_SIM[sim] ?? [];
}

export function getCarsForSim(sim: ManualActivitySim | null): CarOption[] {
  if (!sim) return [];
  return CARS_BY_SIM[sim] ?? [];
}
