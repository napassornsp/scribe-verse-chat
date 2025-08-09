import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Profile() {
  const canonical = typeof window !== "undefined" ? window.location.origin + "/profile" : "";
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const plan = "Free";

  const save = () => {
    toast({ title: "Profile updated" });
  };

  return (
    <main className="container py-8 min-h-svh">
      <Helmet>
        <title>User Profile | Company</title>
        <meta name="description" content="Manage your profile and plan. Upgrade anytime." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Your Profile</h1>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button onClick={save}>Save</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span>Current:</span>
              <Badge variant="secondary">{plan}</Badge>
            </div>
            <Button onClick={() => (window.location.href = "/pricing")}>Upgrade Plan</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
