import { votePoll } from "@/lib/polls";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const { optionId, voterId, userId } = await req.json();

    const effVoterId = voterId || userId;
    if (!optionId || !effVoterId) {
      return Response.json({ error: "optionId and voterId are required" }, { status: 400 });
    }

    await votePoll({
      pollId,
      optionId,
      voterId: effVoterId,
      userId,
    });

    return Response.json({ success: true });
  } catch (err: any) {
    if (err.message.includes("already voted")) {
      return Response.json({ error: "You have already voted in this poll" }, { status: 409 });
    }
    return Response.json({ error: err.message }, { status: 500 });
  }
}
