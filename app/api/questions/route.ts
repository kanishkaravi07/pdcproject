import { supabase } from "@/lib/supabase";
import { getQuestionsPage, searchQuestions } from "@/lib/questions";

const DEFAULT_PAGE_SIZE = 10;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const tab = (searchParams.get("tab") as any) || "all";
  const limit = Number(searchParams.get("limit") ?? DEFAULT_PAGE_SIZE);
  const offset = Number(searchParams.get("offset") ?? 0);

  if (q) {
    const questions = await searchQuestions(q, limit);
    return Response.json({ questions, hasMore: false });
  }

  const { questions, hasMore } = await getQuestionsPage(offset, limit, tab);
  return Response.json({ questions, hasMore });
}

export async function POST(req: Request) {
  try {
    const { body, author, userId } = await req.json();

    if (!body || !body.trim()) {
      return Response.json({ error: "Question body is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("questions")
      .insert({
        body: body.trim(),
        author: author || "Anonymous",
        user_id: userId || null,
        last_activity_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    if (userId) {
      await supabase.rpc("update_user_reputation", { target_user_id: userId });
    }

    return Response.json(data);
  } catch (err: any) {
    return Response.json({ error: err.message || "Failed to post question" }, { status: 500 });
  }
}
