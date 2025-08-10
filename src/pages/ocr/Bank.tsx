import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ZoomIn, ZoomOut, RefreshCw, FlipHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function OCRBank() {
  const canonical = typeof window !== "undefined" ? window.location.origin + "/ocr/bank" : "";
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [scale, setScale] = useState(1);
  const [flipped, setFlipped] = useState(false);

const title = useMemo(() => "OCR Processing - Bank", []);

  const navigate = useNavigate();
  const [billCredits, setBillCredits] = useState<number | null>(null);
  const [bankCredits, setBankCredits] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.rpc('reset_monthly_ocr_credits');
      if (data) {
        setBillCredits((data as any).bill ?? null);
        setBankCredits((data as any).bank ?? null);
      }
    };
    load();
  }, []);

  const onFile = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

const analyze = async () => {
    setProcessing(true);
    setTimeout(async () => {
      setProcessing(false);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (uid && bankCredits !== null) {
          const newVal = Math.max(0, bankCredits - 1);
          await supabase.from('user_credits').update({ ocr_bank: newVal }).eq('user_id', uid);
          setBankCredits(newVal);
        }
      } catch (e) {
        console.error('Failed to decrement bank credits', e);
      }
    }, 1200); // mock
  };
  const saveBank = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return;
      const dataJson = {
        reference: "CHK-123456",
        date: "2024-03-15",
        bank: "Bank of Example",
        amount: "1,000.00",
      } as const;
      await supabase.from('ocr_bank_extractions').insert({
        user_id: uid,
        filename: file?.name ?? null,
        file_url: null,
        data: dataJson as any
      });
    } catch (e) {
      console.error('Failed to save bank extraction', e);
    }
  };
  const zoomIn = () => setScale((s) => Math.min(4, parseFloat((s + 0.25).toFixed(2))));
  const zoomOut = () => setScale((s) => Math.max(0.5, parseFloat((s - 0.25).toFixed(2))));
  const resetView = () => { setScale(1); setFlipped(false); };

  return (
    <div className="container py-6">
      <Helmet>
        <title>{title} | Company</title>
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
          <Badge variant="secondary">Bill: {billCredits ?? "—"}</Badge>
          <Badge variant="secondary">Bank: {bankCredits ?? "—"}</Badge>
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
            <Button className="w-full" disabled={!file || processing} onClick={analyze}>
              {processing ? "Processing..." : "Analyze"}
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
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Reference" defaultValue="CHK-123456" />
                  <Input placeholder="Date" defaultValue="2024-03-15" />
                  <Input placeholder="Bank" defaultValue="Bank of Example" />
                  <Input placeholder="Amount" defaultValue="1,000.00" />
                </div>
                <Textarea placeholder="Memo or Notes" defaultValue="Memo: Payroll" />
                <div className="text-xs text-muted-foreground">Processing time: {processing ? "…" : "1.2s"}</div>
                <div className="flex gap-2">
                  <Button>Approve File</Button>
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
