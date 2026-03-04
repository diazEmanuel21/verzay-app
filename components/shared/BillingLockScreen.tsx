type Props = {
  clientName: string;
  company?: string | null;
  amountDue?: string | null;
  currencyCode?: string | null;
  dueDateIso?: string | null;
  paymentMethodLabel?: string | null;
  paymentNotes?: string | null;
  paymentUrl?: string | null;
  reasonLabel: string;
};

export default function BillingLockScreen(props: Props) {
  const {
    clientName,
    company,
    amountDue,
    currencyCode,
    dueDateIso,
    paymentMethodLabel,
    paymentNotes,
    paymentUrl,
    reasonLabel,
  } = props;

  return (
    <main className="min-h-screen w-full bg-background p-6 md:p-10">
      <section className="mx-auto max-w-3xl rounded-xl border border-destructive/40 bg-destructive/10 p-6 md:p-8">
        <h1 className="text-2xl font-semibold text-destructive">Acceso suspendido por facturación</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu acceso ha sido bloqueado por seguridad. Debes regularizar el pago para volver a usar la plataforma.
        </p>

        <div className="mt-6 grid gap-2 text-sm">
          <p><b>Cliente:</b> {clientName}</p>
          {company ? <p><b>Empresa:</b> {company}</p> : null}
          <p><b>Estado:</b> {reasonLabel}</p>
          {amountDue ? <p><b>Saldo pendiente:</b> {amountDue} {currencyCode ?? "COP"}</p> : null}
          {dueDateIso ? <p><b>Fecha de vencimiento:</b> {dueDateIso.slice(0, 10)}</p> : null}
          {paymentMethodLabel ? <p><b>Medio de pago:</b> {paymentMethodLabel}</p> : null}
          {paymentNotes ? <p><b>Instrucciones:</b> {paymentNotes}</p> : null}
          {paymentUrl ? (
            <p>
              <b>URL de pago:</b>{" "}
              <a className="underline text-primary" href={paymentUrl} target="_blank" rel="noreferrer">
                {paymentUrl}
              </a>
            </p>
          ) : null}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Este bloqueo no se puede cerrar. Si ya pagaste, contacta soporte para validación.
        </p>
      </section>
    </main>
  );
}
