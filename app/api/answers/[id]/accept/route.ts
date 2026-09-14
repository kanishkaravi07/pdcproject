import { toggleAcceptAnswer } from "@/lib/answers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: answerId } = await params;
    const { questionId, userId } = await req.json();

    if (!userId || !questionId) {
      return Response.json({ error: "questionId and userId are required" }, { status: 400 });
    }

    const result = await toggleAcceptAnswer({ questionId, answerId, userId });
    return Response.json(result);
  } catch (err: any) {
    return Response.json({ error: err.message || "Failed to accept answer" }, { status: 400 });
  }
}
