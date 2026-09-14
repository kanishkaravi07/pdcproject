import { createAnswer } from "@/lib/answers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionId } = await params;
    const { content, userId, authorName } = await req.json();

    if (!content || !content.trim()) {
      return Response.json({ error: "Answer content cannot be empty" }, { status: 400 });
    }

    const answer = await createAnswer({
      questionId,
      content: content.trim(),
      userId,
      authorName,
    });

    return Response.json(answer);
  } catch (err: any) {
    return Response.json({ error: err.message || "Failed to create answer" }, { status: 500 });
  }
}
