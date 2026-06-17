import { supabase } from "@/lib/supabase";
import type { Match } from "@/lib/types";
import { notFound } from "next/navigation";
import LiveMatchView from "./LiveMatchView";

export const revalidate = 30;

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await supabase
    .from("cs2_matches")
    .select(
      "*, team1:cs2_teams!cs2_matches_team1_id_fkey(*), team2:cs2_teams!cs2_matches_team2_id_fkey(*)"
    )
    .eq("id", Number(id))
    .single();

  if (!data) notFound();

  return <LiveMatchView match={data as unknown as Match} />;
}
