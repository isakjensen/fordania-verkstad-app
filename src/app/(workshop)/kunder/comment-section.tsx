"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Send, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addComment, deleteComment } from "./actions";

interface Comment {
  id: string;
  text: string;
  authorName: string | null;
  createdAt: Date;
}

const dtf = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function initialsOf(name: string | null) {
  if (!name) return "?";
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export function CommentSection({
  customerId,
  comments,
}: {
  customerId: string;
  comments: Comment[];
}) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim()) return;
    const formData = new FormData();
    formData.set("customerId", customerId);
    formData.set("text", text);
    startTransition(async () => {
      const res = await addComment(formData);
      if (!("error" in res)) {
        setText("");
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteComment(id);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader
        tone="brand"
        title="Kommentarer"
        subtitle={`${comments.length} ${
          comments.length === 1 ? "kommentar" : "kommentarer"
        }`}
      />
      <CardBody className="space-y-4">
        {/* Ny kommentar */}
        <form onSubmit={submit} className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Skriv en kommentar om kunden…"
            rows={3}
            className="w-full resize-none rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-ink placeholder:text-muted-foreground focus:border-brand-300 focus:bg-surface focus:outline-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={pending || !text.trim()}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Lägg till
            </Button>
          </div>
        </form>

        {/* Lista */}
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="size-6 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              Inga kommentarer ännu.
            </p>
          </div>
        ) : (
          <ul className="space-y-3 border-t border-line pt-4">
            {comments.map((c) => (
              <li key={c.id} className="group flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                  {initialsOf(c.authorName)}
                </span>
                <div className="min-w-0 flex-1 rounded-lg bg-surface-muted px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">
                      {c.authorName ?? "Okänd"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {dtf.format(new Date(c.createdAt))}
                      </span>
                      <button
                        onClick={() => remove(c.id)}
                        disabled={pending}
                        className="text-muted-foreground/0 transition-colors hover:text-danger group-hover:text-muted-foreground"
                        aria-label="Ta bort kommentar"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-soft">
                    {c.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
