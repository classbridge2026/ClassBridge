import { redirect } from "next/navigation";

/** Legacy route — Live Classes lives at /student/live-classes */
export default function StudentClassesRedirectPage() {
  redirect("/student/live-classes");
}
