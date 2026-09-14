import { getPolls, createPoll } from "@/lib/polls";

export async function GET() {
  const polls = await getPolls();
  return Response.json(polls);
}

export async function POST(req: Request) {
  try {
    const { question, options, author, userId } = await req.json();

    if (!question || !question.trim()) {
      return Response.json({ error: "Poll question is required" }, { status: 400 });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return Response.json({ error: "At least 2 poll options are required" }, { status: 400 });
    }

    const poll = await createPoll({
      question: question.trim(),
      options,
      authorName: author,
      userId,
    });

    return Response.json(poll);
  } catch (err: any) {
    return Response.json({ error: err.message || "Failed to create poll" }, { status: 500 });
  }
}