"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useExplorer } from "@/context/explorer-context";
import { Button, Card, Empty, Field, Notice, Select, StatusPill, TextInput, inputClass, useTx } from "./kit";
import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

export interface FieldDef {
  key: string;
  label: [string, string];
  type: "text" | "textarea" | "number" | "select";
  required?: boolean;
  options?: { value: string; label: string }[];
  /** Loads select options from another table. */
  optionsFrom?: { table: string; label: string; filter?: (q: QueryLike) => QueryLike };
  placeholder?: string;
  hint?: [string, string];
  defaultValue?: string | (() => string);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryLike = any;

export interface ResourceConfig {
  table: string;
  title: [string, string];
  select?: string;
  order?: { column: string; ascending?: boolean };
  fields: FieldDef[];
  /** Columns shown in the list row (first is the title). */
  primary: (row: Row) => React.ReactNode;
  secondary?: (row: Row) => React.ReactNode;
  status?: (row: Row) => string | undefined;
  rowActions?: (row: Row) => React.ReactNode;
  /** Transform form values -> insert/update payload. */
  toPayload?: (values: Record<string, string>, editing: Row | null) => Row;
  fromRow?: (row: Row) => Record<string, string>;
  filter?: (q: QueryLike) => QueryLike;
  testId: string;
}

function slugify(v: string) {
  return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
export { slugify };

export function ResourceManager({ config }: { config: ResourceConfig }) {
  const tx = useTx();
  const { locale } = useExplorer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useMemo(() => createClientSupabaseClient() as unknown as SupabaseClient<any>, []);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from(config.table).select(config.select ?? "*");
    q = q.is("tenant_id", null);
    if (config.filter) q = config.filter(q);
    if (config.order) q = q.order(config.order.column, { ascending: config.order.ascending ?? true });
    const { data, error: err } = await q;
    if (err) setError(err.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, [supabase, config]);

  useEffect(() => {
    void load();
    config.fields.forEach(async (f) => {
      if (!f.optionsFrom) return;
      let q = supabase.from(f.optionsFrom.table).select(`id, ${f.optionsFrom.label}`).is("tenant_id", null);
      if (f.optionsFrom.filter) q = f.optionsFrom.filter(q);
      const { data } = await q;
      setOptions((prev) => ({
        ...prev,
        [f.key]: ((data as Row[]) ?? []).map((r) => ({ value: r.id, label: String(r[f.optionsFrom!.label]) })),
      }));
    });
  }, [load, supabase, config.fields]);

  const startCreate = () => {
    const init: Record<string, string> = {};
    config.fields.forEach((f) => {
      const d = typeof f.defaultValue === "function" ? f.defaultValue() : f.defaultValue;
      init[f.key] = d ?? (f.type === "select" ? (f.options?.[0]?.value ?? options[f.key]?.[0]?.value ?? "") : "");
    });
    setValues(init);
    setEditing(null);
    setOpen(true);
    setNotice(null);
    setError(null);
  };

  const startEdit = (row: Row) => {
    const init: Record<string, string> = config.fromRow
      ? config.fromRow(row)
      : Object.fromEntries(config.fields.map((f) => [f.key, row[f.key] == null ? "" : String(row[f.key])]));
    setValues(init);
    setEditing(row);
    setOpen(true);
    setNotice(null);
    setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = config.toPayload
      ? config.toPayload(values, editing)
      : Object.fromEntries(
          config.fields.map((f) => [f.key, f.type === "number" ? (values[f.key] === "" ? null : Number(values[f.key])) : values[f.key] || null])
        );
    const res = editing
      ? await supabase.from(config.table).update(payload).eq("id", editing.id).select()
      : await supabase.from(config.table).insert(payload).select();
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    if (!res.data || res.data.length === 0) {
      setError(tx("Not allowed.", "Không được phép."));
      return;
    }
    setOpen(false);
    setNotice(editing ? tx("Saved", "Đã lưu") : tx("Created", "Đã tạo"));
    await load();
  };

  return (
    <div className="space-y-4" data-testid={config.testId}>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-[28px] font-bold tracking-tight text-[#1D1D1F]">{tx(config.title[0], config.title[1])}</h1>
        <Button onClick={startCreate} data-testid={`${config.testId}-new`}>+ {tx("New", "Thêm")}</Button>
      </div>
      {notice ? <Notice tone="success" testId={`${config.testId}-notice`}>{notice}</Notice> : null}
      {error && !open ? <Notice testId={`${config.testId}-error`}>{error}</Notice> : null}

      {open ? (
        <Card>
          <form onSubmit={save} className="space-y-3" data-testid={`${config.testId}-form`}>
            {config.fields.map((f) => (
              <Field key={f.key} label={tx(f.label[0], f.label[1])} hint={f.hint ? tx(f.hint[0], f.hint[1]) : undefined}>
                {f.type === "textarea" ? (
                  <textarea
                    className={`${inputClass} min-h-[88px] py-2`}
                    value={values[f.key] ?? ""}
                    name={f.key}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                ) : f.type === "select" ? (
                  <Select
                    name={f.key}
                    required={f.required}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  >
                    {!f.options && !f.required ? <option value="">—</option> : null}
                    {(f.options ?? options[f.key] ?? []).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                ) : (
                  <TextInput
                    name={f.key}
                    type={f.type === "number" ? "number" : "text"}
                    step={f.type === "number" ? "any" : undefined}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setValues((v) => {
                        const next = { ...v, [f.key]: val };
                        if (f.key === "name" && "slug" in v && !editing) next.slug = slugify(val);
                        return next;
                      });
                    }}
                  />
                )}
              </Field>
            ))}
            {error ? <Notice testId={`${config.testId}-error`}>{error}</Notice> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving} data-testid={`${config.testId}-save`}>
                {saving ? "…" : tx("Save", "Lưu")}
              </Button>
              <Button tone="secondary" onClick={() => setOpen(false)}>{tx("Cancel", "Huỷ")}</Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="divide-y divide-black/[0.06] p-0">
        {loading ? (
          <Empty>{tx("Loading…", "Đang tải…")}</Empty>
        ) : rows.length === 0 ? (
          <Empty>{tx("Nothing here yet.", "Chưa có dữ liệu.")}</Empty>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3" data-testid={`${config.testId}-row`}>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold text-[#1D1D1F]">{config.primary(row)}</div>
                {config.secondary ? <div className="truncate text-[13px] text-[#6E6E73]">{config.secondary(row)}</div> : null}
              </div>
              {config.status?.(row) ? <StatusPill status={config.status(row)!} /> : null}
              {config.rowActions?.(row)}
              <Button tone="plain" className="min-h-[36px] px-2" onClick={() => startEdit(row)}>
                {locale === "vi" ? "Sửa" : "Edit"}
              </Button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
