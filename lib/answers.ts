import { supabase } from "@/lib/supabase";

export async function createAnswer({
  questionId,
  content,
  userId,
  authorName,
}: {
  questionId: string;
  content: string;
  userId?: string | null;
  authorName?: string | null;
}) {
  const { data, error } = await supabase
    .from("answers")
    .insert({
      question_id: questionId,
      content,
      user_id: userId || null,
      author: authorName || "Anonymous",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Recalculate reputation if user_id present
  if (userId) {
    await supabase.rpc("update_user_reputation", { target_user_id: userId });
  }

  return data;
}

export async function updateAnswer({
  answerId,
  content,
  userId,
}: {
  answerId: string;
  content: string;
  userId: string;
}) {
  const { data, error } = await supabase
    .from("answers")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", answerId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAnswer({
  answerId,
  userId,
}: {
  answerId: string;
  userId: string;
}) {
  const { error } = await supabase
    .from("answers")
    .delete()
    .eq("id", answerId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return true;
}

export async function toggleAcceptAnswer({
  questionId,
  answerId,
  userId,
}: {
  questionId: string;
  answerId: string;
  userId: string;
}) {
  // 1. Verify that userId is the owner of the question
  const { data: q, error: qErr } = await supabase
    .from("questions")
    .select("user_id")
    .eq("id", questionId)
    .single();

  if (qErr || !q) throw new Error("Question not found");
  if (q.user_id !== userId) {
    throw new Error("Only the question author can accept an answer");
  }

  // 2. Check current accepted status of answerId
  const { data: targetAnswer } = await supabase
    .from("answers")
    .select("is_accepted, user_id")
    .eq("id", answerId)
    .single();

  const isCurrentlyAccepted = targetAnswer?.is_accepted ?? false;

  // 3. Un-accept all answers for this question
  await supabase
    .from("answers")
    .update({ is_accepted: false })
    .eq("question_id", questionId);

  // 4. If it was not accepted, mark it as accepted
  let updatedAnswer = null;
  if (!isCurrentlyAccepted) {
    const { data } = await supabase
      .from("answers")
      .update({ is_accepted: true })
      .eq("id", answerId)
      .select()
      .single();
    updatedAnswer = data;
  }

  // 5. Update reputation for the answer owner
  if (targetAnswer?.user_id) {
    await supabase.rpc("update_user_reputation", { target_user_id: targetAnswer.user_id });
  }

  return { accepted: !isCurrentlyAccepted, answer: updatedAnswer };
}

export async function voteAnswer({
  answerId,
  voterId,
  userId,
}: {
  answerId: string;
  voterId: string;
  userId?: string | null;
}) {
  const { error } = await supabase.from("answer_votes").insert({
    answer_id: answerId,
    voter_id: voterId,
    user_id: userId || null,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Already voted on this answer");
    }
    throw new Error(error.message);
  }

  // Find answer author to update reputation
  const { data: ans } = await supabase
    .from("answers")
    .select("user_id")
    .eq("id", answerId)
    .single();

  if (ans?.user_id) {
    await supabase.rpc("update_user_reputation", { target_user_id: ans.user_id });
  }

  return true;
}
