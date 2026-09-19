import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { PageHead } from "@/components/layout";
import { Empty, Input, Skeleton } from "@/components/ui";
import { useClients } from "@/hooks/useClients";
import { ClientRow } from "@/features/clients";

export function ClientsPage() {
  const { data: clients = [], isLoading } = useClients();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.phone || "").toLowerCase().includes(s),
    );
  }, [clients, q]);

  const totalRevenue = clients.reduce((a, c) => a + c.total, 0);
  const totalRentals = clients.reduce((a, c) => a + c.rentals, 0);

  return (
    <>
      <PageHead
        eyebrow="CRM"
        title="Клиенты"
        description="История взаимодействий и ценность клиента для автопарка."
      />

      {clients.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat
            label="Всего клиентов"
            value={clients.length.toString()}
          />
          <Stat label="Всего аренд" value={totalRentals.toString()} />
          <Stat label="Общая выручка" value={`${totalRevenue.toLocaleString("ru-RU")} ₽`} />
        </div>
      )}

      <section className="rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или телефону"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length ? (
          <div>
            {filtered.map((c, i) => (
              <ClientRow key={`${c.name}-${i}`} client={c} />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="p-8">
            <Empty
              icon={Users}
              title="Клиентов пока нет"
              description="После первой заявки клиент появится здесь."
            />
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Никого не нашли по «{q}»
          </div>
        )}
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}