import { supabase } from "@/lib/supabase";

export type PollOptionItem = {
  id: string;
  poll_id: string;
  option_text: string;
  votes_count: number;
  percentage: number;
};

export type PollItem = {
  id: string;
  user_id: string | null;
  question: string;
  author: string | null;
  created_at: string;
  expires_at: string | null;
  options: PollOptionItem[];
  total_votes: number;
};

export async function getPolls(): Promise<PollItem[]> {
  // Query only columns guaranteed to exist
  const { data: pollsData, error: pollsError } = await supabase
    .from("polls")
    .select(`
      id,
      question,
      created_at,
      poll_options(
        id,
        poll_id,
        option_text,
        poll_votes(count)
      )
    `)
    .order("created_at", { ascending: false });

  if (pollsError || !pollsData) {
    console.error("Error fetching polls:", pollsError?.message);
    return [];
  }

  return pollsData.map((poll: any) => {
    let totalVotes = 0;
    const options: PollOptionItem[] = (poll.poll_options ?? []).map((opt: any) => {
      const votesCount = opt.poll_votes?.[0]?.count ?? 0;
      totalVotes += votesCount;
      return {
        id: opt.id,
        poll_id: opt.poll_id,
        option_text: opt.option_text,
        votes_count: votesCount,
        percentage: 0,
      };
    });

    options.forEach((opt) => {
      opt.percentage = totalVotes > 0 ? Math.round((opt.votes_count / totalVotes) * 100) : 0;
    });

    return {
      id: poll.id,
      user_id: poll.user_id ?? null,
      question: poll.question,
      author: poll.author ?? "Community Member",
      created_at: poll.created_at || new Date().toISOString(),
      expires_at: null,
      options,
      total_votes: totalVotes,
    };
  });
}

export async function createPoll({
  question,
  options,
  userId,
  authorName,
}: {
  question: string;
  options: string[];
  userId?: string | null;
  authorName?: string | null;
}) {
  const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
  if (cleanOptions.length < 2) {
    throw new Error("A poll must have at least 2 options");
  }

  const insertData: any = {
    question,
    author: authorName || "Anonymous",
  };
  if (userId) {
    insertData.user_id = userId;
  }

  const { data: poll, error: pollErr } = await supabase
    .from("polls")
    .insert(insertData)
    .select()
    .single();

  if (pollErr || !poll) throw new Error(pollErr?.message || "Failed to create poll");

  const optionRows = cleanOptions.map((opt) => ({
    poll_id: poll.id,
    option_text: opt,
  }));

  const { error: optErr } = await supabase.from("poll_options").insert(optionRows);

  if (optErr) throw new Error(optErr.message);

  return poll;
}

export async function votePoll({
  pollId,
  optionId,
  voterId,
  userId,
}: {
  pollId: string;
  optionId: string;
  voterId: string;
  userId?: string | null;
}) {
  const voteData: any = {
    poll_id: pollId,
    option_id: optionId,
    voter_id: voterId,
  };
  if (userId) {
    voteData.user_id = userId;
  }

  const { error } = await supabase.from("poll_votes").insert(voteData);

  if (error) {
    if (error.code === "23505") {
      throw new Error("You have already voted in this poll");
    }
    throw new Error(error.message);
  }

  return true;
}
