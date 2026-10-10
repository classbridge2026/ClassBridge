"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitUpdateProfile, type ProfileFormState } from "@/features/profile/actions";
import { User, Phone, CheckCircle2, AlertTriangle } from "lucide-react";

const initialState: ProfileFormState | null = null;

interface ProfileFormProps {
  initialFullName: string;
  initialPhone?: string | null;
}

export function ProfileForm({ initialFullName, initialPhone }: ProfileFormProps) {
  const [state, action, pending] = useActionState(submitUpdateProfile, initialState);

  return (
    <form action={action} className="space-y-5" noValidate>
      {state?.ok && state.message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{state.message}</span>
        </div>
      ) : null}

      {state?.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 font-medium flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-slate-900 font-semibold text-sm">
          Full Name
        </Label>
        <div className="relative">
          <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            id="fullName"
            name="fullName"
            type="text"
            defaultValue={initialFullName}
            required
            aria-invalid={Boolean(state?.fieldErrors?.fullName)}
            className="h-11 pl-10 rounded-lg border-slate-300 focus:border-blue-600 focus:ring-blue-600"
          />
        </div>
        {state?.fieldErrors?.fullName ? (
          <p className="text-xs font-semibold text-red-600">{state.fieldErrors.fullName}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-slate-900 font-semibold text-sm">
          Phone Number (Optional)
        </Label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={initialPhone || ""}
            placeholder="+232 76 000000"
            className="h-11 pl-10 rounded-lg border-slate-300 focus:border-blue-600 focus:ring-blue-600"
          />
        </div>
      </div>

      <Button type="submit" className="h-10 px-5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white" disabled={pending}>
        {pending ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}
