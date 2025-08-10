import { Helmet } from "react-helmet-async";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ZoomIn, ZoomOut, RefreshCw, FlipHorizontal } from "lucide-react";

export default function OCRBill() {
  const canonical = typeof window !== "undefined" ? window.location.origin + "/ocr/bill" : "";
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [scale, setScale] = useState(1);
  const [flipped, setFlipped] = useState(false);

  const title = useMemo(() => "OCR Processing - Bill", []);

  const onFile = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const analyze = () => {
    setProcessing(true);
    setTimeout(() => setProcessing(false), 1200); // mock
  };

  const zoomIn = () => setScale((s) => Math.min(4, parseFloat((s + 0.25).toFixed(2))));
  const zoomOut = () => setScale((s) => Math.max(0.5, parseFloat((s - 0.25).toFixed(2))));
  const resetView = () => { setScale(1); setFlipped(false); };

  return (
    <div className="container py-6">
      <Helmet>
        <title>{title} | Company</title>
        <meta name="description" content="Upload a bill and extract structured data with our OCR." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary">Free: 12</Badge>
          <Badge variant="secondary">Plus: 14</Badge>
          <Badge variant="secondary">Premium: 16</Badge>
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
                  alt="Uploaded bill document preview"
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
                  <Input placeholder="Bill Number" defaultValue="INV-2024-001" />
                  <Input placeholder="Date" defaultValue="2024-03-15" />
                  <Input placeholder="Vendor" defaultValue="Electric Company" />
                  <Input placeholder="Total Amount" defaultValue="75.90" />
                </div>
                <Textarea placeholder="Address or Notes" defaultValue="123 Main St, City, State 12345" />
                <div className="text-xs text-muted-foreground">Processing time: {processing ? "…" : "1.2s"}</div>
                <div className="flex gap-2">
                  <Button>Approve File</Button>
                  <Button variant="secondary">Save Data</Button>
                  <Button variant="outline">Export</Button>
                </div>
              </TabsContent>
              <TabsContent value="raw" className="mt-4">
                <pre className="text-xs whitespace-pre-wrap text-muted-foreground">{JSON.stringify({ confidence: "91%", fields: ["bill_no", "date", "vendor", "total"] }, null, 2)}</pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
