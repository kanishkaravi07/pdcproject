import { supabase } from "@/lib/supabase";

export type LeaderboardUser = {
  rank: number;
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  reputation: number;
  questions_count: number;
  answers_count: number;
};

export async function getLeaderboard(limit: number = 20): Promise<LeaderboardUser[]> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(`
      id,
      username,
      display_name,
      avatar_url,
      reputation,
      questions(count),
      answers(count)
    `)
    .order("reputation", { ascending: false })
    .limit(limit);

  if (error || !profiles) {
    console.error("Error fetching leaderboard:", error?.message);
    return [];
  }

  return profiles.map((p: any, index: number) => ({
    rank: index + 1,
    id: p.id,
    username: p.username || `user_${p.id.slice(0, 6)}`,
    display_name: p.display_name,
    avatar_url: p.avatar_url,
    reputation: p.reputation ?? 0,
    questions_count: p.questions?.[0]?.count ?? 0,
    answers_count: p.answers?.[0]?.count ?? 0,
  }));
}
