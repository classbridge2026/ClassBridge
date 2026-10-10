"use client";

import { useActionState } from "react";
import { submitUpsertSubscription, type SubscriptionFormState } from "./actions";

const initial: SubscriptionFormState = { ok: false };

type InstitutionOption = { id: string; name: string; slug: string };

type SubscriptionRow = {
  id: string;
  institutionId: string;
  institutionName: string;
  planKey: string;
  status: string;
  seatLimit: number;
  seatsUsed: number;
  currentPeriodEnd: string;
  notes: string | null;
};

export function SubscriptionsManager({
  institutions,
  subscriptions,
}: {
  institutions: InstitutionOption[];
  subscriptions: SubscriptionRow[];
}) {
  const [state, action, pending] = useActionState(submitUpsertSubscription, initial);

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2.5">Institution</th>
              <th className="px-3 py-2.5">Plan</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Seats</th>
              <th className="px-3 py-2.5">Period end</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  No subscriptions yet. Create one below.
                </td>
              </tr>
            ) : (
              subscriptions.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-3 font-semibold text-slate-900">{s.institutionName}</td>
                  <td className="px-3 py-3">{s.planKey}</td>
                  <td className="px-3 py-3">{s.status}</td>
                  <td className="px-3 py-3">
                    {s.seatsUsed}/{s.seatLimit}
                  </td>
                  <td className="px-3 py-3">{s.currentPeriodEnd}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <form action={action} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-slate-900">Create / update subscription</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            name="institutionId"
            required
            defaultValue=""
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Institution
            </option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <select name="planKey" defaultValue="TRIAL" className="rounded-md border border-slate-200 px-3 py-2 text-sm">
            <option value="TRIAL">Trial</option>
            <option value="STARTER">Starter</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
          <select name="status" defaultValue="TRIALING" className="rounded-md border border-slate-200 px-3 py-2 text-sm">
            <option value="TRIALING">Trialing</option>
            <option value="ACTIVE">Active</option>
            <option value="PAST_DUE">Past due</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
          </select>
          <input
            name="seatLimit"
            type="number"
            min={1}
            defaultValue={50}
            required
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            placeholder="Seat limit"
          />
          <input
            name="currentPeriodEnd"
            type="date"
            required
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            name="notes"
            placeholder="Notes (optional)"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save subscription"}
        </button>
        {state.error && <p className="text-xs text-red-600">{state.error}</p>}
        {state.ok && state.message && (
          <p className="text-xs text-emerald-600">{state.message}</p>
        )}
      </form>
    </div>
  );
}
