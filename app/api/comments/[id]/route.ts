import { updateComment, deleteComment } from "@/lib/comments";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    const { content, userId } = await req.json();

    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!content || !content.trim()) {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    const updated = await updateComment({ commentId, content: content.trim(), userId });
    return Response.json(updated);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    const { userId } = await req.json();

    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await deleteComment({ commentId, userId });
    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
