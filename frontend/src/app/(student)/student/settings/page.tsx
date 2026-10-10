import type { Metadata } from "next";
import { Bell, Lock, Settings, Video } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireStudentContext } from "@/lib/student/access";
import { PasswordForm } from "@/features/profile/password-form";
import { StudentNotificationPrefsForm } from "@/features/student/notification-prefs-form";

export const metadata: Metadata = {
  title: "Settings — Student Portal",
};

export default async function StudentSettingsPage() {
  const { user, institutionId, institutionName } = await requireStudentContext();

  const prefs = await prisma.notificationPreference.findFirst({
    where: { userId: user.id, institutionId },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Settings className="h-6 w-6 text-[#2563EB]" />
          Settings
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Account security and notification preferences for {institutionName}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          id="security"
          className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Lock className="h-4 w-4 text-[#2563EB]" />
            Security
          </h3>
          <p className="mt-1 text-xs text-slate-500">Change your ClassBridge password.</p>
          <div className="mt-4">
            <PasswordForm />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Bell className="h-4 w-4 text-[#2563EB]" />
            Notifications
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Choose which alerts you receive for this campus.
          </p>
          <div className="mt-4">
            <StudentNotificationPrefsForm
              initialPrefs={{
                emailEnabled: prefs?.emailEnabled ?? true,
                inAppEnabled: prefs?.inAppEnabled ?? true,
                classReminders: prefs?.classReminders ?? true,
                announcements: prefs?.announcements ?? true,
                assignments: prefs?.assignments ?? true,
                messages: prefs?.messages ?? true,
              }}
            />
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Video className="h-4 w-4 text-[#2563EB]" />
          Classroom preferences
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Camera, microphone, and speaker choices are selected on the live class pre-join screen for
          each session. Device permissions are managed by your browser.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-500">
          <li>Allow camera and microphone when prompted before joining.</li>
          <li>Use the in-class device settings control to switch inputs during a session.</li>
          <li>If permissions are denied, use your browser site settings to re-enable access.</li>
        </ul>
      </section>
    </div>
  );
}
