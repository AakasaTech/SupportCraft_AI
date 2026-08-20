"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { createTicket } from "@/features/tickets/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Customer, Profile, Department, TicketTemplate } from "@/lib/generated/prisma/client";

interface Props {
  customers:   Pick<Customer, "id" | "name" | "email" | "company">[];
  agents:      Pick<Profile, "id" | "fullName">[];
  departments: Pick<Department, "id" | "name">[];
  templates:   Pick<TicketTemplate, "id" | "name" | "subject" | "body" | "priority" | "category" | "department" | "tags">[];
}

export function NewTicketForm({ customers, agents, departments, templates }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");

  // Apply template
  const applyTemplate = (templateId: string) => {
    const t = templates.find((t) => t.id === templateId);
    if (!t) return;
    setTitle(t.subject);
    setDescription(t.body);
    setPriority(t.priority);
    if (t.category)   setCategory(t.category);
    if (t.department) setDepartment(t.department);
    if (t.tags?.length) setTags(t.tags);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("tags", tags.join(","));
    // Radix Select.Item can't use value="" for the "none" options below, so
    // they use the "none" sentinel instead — translate back to empty here so
    // createTicket's `formData.get(...) || undefined` parsing is unaffected.
    for (const field of ["customerId", "assigneeId", "department"]) {
      if (fd.get(field) === "none") fd.set(field, "");
    }

    startTransition(async () => {
      const result = await createTicket(fd);
      if (result?.error) {
        setError(result.error);
      } else if (result?.ticketId) {
        router.push(`/tickets/${result.ticketId}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-xl bg-destructive-subtle text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      {/* Template picker */}
      {templates.length > 0 && (
        <div>
          <Label className="text-xs">Start from a template (optional)</Label>
          <Select onValueChange={applyTemplate}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Choose a template…" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Subject */}
      <div>
        <Label htmlFor="title">Subject <span className="text-destructive">*</span></Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief description of the issue…"
          required
          className="mt-1.5"
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide details about the issue…"
          required
          rows={5}
          className="mt-1.5 resize-y"
        />
      </div>

      {/* Priority / Source row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" value={priority} onValueChange={setPriority}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="source">Source</Label>
          <Select name="source" defaultValue="manual">
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="portal">Portal</SelectItem>
              <SelectItem value="chat">Chat</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="api">API</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category / Department row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Billing, Bug"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          {departments.length > 0 ? (
            <Select name="department" value={department} onValueChange={setDepartment}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              name="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Support"
              className="mt-1.5"
            />
          )}
        </div>
      </div>

      {/* Customer / Assignee row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Customer</Label>
          <Select name="customerId">
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No customer</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}{c.company ? ` (${c.company})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Assign to</Label>
          <Select name="assigneeId">
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label>Tags</Label>
        <div className="flex gap-2 mt-1.5">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder="Add a tag…"
            className="flex-1"
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag}>
            <Plus size={13} />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 text-xs bg-primary-subtle text-primary px-2 py-1 rounded-full">
                {tag}
                <button type="button" onClick={() => setTags((t) => t.filter((x) => x !== tag))}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="sc-btn-primary px-6">
          {isPending ? <><Loader2 size={14} className="animate-spin mr-2" />Creating…</> : "Create Ticket"}
        </Button>
      </div>
    </form>
  );
}
