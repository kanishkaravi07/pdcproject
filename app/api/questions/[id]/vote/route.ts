import { supabase } from "@/lib/supabase";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: questionId } = await params;
  const { voterId, userId } = await req.json();

  if (!voterId && !userId) {
    return Response.json({ error: "voterId or userId is required" }, { status: 400 });
  }

  const effVoterId = voterId || userId;

  const { error } = await supabase
    .from("votes")
    .insert({
      question_id: questionId,
      voter_id: effVoterId,
      user_id: userId || null,
    });

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "already voted" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Update question author's reputation
  const { data: q } = await supabase
    .from("questions")
    .select("user_id")
    .eq("id", questionId)
    .single();

  if (q?.user_id) {
    await supabase.rpc("update_user_reputation", { target_user_id: q.user_id });
  }

  return Response.json({ ok: true });
}
