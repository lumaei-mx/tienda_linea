// src/lib/agentmail.ts
// Cliente mínimo para AgentMail (https://api.agentmail.to/v0).
// Soporte autónomo: recibe correos de clientes y responde dentro de política.
// No-op si no hay credenciales (no rompe build ni flujo).

const BASE = "https://api.agentmail.to/v0";

export function isAgentMailConfigured(): boolean {
  return Boolean(process.env.AGENTMAIL_API_KEY && process.env.AGENTMAIL_INBOX);
}

export interface AgentMailMessage {
  message_id?: string;
  id?: string;
  from_?: string;
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  body?: string;
  timestamp?: string;
}

export interface AgentMailThread {
  thread_id: string;
  last_message_id: string;
  subject?: string;
  senders: string[];
  labels: string[];
  timestamp: string;
  preview?: string;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.AGENTMAIL_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function listThreads(opts: {
  after?: string;
  labels?: string[];
  limit?: number;
} = {}): Promise<AgentMailThread[]> {
  const inbox = process.env.AGENTMAIL_INBOX!;
  const params = new URLSearchParams();
  if (opts.after) params.set("after", opts.after);
  if (opts.limit) params.set("limit", String(opts.limit));
  (opts.labels ?? []).forEach((l) => params.append("labels", l));
  const res = await fetch(
    `${BASE}/inboxes/${encodeURIComponent(inbox)}/threads?${params.toString()}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`AgentMail listThreads ${res.status}`);
  const data = (await res.json()) as { threads?: AgentMailThread[] };
  return data.threads ?? [];
}

export async function getThreadMessages(threadId: string): Promise<AgentMailMessage[]> {
  const inbox = process.env.AGENTMAIL_INBOX!;
  const res = await fetch(
    `${BASE}/inboxes/${encodeURIComponent(inbox)}/threads/${encodeURIComponent(threadId)}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`AgentMail getThread ${res.status}`);
  const data = (await res.json()) as { messages?: AgentMailMessage[] };
  return data.messages ?? [];
}

export async function replyToMessage(messageId: string, text: string): Promise<void> {
  const inbox = process.env.AGENTMAIL_INBOX!;
  const res = await fetch(
    `${BASE}/inboxes/${encodeURIComponent(inbox)}/messages/reply`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ message_id: messageId, text }),
    }
  );
  if (!res.ok) throw new Error(`AgentMail reply ${res.status}`);
}
