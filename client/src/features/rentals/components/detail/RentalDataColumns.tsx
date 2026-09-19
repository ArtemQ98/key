import type { RentalDetail } from "@/api/rentals";
import { money } from "@/lib/format";
import { formatDate } from "@/lib/dates";

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
        {count !== undefined && (
          <span className="rounded-full bg-secondary px-1.5 text-[10px] font-medium text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function RentalDataColumns({ rental }: { rental: RentalDetail }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <Section title="Доп. услуги" count={rental.extras?.length}>
        {rental.extras?.length ? (
          <div className="divide-y divide-border">
            {rental.extras.map((x) => (
              <div key={x.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="truncate">
                  {x.name} × {x.qty}
                </span>
                <span className="font-medium">{money(x.total)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Пока нет</p>
        )}
      </Section>

      <Section title="Платежи" count={rental.payments?.length}>
        {rental.payments?.length ? (
          <div className="divide-y divide-border">
            {rental.payments.map((x) => (
              <div key={x.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="truncate capitalize">{x.type}</span>
                <span className="font-medium">{money(x.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Пока нет</p>
        )}
      </Section>

      <Section title="Корректировки" count={rental.adjustments?.length}>
        {rental.adjustments?.length ? (
          <div className="divide-y divide-border">
            {rental.adjustments.map((x) => (
              <div key={x.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="truncate">{x.note || x.type}</span>
                <span className="font-medium">{money(x.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Пока нет</p>
        )}
      </Section>

      <Section title="Депозит" count={rental.deposit_transactions?.length}>
        {rental.deposit_transactions?.length ? (
          <div className="divide-y divide-border">
            {rental.deposit_transactions.map((x) => (
              <div key={x.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="truncate capitalize">{x.type}</span>
                <span className="font-medium">{money(x.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Операций пока нет</p>
        )}
      </Section>

      {rental.inspections?.length > 0 && (
        <Section title="Осмотры" count={rental.inspections.length}>
          <div className="space-y-2">
            {rental.inspections.map((x) => (
              <div
                key={x.id}
                className="rounded-lg border border-border bg-background p-2.5 text-xs"
              >
                <div className="font-medium">
                  {x.kind === "pickup" ? "Выдача" : "Возврат"}
                </div>
                <div className="text-muted-foreground">
                  {x.mileage ? `${x.mileage} км` : "—"}
                  {x.fuel_level != null && ` · ${x.fuel_level}% топлива`}
                  {" · "}
                  {formatDate(x.created_at)}
                </div>
                {x.notes && (
                  <div className="mt-1 text-muted-foreground">«{x.notes}»</div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {rental.expenses?.length > 0 && (
        <Section title="Расходы" count={rental.expenses.length}>
          <div className="divide-y divide-border">
            {rental.expenses.map((x) => (
              <div key={x.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="truncate">{x.note || x.type}</span>
                <span className="font-medium">{money(x.amount)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}