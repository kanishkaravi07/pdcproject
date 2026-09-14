import { supabase } from "@/lib/supabase";

export type QuestionItem = {
  id: string;
  body: string;
  author: string | null;
  user_id?: string | null;
  created_at?: string;
  last_activity_at?: string;
  votes: number;
  answers_count?: number;
  comments_count?: number;
  has_accepted_answer?: boolean;
};

export async function getQuestionsPage(
  offset: number = 0,
  limit: number = 10,
  tab: "all" | "trending" | "popular" | "recent" = "all"
) {
  let query = supabase
    .from("questions")
    .select(`
      id,
      body,
      author,
      user_id,
      created_at,
      last_activity_at,
      votes(count),
      answers(id, is_accepted),
      comments(count)
    `);

  if (tab === "recent") {
    query = query.order("last_activity_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // Over-fetch by 1 to check if there are more pages
  const { data, error } = await query.range(offset, offset + limit);

  if (error) {
    console.error("Error fetching questions page:", error.message);
    return { questions: [], hasMore: false };
  }

  let rows = (data ?? []).map((q: any) => {
    const votesCount = q.votes?.[0]?.count ?? 0;
    const answersList = q.answers ?? [];
    const answersCount = answersList.length;
    const commentsCount = q.comments?.[0]?.count ?? 0;
    const hasAccepted = answersList.some((a: any) => a.is_accepted);

    // Calculate Trending & Popular scores
    const hoursOld = Math.max(
      0.1,
      (Date.now() - new Date(q.created_at || Date.now()).getTime()) / (1000 * 60 * 60)
    );
    const trendingScore =
      (votesCount * 3 + answersCount * 5 + commentsCount * 2) / Math.pow(hoursOld + 2, 1.5);
    const popularScore = votesCount * 2 + answersCount * 3 + commentsCount;

    return {
      id: q.id,
      body: q.body,
      author: q.author,
      user_id: q.user_id,
      created_at: q.created_at,
      last_activity_at: q.last_activity_at,
      votes: votesCount,
      answers_count: answersCount,
      comments_count: commentsCount,
      has_accepted_answer: hasAccepted,
      trendingScore,
      popularScore,
    };
  });

  if (tab === "trending") {
    rows.sort((a, b) => b.trendingScore - a.trendingScore);
  } else if (tab === "popular") {
    rows.sort((a, b) => b.popularScore - a.popularScore);
  }

  const hasMore = rows.length > limit;
  return { questions: rows.slice(0, limit), hasMore };
}

export async function searchQuestions(q: string, limit: number = 10) {
  const { data, error } = await supabase
    .from("questions")
    .select(`
      id,
      body,
      author,
      user_id,
      created_at,
      last_activity_at,
      votes(count),
      answers(id, is_accepted),
      comments(count)
    `)
    .textSearch("body", q, { type: "websearch", config: "english" })
    .limit(limit);

  if (error) {
    console.error("Error searching questions:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    body: row.body,
    author: row.author,
    user_id: row.user_id,
    created_at: row.created_at,
    last_activity_at: row.last_activity_at,
    votes: row.votes?.[0]?.count ?? 0,
    answers_count: row.answers?.length ?? 0,
    comments_count: row.comments?.[0]?.count ?? 0,
    has_accepted_answer: row.answers?.some((a: any) => a.is_accepted) ?? false,
  }));
}

export async function getQuestionById(id: string) {
  const { data: q, error } = await supabase
    .from("questions")
    .select(`
      id,
      body,
      author,
      user_id,
      created_at,
      last_activity_at,
      votes(count),
      answers(
        id,
        question_id,
        user_id,
        author,
        content,
        is_accepted,
        created_at,
        updated_at,
        answer_votes(count),
        comments(
          id,
          user_id,
          author,
          content,
          created_at,
          updated_at
        )
      ),
      comments(
        id,
        user_id,
        author,
        content,
        created_at,
        updated_at
      )
    `)
    .eq("id", id)
    .single();

  if (error || !q) return null;

  // Process answers and sort: accepted answer first, then highest votes, then newest
  const answers = (q.answers ?? []).map((a: any) => ({
    id: a.id,
    question_id: a.question_id,
    user_id: a.user_id,
    author: a.author,
    content: a.content,
    is_accepted: a.is_accepted,
    created_at: a.created_at,
    updated_at: a.updated_at,
    votes: a.answer_votes?.[0]?.count ?? 0,
    comments: (a.comments ?? []).sort(
      (c1: any, c2: any) =>
        new Date(c1.created_at).getTime() - new Date(c2.created_at).getTime()
    ),
  }));

  answers.sort((a: any, b: any) => {
    if (a.is_accepted && !b.is_accepted) return -1;
    if (!a.is_accepted && b.is_accepted) return 1;
    return b.votes - a.votes;
  });

  const questionComments = (q.comments ?? []).sort(
    (c1: any, c2: any) =>
      new Date(c1.created_at).getTime() - new Date(c2.created_at).getTime()
  );

  return {
    id: q.id,
    body: q.body,
    author: q.author,
    user_id: q.user_id,
    created_at: q.created_at,
    last_activity_at: q.last_activity_at,
    votes: q.votes?.[0]?.count ?? 0,
    answers,
    comments: questionComments,
  };
}
