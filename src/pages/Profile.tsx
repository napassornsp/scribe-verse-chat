import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import useAuthSession from "@/hooks/useAuthSession";

export default function Profile() {
  const canonical = typeof window !== "undefined" ? window.location.origin + "/profile" : "";
  const { toast } = useToast();
  const { user, loading } = useAuthSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const plan = "Free";
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name,email")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        console.error(error);
        toast({ title: "Failed to load profile", description: error.message });
        return;
      }
      if (data) {
        setName((data as any).display_name ?? "");
        setEmail((data as any).email ?? user.email ?? "");
      } else {
        setEmail(user.email ?? "");
      }
    };
    load();
  }, [user, toast]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: name, email }, { onConflict: "id" });
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message });
    } else {
      toast({ title: "Profile updated" });
    }
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

      {!loading && !user ? (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Please sign in to view and edit your profile.</p>
            <Button onClick={() => (window.location.href = "/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
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
      )}
    </main>
  );
}
