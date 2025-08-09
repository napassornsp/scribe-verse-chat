import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const plans = [
  { name: "Free", price: "$0", features: ["Basic chat", "Limited credits"], cta: "Get Started" },
  { name: "Pro", price: "$15/mo", features: ["All modules", "Higher limits", "Priority support"], cta: "Purchase" },
  { name: "Enterprise", price: "Contact", features: ["Custom limits", "SLA", "Dedicated support"], cta: "Contact Sales" },
];

export default function Pricing() {
  const canonical = typeof window !== "undefined" ? window.location.origin + "/pricing" : "";
  const onSelect = (name: string) => {
    window.alert(`${name} plan selected. Checkout coming soon.`);
  };

  return (
    <main className="container py-8 min-h-svh">
      <Helmet>
        <title>Pricing | Company</title>
        <meta name="description" content="Choose the plan that fits your needs: Free, Pro, or Enterprise." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold">Choose Your Plan</h1>
        <p className="text-muted-foreground">Upgrade anytime. Simple and transparent pricing.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.name} className={p.name === "Pro" ? "border-primary" : undefined}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {p.name}
                {p.name === "Pro" && <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">Popular</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-3">{p.price}</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {p.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Button className="mt-4 w-full" onClick={() => onSelect(p.name)}>
                {p.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
