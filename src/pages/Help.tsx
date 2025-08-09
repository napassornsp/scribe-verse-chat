import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Help() {
  const canonical = typeof window !== "undefined" ? window.location.origin + "/help" : "";
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const submit = () => {
    toast({ title: "Request sent", description: "Our staff will get back to you shortly." });
    setSubject("");
    setMessage("");
  };

  return (
    <main className="container py-8 min-h-svh">
      <Helmet>
        <title>Help & Support | Company</title>
        <meta name="description" content="Contact our staff for help and support." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Help Center</h1>
        <p className="text-muted-foreground">Describe your issue and our staff will respond.</p>
      </header>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Textarea rows={6} placeholder="Write your message..." value={message} onChange={(e) => setMessage(e.target.value)} />
          <div className="flex justify-end">
            <Button onClick={submit}>Submit</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
