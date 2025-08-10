import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Item {
  id: string;
  type: "bill" | "bank";
  filename: string | null;
  created_at: string;
  data: any;
  approved?: boolean;
}

export default function OCRHistory() {
  const canonical = typeof window !== "undefined" ? window.location.origin + "/ocr/history" : "";
  const title = useMemo(() => "OCR History", []);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [billCredits, setBillCredits] = useState<number | null>(null);
  const [bankCredits, setBankCredits] = useState<number | null>(null);
  const [billMax, setBillMax] = useState<number | null>(null);
  const [bankMax, setBankMax] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: bills }, { data: banks }] = await Promise.all([
        supabase.from("ocr_bill_extractions").select("id, filename, created_at, data, approved").order("created_at", { ascending: false }),
        supabase.from("ocr_bank_extractions").select("id, filename, created_at, data, approved").order("created_at", { ascending: false }),
      ]);

      const billItems: Item[] = (bills ?? []).map((b: any) => ({
        id: b.id,
        type: "bill",
        filename: b.filename ?? null,
        created_at: b.created_at,
        data: b.data,
        approved: !!b.approved,
      }));
      const bankItems: Item[] = (banks ?? []).map((b: any) => ({
        id: b.id,
        type: "bank",
        filename: b.filename ?? null,
        created_at: b.created_at,
        data: b.data,
        approved: !!b.approved,
      }));

      const combined = [...billItems, ...bankItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(combined);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const loadCredits = async () => {
      try {
        const { data, error } = await supabase.rpc('reset_monthly_ocr_credits');
        if (!error && Array.isArray(data) && data.length) {
          setBillCredits((data[0] as any)?.bill ?? null);
          setBankCredits((data[0] as any)?.bank ?? null);
        } else if (!error && data && (data as any).bill !== undefined) {
          setBillCredits((data as any).bill ?? null);
          setBankCredits((data as any).bank ?? null);
        } else {
          const { data: uc } = await supabase.from('user_credits').select('ocr_bill, ocr_bank').single();
          if (uc) {
            setBillCredits((uc as any).ocr_bill ?? null);
            setBankCredits((uc as any).ocr_bank ?? null);
          }
        }
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id;
        if (uid) {
          const { data: profile } = await supabase.from('profiles').select('plan_id').eq('id', uid).single();
          const planId = (profile as any)?.plan_id;
          if (planId) {
            const { data: plan } = await supabase.from('plans').select('ocr_bill_limit, ocr_bank_limit').eq('id', planId).single();
            setBillMax((plan as any)?.ocr_bill_limit ?? 12);
            setBankMax((plan as any)?.ocr_bank_limit ?? 13);
          } else {
            setBillMax(12);
            setBankMax(13);
          }
        }
      } catch (e) {
        console.error('Failed to load credits', e);
      }
    };
    loadCredits();
  }, []);

  return (
    <div className="container py-6">
      <Helmet>
        <title>{title} | Company</title>
        <meta name="description" content="View your OCR Bill and Bank extraction history in one place." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary">Bill: {billCredits ?? "—"} / {billMax ?? "—"}</Badge>
          <Badge variant="secondary">Bank: {bankCredits ?? "—"} / {bankMax ?? "—"}</Badge>
          <Badge variant="outline">Total: {items.length}</Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Recent Extractions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="bill">Bills</TabsTrigger>
              <TabsTrigger value="bank">Banks</TabsTrigger>
            </TabsList>
            {(["all", "bill", "bank"] as const).map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-4">
                <div className="divide-y rounded-md border">
                  {loading ? (
                    <div className="p-4 text-sm text-muted-foreground">Loading…</div>
                  ) : (
                    items
                      .filter((i) => tab === "all" || i.type === tab)
                      .map((i) => (
                        <div key={`${i.type}-${i.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/30 focus:bg-muted/30 focus:outline-none">
                          <a href={`/ocr/${i.type}/${i.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                            <Badge variant="outline" className="shrink-0 capitalize">{i.type}</Badge>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{i.filename || (i.type === "bill" ? "Bill" : "Bank")} </div>
                              <div className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</div>
                            </div>
                            {i.approved && (
                              <span className="text-green-600 dark:text-green-400" title="Approved" aria-label="Approved">
                                <CheckCircle2 className="h-4 w-4" />
                              </span>
                            )}
                            <div className="text-xs text-muted-foreground max-w-[40%] truncate">
                              {i.type === "bill" ? (i.data?.["หมายเลขใบเอกสาร (Doc_number)"] ?? i.data?.bill_no ?? "") : (i.data?.reference ?? "")}
                            </div>
                          </a>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="ml-2 p-1 rounded hover:bg-muted"
                                aria-label="Item actions"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={async (e) => {
                                e.preventDefault(); e.stopPropagation();
                                const name = window.prompt('Rename file', i.filename || '');
                                if (name !== null) {
                                  const table = i.type === 'bill' ? 'ocr_bill_extractions' : 'ocr_bank_extractions';
                                  const { error } = await supabase.from(table).update({ filename: name }).eq('id', i.id);
                                  if (!error) {
                                    setItems((prev) => prev.map((it) => it.id === i.id ? { ...it, filename: name } : it));
                                  }
                                }
                              }}>Rename</DropdownMenuItem>
                              <DropdownMenuItem onClick={async (e) => {
                                e.preventDefault(); e.stopPropagation();
                                if (!window.confirm('Delete this item?')) return;
                                const table = i.type === 'bill' ? 'ocr_bill_extractions' : 'ocr_bank_extractions';
                                const { error } = await supabase.from(table).delete().eq('id', i.id);
                                if (!error) {
                                  setItems((prev) => prev.filter((it) => it.id !== i.id));
                                }
                              }}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))
                  )}
                  {!loading && items.filter((i) => tab === "all" || i.type === tab).length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground">No history yet.</div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
