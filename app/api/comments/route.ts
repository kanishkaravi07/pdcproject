import { createComment } from "@/lib/comments";

export async function POST(req: Request) {
  try {
    const { questionId, answerId, content, userId, authorName } = await req.json();

    if (!content || !content.trim()) {
      return Response.json({ error: "Comment content required" }, { status: 400 });
    }

    const comment = await createComment({
      questionId,
      answerId,
      content: content.trim(),
      userId,
      authorName,
    });

    return Response.json(comment);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
