#!/usr/bin/env node
/**
 * Regenerates the Cursor canvas at:
 * ~/.cursor/projects/Users-anthony-Coding-supabase-sveltekit/canvases/project-tickets-board.canvas.tsx
 * with ticket data from docs/project/tickets/*.md (excludes done/).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const TICKET_DIR = path.join(REPO, "docs/project/tickets");
const CANVAS_OUT = path.join(
	process.env.HOME ?? "",
	".cursor/projects/Users-anthony-Coding-supabase-sveltekit/canvases/project-tickets-board.canvas.tsx",
);

function parseFrontmatter(src) {
	const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!m) return { meta: {}, body: src };
	const raw = m[1];
	const body = m[2] || "";
	const meta = {};
	const lines = raw.split(/\r?\n/);
	let curKey = null;
	for (const line of lines) {
		const kv = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
		if (kv) {
			curKey = kv[1];
			const v = kv[2];
			if (v === "null") meta[curKey] = null;
			else if (v === "[]") meta[curKey] = [];
			else if (v.startsWith("[") && v.endsWith("]")) {
				const inner = v.slice(1, -1).trim();
				meta[curKey] = inner
					? inner.split(/\s*,\s*/).map((s) => s.replace(/^['"]|['"]$/g, ""))
					: [];
			} else if (v.startsWith('"') && v.endsWith('"')) meta[curKey] = JSON.parse(v);
			else meta[curKey] = v;
			continue;
		}
		const li = line.match(/^\s*-\s+(.+)$/);
		if (li && curKey) {
			let item = li[1].trim();
			if (
				(item.startsWith('"') && item.endsWith('"')) ||
				(item.startsWith("'") && item.endsWith("'"))
			)
				item = item.slice(1, -1);
			if (!Array.isArray(meta[curKey])) meta[curKey] = [];
			meta[curKey].push(item);
		}
	}
	return { meta, body };
}

function firstParagraph(body) {
	const t = body.replace(/^#[^\n]*\n/, "").trim();
	const stop = t.search(/\n##\s/);
	const head = stop >= 0 ? t.slice(0, stop) : t;
	const para = head.split(/\n\s*\n/)[0] || "";
	return para.replace(/\s+/g, " ").trim().slice(0, 280);
}

const files = fs.readdirSync(TICKET_DIR).filter((f) => f.endsWith(".md"));
const tickets = [];
for (const f of files) {
	const id = path.basename(f, ".md");
	const full = path.join(TICKET_DIR, f);
	const src = fs.readFileSync(full, "utf8");
	const { meta, body } = parseFrontmatter(src);
	if (!meta.id) meta.id = id;
	tickets.push({
		id: meta.id,
		file: `docs/project/tickets/${f}`,
		title: meta.title || id,
		status: meta.status || "unknown",
		priority: meta.priority || "",
		type: meta.type || "",
		estimate: meta.estimate || "",
		chunk: meta.chunk || "",
		assignee: meta.assignee || "",
		blocked_by: Array.isArray(meta.blocked_by) ? meta.blocked_by : [],
		plan: meta.plan,
		decision: meta.decision,
		artifacts: Array.isArray(meta.artifacts) ? meta.artifacts : [],
		created: meta.created || "",
		summary: firstParagraph(body),
	});
}
tickets.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

const dataLiteral = JSON.stringify(tickets);

const tsx = `import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Code,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Link,
  Pill,
  Row,
  Select,
  Spacer,
  Stack,
  Stat,
  Text,
  TextInput,
  mergeStyle,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type Ticket = {
  id: string;
  file: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  estimate: string;
  chunk: string;
  assignee: string;
  blocked_by: string[];
  plan: string | null;
  decision: string | null;
  artifacts: string[];
  created: string;
  summary: string;
};

const REPO = ${JSON.stringify(REPO)};

const TICKETS: Ticket[] = ${dataLiteral};

function fileUrl(rel: string): string {
  const clean = rel.startsWith("/") ? rel.slice(1) : rel;
  return "file://" + REPO + "/" + clean;
}

function stripMdBold(s: string): string {
  return s.replace(/\\*\\*/g, "");
}

function uniqSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function priorityTone(p: string): "warning" | "info" | "neutral" | "deleted" {
  if (p === "P1") return "deleted";
  if (p === "P2") return "warning";
  if (p === "P3") return "info";
  return "neutral";
}

function statusTone(s: string): "success" | "warning" | "info" | "neutral" {
  if (s === "in_progress") return "warning";
  if (s === "backlog") return "neutral";
  return "info";
}

export default function ProjectTicketsCanvas() {
  const theme = useHostTheme();
  const [query, setQuery] = useCanvasState("query", "");
  const [priority, setPriority] = useCanvasState("priority", "");
  const [type, setType] = useCanvasState("type", "");
  const [status, setStatus] = useCanvasState("status", "");
  const [chunk, setChunk] = useCanvasState("chunk", "");
  const [selectedId, setSelectedId] = useCanvasState("selectedId", "");

  const types = uniqSorted(TICKETS.map((t) => t.type));
  const statuses = uniqSorted(TICKETS.map((t) => t.status));
  const chunks = uniqSorted(TICKETS.map((t) => t.chunk));

  const q = query.trim().toLowerCase();
  const filtered = TICKETS.filter((t) => {
    if (priority && t.priority !== priority) return false;
    if (type && t.type !== type) return false;
    if (status && t.status !== status) return false;
    if (chunk && t.chunk !== chunk) return false;
    if (!q) return true;
    const hay = (
      t.id +
      " " +
      t.title.toLowerCase() +
      " " +
      t.summary.toLowerCase() +
      " " +
      t.chunk +
      " " +
      t.type +
      " " +
      t.status
    ).toLowerCase();
    return hay.includes(q);
  });

  const selected = TICKETS.find((t) => t.id === selectedId) ?? null;

  const typeOptions = [{ value: "", label: "All types" }].concat(
    types.map((v) => ({ value: v, label: v })),
  );
  const statusOptions = [{ value: "", label: "All statuses" }].concat(
    statuses.map((v) => ({ value: v, label: v.replace(/_/g, " ") })),
  );
  const chunkOptions = [{ value: "", label: "All chunks" }].concat(
    chunks.map((v) => ({ value: v, label: v || "(none)" })),
  );
  const priorityOptions = [
    { value: "", label: "All priorities" },
    { value: "P1", label: "P1" },
    { value: "P2", label: "P2" },
    { value: "P3", label: "P3" },
  ];

  return (
    <Stack gap={16} style={{ minHeight: 480 }}>
      <Stack gap={6}>
        <H1>Open project tickets</H1>
        <Text tone="secondary" size="small">
          Tickets in{" "}
          <Code>docs/project/tickets/*.md</Code> (excludes{" "}
          <Code>done/</Code>). Snapshot embedded in this canvas — run{" "}
          <Code>bun scripts/refresh-project-tickets-canvas.mjs</Code> after ticket changes.
        </Text>
      </Stack>

      <Grid columns={4} gap={12}>
        <Stat value={String(filtered.length)} label="Visible" />
        <Stat value={String(TICKETS.length)} label="Total open" />
        <Stat
          value={String(TICKETS.filter((t) => t.status === "in_progress").length)}
          label="In progress"
          tone="warning"
        />
        <Stat
          value={String(TICKETS.filter((t) => t.blocked_by.length).length)}
          label="Has blockers"
          tone="info"
        />
      </Grid>

      <Stack gap={10}>
        <TextInput
          type="search"
          value={query}
          onChange={setQuery}
          placeholder="Search id, title, summary, chunk…"
        />
        <Row gap={10} wrap>
          <Select
            value={priority}
            onChange={setPriority}
            placeholder="Priority"
            options={priorityOptions}
            style={{ minWidth: 140 }}
          />
          <Select
            value={type}
            onChange={setType}
            options={typeOptions}
            style={{ minWidth: 160 }}
          />
          <Select
            value={status}
            onChange={setStatus}
            options={statusOptions}
            style={{ minWidth: 160 }}
          />
          <Select
            value={chunk}
            onChange={setChunk}
            options={chunkOptions}
            style={{ minWidth: 200 }}
          />
          <Spacer />
          <Button
            variant="ghost"
            onClick={() => {
              setQuery("");
              setPriority("");
              setType("");
              setStatus("");
              setChunk("");
            }}
          >
            Reset filters
          </Button>
        </Row>
      </Stack>

      <Divider />

      <Grid columns="minmax(0,1fr) 320px" gap={16} align="start">
        <Stack
          gap={0}
          style={{
            border: \`1px solid \${theme.stroke.secondary}\`,
            borderRadius: 8,
            maxHeight: 520,
            overflow: "auto",
            background: theme.bg.chrome,
          }}
        >
          {filtered.length === 0 ? (
            <Text tone="secondary" style={{ padding: 16 }}>
              No tickets match the current filters.
            </Text>
          ) : (
            filtered.map((t) => {
              const active = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  style={mergeStyle(
                    {
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      border: "none",
                      borderBottom: \`1px solid \${theme.stroke.tertiary}\`,
                      background: active ? theme.fill.secondary : "transparent",
                      color: theme.text.primary,
                      cursor: "pointer",
                    },
                    { margin: 0 },
                  )}
                >
                  <Row gap={8} align="center" style={{ marginBottom: 4 }}>
                    <Text weight="semibold" as="span">
                      {t.id}
                    </Text>
                    <Pill size="sm" tone={priorityTone(t.priority)}>
                      {t.priority || "—"}
                    </Pill>
                    <Pill size="sm" tone="neutral">
                      {t.type}
                    </Pill>
                    <Pill size="sm" tone={statusTone(t.status)} active={t.status === "in_progress"}>
                      {t.status.replace(/_/g, " ")}
                    </Pill>
                    <Spacer />
                    {t.estimate ? (
                      <Text tone="quaternary" size="small" as="span">
                        {t.estimate}
                      </Text>
                    ) : null}
                  </Row>
                  <Text weight="medium" style={{ marginBottom: 4 }}>
                    {t.title}
                  </Text>
                  <Text tone="secondary" size="small" truncate>
                    {stripMdBold(t.summary)}
                  </Text>
                  {t.chunk ? (
                    <Text tone="quaternary" size="small" style={{ marginTop: 4 }} as="span">
                      Chunk: <Code>{t.chunk}</Code>
                    </Text>
                  ) : null}
                </button>
              );
            })
          )}
        </Stack>

        <Card size="base" style={{ position: "sticky", top: 0 }}>
          <CardHeader>Detail</CardHeader>
          <CardBody>
            {!selected ? (
              <Text tone="secondary">Select a ticket in the list.</Text>
            ) : (
              <Stack gap={12}>
                <Stack gap={4}>
                  <H2 style={{ fontSize: 18, margin: 0 }}>{selected.title}</H2>
                  <Row gap={6} wrap>
                    <Pill tone={priorityTone(selected.priority)}>{selected.priority}</Pill>
                    <Pill tone="neutral">{selected.type}</Pill>
                    <Pill tone={statusTone(selected.status)} active={selected.status === "in_progress"}>
                      {selected.status.replace(/_/g, " ")}
                    </Pill>
                    {selected.assignee ? (
                      <Pill tone="info">assignee: {selected.assignee}</Pill>
                    ) : null}
                  </Row>
                </Stack>
                <Text tone="secondary" size="small">
                  Created {selected.created || "—"}
                </Text>
                <Divider />
                <H3 style={{ fontSize: 14, margin: 0 }}>Summary</H3>
                <Text>{stripMdBold(selected.summary)}</Text>
                <Divider />
                <H3 style={{ fontSize: 14, margin: 0 }}>Ticket file</H3>
                <Link href={fileUrl(selected.file)}>{selected.file}</Link>
                {selected.blocked_by.length > 0 ? (
                  <Stack gap={6}>
                    <H3 style={{ fontSize: 14, margin: 0 }}>Blocked by</H3>
                    <Row gap={6} wrap>
                      {selected.blocked_by.map((b) => (
                        <Pill key={b} size="sm" tone="warning">
                          {b}
                        </Pill>
                      ))}
                    </Row>
                  </Stack>
                ) : null}
                {selected.plan ? (
                  <Stack gap={6}>
                    <H3 style={{ fontSize: 14, margin: 0 }}>Plan</H3>
                    <Link href={fileUrl(selected.plan)}>{selected.plan}</Link>
                  </Stack>
                ) : null}
                {selected.decision ? (
                  <Stack gap={6}>
                    <H3 style={{ fontSize: 14, margin: 0 }}>Decision</H3>
                    <Link href={fileUrl("docs/decisions/" + selected.decision + ".md")}>
                      docs/decisions/{selected.decision}.md
                    </Link>
                  </Stack>
                ) : null}
                {selected.artifacts.length > 0 ? (
                  <Stack gap={6}>
                    <H3 style={{ fontSize: 14, margin: 0 }}>Artifacts</H3>
                    <Stack gap={4}>
                      {selected.artifacts.map((a) => (
                        <Link key={a} href={fileUrl(a)}>
                          {a}
                        </Link>
                      ))}
                    </Stack>
                  </Stack>
                ) : null}
              </Stack>
            )}
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}
`;

fs.mkdirSync(path.dirname(CANVAS_OUT), { recursive: true });
fs.writeFileSync(CANVAS_OUT, tsx, "utf8");
console.log("Wrote", CANVAS_OUT);
