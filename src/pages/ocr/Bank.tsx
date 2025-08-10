import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ZoomIn, ZoomOut, RefreshCw, FlipHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function OCRBank() {
  const canonical = typeof window !== "undefined" ? window.location.origin + "/ocr/bank" : "";
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [scale, setScale] = useState(1);
  const [flipped, setFlipped] = useState(false);

  const [analyzed, setAnalyzed] = useState(false);
  const [extracted, setExtracted] = useState({ reference: "", date: "", bank: "", amount: "" });
  const [memo, setMemo] = useState("");

  const title = useMemo(() => "OCR Processing - Bank", []);

  const navigate = useNavigate();
  const [billCredits, setBillCredits] = useState<number | null>(null);
  const [bankCredits, setBankCredits] = useState<number | null>(null);
  const [billMax, setBillMax] = useState<number | null>(null);
  const [bankMax, setBankMax] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
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
      try {
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
        console.error('Failed to load plan limits', e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const handler = () => {
      (async () => {
        try {
          const hasContent = !!(file || extracted.reference || extracted.date || extracted.bank || extracted.amount || memo);
          if (hasContent) {
            await saveBank();
            window.dispatchEvent(new CustomEvent('ocr:refresh'));
          }
          const { data: auth } = await supabase.auth.getUser();
          const uid = auth?.user?.id;
          if (uid) {
            const chatTitle = file?.name ? `Bank: ${file.name}` : 'New OCR Bank';
            await supabase.from('chats').insert({ user_id: uid, title: chatTitle });
          }
        } catch (e) {
          console.error('New image flow (bank) failed', e);
        } finally {
          setFile(null);
          setPreview(null);
          setProcessing(false);
          setScale(1);
          setFlipped(false);
          setAnalyzed(false);
          setExtracted({ reference: "", date: "", bank: "", amount: "" });
          setMemo("");
          setSavedId(null);
        }
      })();
    };
    // @ts-ignore - CustomEvent typing
    window.addEventListener("ocr:new", handler as any);
    return () => {
      // @ts-ignore - CustomEvent typing
      window.removeEventListener("ocr:new", handler as any);
    };
  }, []);
  const onFile = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

const analyze = async () => {
    if (bankCredits !== null && bankCredits <= 0) {
      toast({ title: 'Not enough credits', description: 'You have no Bank credits left this month.' });
      return;
    }
    setProcessing(true);
    setTimeout(async () => {
      setProcessing(false);
      setAnalyzed(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (uid && bankCredits !== null) {
          const newVal = Math.max(0, bankCredits - 1);
          const { data: updated, error } = await supabase
            .from('user_credits')
            .update({ ocr_bank: newVal })
            .eq('user_id', uid)
            .select('ocr_bank')
            .single();
          if (!error) setBankCredits(updated?.ocr_bank ?? newVal);
        }
      } catch (e) {
        console.error('Failed to decrement bank credits', e);
        toast({ title: 'Error', description: 'Could not update credits.' });
      }
    }, 1200);
  };
  const saveBank = async (): Promise<string | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return null;
      let fileUrl: string | null = null;
      if (file) {
        const path = `${uid}/${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage.from('ocr').upload(path, file);
        if (!upErr) {
          const { data: pub } = supabase.storage.from('ocr').getPublicUrl(path);
          fileUrl = pub.publicUrl;
        }
      }
      const { data, error } = await supabase
        .from('ocr_bank_extractions')
        .insert({
          user_id: uid,
          filename: file?.name ?? null,
          file_url: fileUrl,
          data: {
            reference: extracted.reference,
            date: extracted.date,
            bank: extracted.bank,
            amount: extracted.amount,
            memo,
          } as any,
        })
        .select('id')
        .single();
      if (error) throw error;
      if (data?.id) setSavedId(data.id);
      toast({ title: 'Saved', description: 'Bank extraction saved to history.' });
      return data?.id ?? null;
    } catch (e) {
      console.error('Failed to save bank extraction', e);
      toast({ title: 'Save failed', description: 'Could not save bank extraction.' });
      return null;
    }
  };

  const approveBank = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return;
      let id = savedId;
      if (!id) id = await saveBank();
      if (!id) return;
      const { error } = await supabase
        .from('ocr_bank_extractions')
        .update({ approved: true })
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Approved', description: 'Marked as approved.' });
      window.dispatchEvent(new CustomEvent('ocr:refresh'));
    } catch (e) {
      console.error('Failed to approve bank extraction', e);
      toast({ title: 'Error', description: 'Could not mark as approved.' });
    }
  };
  const zoomIn = () => setScale((s) => Math.min(4, parseFloat((s + 0.25).toFixed(2))));
  const zoomOut = () => setScale((s) => Math.max(0.5, parseFloat((s - 0.25).toFixed(2))));
  const resetView = () => { setScale(1); setFlipped(false); };

  return (
    <div className="container py-6">
      <Helmet>
        <title>{`${title} | Company`}</title>
        <meta name="description" content="Upload a bank document and extract structured data with our OCR." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Select value="bank" onValueChange={(v) => navigate(v === 'bill' ? '/ocr/bill' : '/ocr/bank')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Select OCR Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bill">Bill Processing</SelectItem>
            <SelectItem value="bank">Bank Processing</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary">Bank: {bankCredits ?? "—"} / {bankMax ?? "—"}</Badge>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={zoomOut} aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={zoomIn} aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => setFlipped((f) => !f)} aria-label="Reverse image"><FlipHorizontal className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={resetView} aria-label="Reset view"><RefreshCw className="h-4 w-4" /></Button>
              <span className="text-xs text-muted-foreground ml-2">Zoom: {(scale * 100).toFixed(0)}%</span>
            </div>
            <div className="aspect-[4/3] rounded-md border overflow-auto bg-muted/30 flex items-center justify-center">
              {preview ? (
                <img
                  src={preview}
                  alt="Uploaded bank document preview"
                  loading="lazy"
                  style={{ transform: `${flipped ? "scaleX(-1) " : ""}scale(${scale})`, transformOrigin: "center center" }}
                  className="object-contain"
                />
              ) : (
                <div className="text-sm text-muted-foreground">No document selected</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/*,.pdf" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
              {file && (
                <Button variant="secondary" onClick={() => onFile(null)}>Reset</Button>
              )}
            </div>
            <Button className="w-full" disabled={!file || processing || (bankCredits !== null && bankCredits <= 0)} onClick={analyze}>
              {processing ? "Processing..." : bankCredits !== null && bankCredits <= 0 ? "Out of credits" : "Analyze"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extracted Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="structured">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="structured">Structured</TabsTrigger>
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
              </TabsList>
              <TabsContent value="structured" className="space-y-3 mt-4">
                <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
                  <Input placeholder="Reference" value={extracted.reference} onChange={(e) => setExtracted((s) => ({ ...s, reference: e.target.value }))} />
                  <div className="text-sm text-muted-foreground text-right">Reference (reference)</div>
                  <Input placeholder="Date" value={extracted.date} onChange={(e) => setExtracted((s) => ({ ...s, date: e.target.value }))} />
                  <div className="text-sm text-muted-foreground text-right">Date (date)</div>
                  <Input placeholder="Bank" value={extracted.bank} onChange={(e) => setExtracted((s) => ({ ...s, bank: e.target.value }))} />
                  <div className="text-sm text-muted-foreground text-right">Bank (bank)</div>
                  <Input placeholder="Amount" value={extracted.amount} onChange={(e) => setExtracted((s) => ({ ...s, amount: e.target.value }))} />
                  <div className="text-sm text-muted-foreground text-right">Amount (amount)</div>
                </div>
                <Textarea placeholder="Memo or Notes" value={memo} onChange={(e) => setMemo(e.target.value)} />
                <div className="text-xs text-muted-foreground">Processing time: {processing ? "…" : "1.2s"}</div>
                <div className="flex gap-2">
                  <Button onClick={approveBank}>Approve File</Button>
                  <Button variant="secondary" onClick={saveBank}>Save Data</Button>
                  <Button variant="outline">Export</Button>
                </div>
              </TabsContent>
              <TabsContent value="raw" className="mt-4">
                <pre className="text-xs whitespace-pre-wrap text-muted-foreground">{JSON.stringify({ confidence: "90%", fields: ["reference", "date", "bank", "amount"] }, null, 2)}</pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
