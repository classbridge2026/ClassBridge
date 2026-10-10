import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { publicNav } from "@/components/shared/marketing";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">
            Connect. Learn. Teach. A multi-institution education platform for
            live classes, recordings, and course work.
          </p>
          <p className="mt-4 text-xs font-semibold text-slate-500">
            First Institution Tenant: <span className="text-blue-600 font-bold">Transit College</span>
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Product</h3>
          <ul className="mt-3 space-y-2">
            {publicNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Account & Legal</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/login" className="text-slate-600 hover:text-slate-900">
                Login
              </Link>
            </li>
            <li>
              <Link href="/get-started" className="text-slate-600 hover:text-slate-900">
                Get Started
              </Link>
            </li>
            <li>
              <Link href="/forgot-password" className="text-slate-600 hover:text-slate-900">
                Forgot password
              </Link>
            </li>
          </ul>
          <p className="mt-6 text-xs leading-relaxed text-slate-500">
            ClassBridge — Multi-institution SaaS architecture. Data isolation strictly enforced.
          </p>
        </div>
      </div>
    </footer>
  );
}
