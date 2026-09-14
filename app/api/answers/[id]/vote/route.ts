import { voteAnswer } from "@/lib/answers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: answerId } = await params;
    const { voterId, userId } = await req.json();

    const effVoterId = voterId || userId;
    if (!effVoterId) {
      return Response.json({ error: "voterId or userId required" }, { status: 400 });
    }

    await voteAnswer({ answerId, voterId: effVoterId, userId });
    return Response.json({ ok: true });
  } catch (err: any) {
    if (err.message.includes("Already voted")) {
      return Response.json({ error: "already voted" }, { status: 409 });
    }
    return Response.json({ error: err.message }, { status: 500 });
  }
}
