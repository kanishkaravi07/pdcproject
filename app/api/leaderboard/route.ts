import { getLeaderboard } from "@/lib/leaderboard";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 20);

  const leaderboard = await getLeaderboard(limit);
  return Response.json(leaderboard);
}
