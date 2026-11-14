export type Member = {
  id: number;
  roblox_username: string;
  username_key: string;
  status: "active" | "discharged";
  rank: string | null;
  position: string | null;
  subdivision: string | null;
  level: string | null;
  timezone: string | null;
  hire_date: string | null;
  discharge_type: "honorable" | "dishonorable" | "unknown" | null;
  discharge_provisional: boolean;
  strikes_note: string | null;
  loa: boolean | null;
  source_sheet: string | null;
};

export type AdminLog = {
  id: number;
  username: string;
  username_key: string;
  subdivision: string | null;
  action: string;
  description: string | null;
  officer_name: string | null;
  effective_date: string | null;
  source_workbook: string;
};

export type Award = {
  id: number;
  name: string;
  category: "high_honor" | "medal" | "ribbon";
  sort_order: number;
};

export type AwardGrant = {
  id: number;
  award_id: number;
  username: string;
  username_key: string;
  grant_count: number;
  award_name?: string;
  award_category?: string;
};

export type HallOfFameEntry = {
  id: number;
  username: string;
  username_key: string;
  title: string | null;
  blurb: string | null;
  sort_order: number;
};

export type PastChief = {
  id: number;
  username: string;
  username_key: string;
  started_on: string | null;
  ended_on: string | null;
  notes: string | null;
  sort_order: number;
  needs_confirmation: boolean;
};

export const SUBDIVISIONS = [
  {
    slug: "general-corps",
    name: "General Corps",
    short: "GC",
    match: "General Corps",
    blurb:
      "The backbone of Security — facility patrol, containment support, and everyday operations.",
  },
  {
    slug: "combat-medics",
    name: "Combat Medic Corps",
    short: "CM",
    match: "Combat Medic",
    blurb:
      "Specialized medical operators embedded with Security for trauma response under fire.",
  },
  {
    slug: "scu",
    name: "Specialized Control Unit",
    short: "SCU",
    match: "Specialized Control Unit",
    blurb:
      "Elite control element. Roster is partially derived from administrative logs until the SCU sheet is filled.",
  },
] as const;
