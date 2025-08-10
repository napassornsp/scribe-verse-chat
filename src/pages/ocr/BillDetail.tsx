import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";

export default function BillDetail() {
  const { id } = useParams();
  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const canonical = typeof window !== "undefined" ? window.location.origin + `/ocr/bill/${id}` : "";
  const title = useMemo(() => "OCR Processing - Bill", []);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ocr_bill_extractions")
        .select("id, filename, file_url, data, created_at")
        .eq("id", id)
        .single();
      setItem(data);
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="container py-6">
      <Helmet>
        <title>{title} | Company</title>
        <meta name="description" content="View saved bill OCR extraction and attached image." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate('/ocr/bill')}>Back</Button>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="aspect-[4/3] rounded-md border overflow-auto bg-muted/30 flex items-center justify-center">
              {item?.file_url ? (
                <img src={item.file_url} alt={item.filename ?? 'Bill document'} className="object-contain" />
              ) : (
                <div className="text-sm text-muted-foreground">No image available</div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">Filename: {item?.filename ?? '—'}</div>
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
                  <Input placeholder="Bill Number" value={item?.data?.bill_no ?? item?.data?.["หมายเลขใบเอกสาร (Doc_number)"] ?? ''} readOnly />
                  <Input placeholder="Date" value={item?.data?.date ?? item?.data?.["วันที่ของเอกสาร (Doc_date)"] ?? ''} readOnly />
                  <Input placeholder="Vendor" value={item?.data?.vendor ?? item?.data?.["ชื่อผู้ขายภาษาไทย (seller_name_thai)"] ?? ''} readOnly />
                  <Input placeholder="Total Amount" value={item?.data?.total ?? item?.data?.["ยอดรวมสุทธิ (total_due_amount)"] ?? ''} readOnly />
                </div>
                <Textarea placeholder="Notes" value={item?.data?.notes ?? ''} readOnly />
              </TabsContent>
              <TabsContent value="raw" className="mt-4">
                <pre className="text-xs whitespace-pre-wrap text-muted-foreground">{JSON.stringify(item?.data ?? {}, null, 2)}</pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
