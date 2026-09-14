import { getQuestionById } from "@/lib/questions";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const question = await getQuestionById(id);

  if (!question) {
    return Response.json({ error: "Question not found" }, { status: 404 });
  }

  return Response.json(question);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await req.json();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
