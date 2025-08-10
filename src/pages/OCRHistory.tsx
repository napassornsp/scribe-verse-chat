import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface Item {
  id: string;
  type: "bill" | "bank";
  filename: string | null;
  created_at: string;
  data: any;
}

export default function OCRHistory() {
  const canonical = typeof window !== "undefined" ? window.location.origin + "/ocr/history" : "";
  const title = useMemo(() => "OCR History", []);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: bills }, { data: banks }] = await Promise.all([
        supabase.from("ocr_bill_extractions").select("id, filename, created_at, data").order("created_at", { ascending: false }),
        supabase.from("ocr_bank_extractions").select("id, filename, created_at, data").order("created_at", { ascending: false }),
      ]);

      const billItems: Item[] = (bills ?? []).map((b: any) => ({
        id: b.id,
        type: "bill",
        filename: b.filename ?? null,
        created_at: b.created_at,
        data: b.data,
      }));
      const bankItems: Item[] = (banks ?? []).map((b: any) => ({
        id: b.id,
        type: "bank",
        filename: b.filename ?? null,
        created_at: b.created_at,
        data: b.data,
      }));

      const combined = [...billItems, ...bankItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(combined);
      setLoading(false);
    };
    load();
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
          <Badge variant="secondary">Total: {items.length}</Badge>
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
                        <a href={`/ocr/${i.type}/${i.id}`} key={`${i.type}-${i.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/30 focus:bg-muted/30 focus:outline-none">
                          <Badge variant="outline" className="shrink-0 capitalize">{i.type}</Badge>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{i.filename || (i.type === "bill" ? "Bill" : "Bank")} </div>
                            <div className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</div>
                          </div>
                          <div className="text-xs text-muted-foreground max-w-[40%] truncate">
                            {i.type === "bill" ? (i.data?.["หมายเลขใบเอกสาร (Doc_number)"] ?? "") : (i.data?.reference ?? "")}
                          </div>
                        </a>
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
