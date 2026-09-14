import { updateAnswer, deleteAnswer } from "@/lib/answers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: answerId } = await params;
    const { content, userId } = await req.json();

    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!content || !content.trim()) {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    const updated = await updateAnswer({ answerId, content: content.trim(), userId });
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
    const { id: answerId } = await params;
    const { userId } = await req.json();

    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await deleteAnswer({ answerId, userId });
    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
