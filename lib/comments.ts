import { supabase } from "@/lib/supabase";

export async function createComment({
  questionId,
  answerId,
  content,
  userId,
  authorName,
}: {
  questionId?: string | null;
  answerId?: string | null;
  content: string;
  userId?: string | null;
  authorName?: string | null;
}) {
  if (!questionId && !answerId) {
    throw new Error("Comment must belong to either a question or an answer");
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      question_id: questionId || null,
      answer_id: answerId || null,
      content,
      user_id: userId || null,
      author: authorName || "Anonymous",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateComment({
  commentId,
  content,
  userId,
}: {
  commentId: string;
  content: string;
  userId: string;
}) {
  const { data, error } = await supabase
    .from("comments")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteComment({
  commentId,
  userId,
}: {
  commentId: string;
  userId: string;
}) {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return true;
}
