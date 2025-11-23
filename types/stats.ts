export interface ChartDataPoint {
  x: string;
  y: string | number;
}

export interface HeatmapDataPoint {
  day: number; // 0-6 (Sunday to Saturday)
  hour: number; // 0-23
  value: number;
}

export interface SeriesProgress {
  title: string;
  read: number;
  total: number;
  percentage: number;
}

export interface StatsOverview {
  totalFollowed: number;
  totalChaptersRead: number;
  totalVolumesRead: number;
  completedCount: number;
  readingCount: number;
  avgScoreCompleted: number;
}

export interface StatsDistributions {
  genres: ChartDataPoint[];
  types: ChartDataPoint[];
  ratings: ChartDataPoint[];
}

export interface StatsActivity {
  chaptersReadHistory: ChartDataPoint[];
}

export interface StatsPreferences {
  heatmap: HeatmapDataPoint[];
}

export interface StatsSeries {
  distribution: ChartDataPoint[];
  currentProgress: SeriesProgress[];
}

export interface StatsFunnel {
  planToReadingRatio: number;
  readingToCompletedRatio: number;
  counts: {
    reading: number;
    completed: number;
    on_hold: number;
    dropped: number;
  };
}

export interface UserStats {
  overview: StatsOverview;
  distributions: StatsDistributions;
  activity: StatsActivity;
  preferences: StatsPreferences;
  series: StatsSeries;
  authors: ChartDataPoint[];
  funnel: StatsFunnel;
}

