// import { LoginForm } from "@/components/auth/login-form";

// export default function LoginPage() {
//   return (
//     <main>
//       <h1>Welcome to Pharmix</h1>

//       <p>
//         Sign in to manage your pharmacy operations.
//       </p>

//       <LoginForm />
//     </main>
//   );
// }


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RoleKey = "admin" | "pharmacist" | "inventory" | "analyst";

interface RolePreset {
  id: RoleKey;
  title: string;
  description: string;
  email: string;
}

const ROLES: RolePreset[] = [
  {
    id: "admin",
    title: "System Administrator",
    description: "Full system access and platform administration",
    email: "admin@pharmix.com",
  },
  {
    id: "pharmacist",
    title: "Store Pharmacist",
    description: "Sales, billing, prescriptions and pharmacy operations",
    email: "test@pharmix.com",
  },
  {
    id: "inventory",
    title: "Inventory Manager",
    description: "Stock control, purchases, suppliers and batches",
    email: "",
  },
  {
    id: "analyst",
    title: "Business Analyst",
    description: "Demand forecasting, BI reports and analytics",
    email: "",
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<RoleKey>("admin");
  const [email, setEmail] = useState(ROLES[0].email);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: RolePreset) => {
    setSelectedRole(role.id);
    setEmail(role.email);
    setPassword("");
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        setMessage(
          `Login API error (${response.status}). Please check the login route.`,
        );
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Login failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F3F5F8] flex items-center justify-center p-3 sm:p-5 font-sans">
      <div className="w-full max-w-[1080px] bg-[#FAFBFD] rounded-[26px] shadow-xl border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[540px]">

        {/* LEFT COLUMN */}
        <div className="md:col-span-6 p-7 md:p-9 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100/80 bg-white/50">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 bg-[#009677] rounded-[10px] flex items-center justify-center text-white shadow-md shadow-[#009677]/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M12 8v8" />
                  <path d="M8 12h8" />
                </svg>
              </div>

              <div>
                <h2 className="font-extrabold text-lg text-gray-900 tracking-tight leading-tight">
                  PHARMIX
                </h2>

                <span className="text-[10px] font-bold text-[#009677] tracking-wider uppercase block">
                  ENTERPRISE SUITE
                </span>
              </div>
            </div>

            {/* Intro */}
            <h1 className="text-xl sm:text-[26px] font-extrabold text-gray-900 leading-tight mb-3">
              AI-Driven Pharmacy Management System
            </h1>

            <p className="text-gray-500 text-[13px] leading-relaxed max-w-[440px]">
              A production-quality pharmacy operating platform featuring
              Business Intelligence, Machine Learning demand forecasting,
              and weather-aware inventory intelligence.
            </p>
          </div>

          {/* Project Checklist */}
          <div className="pt-5 border-t border-gray-100">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#009677] uppercase tracking-wider mb-2.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>

              PROJECT ARTIFACT CHECKLIST
            </div>

            <ul className="space-y-1.5 text-[11px] font-mono text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-gray-400">✓</span>
                <span>Normalized Relational DB Integration</span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-gray-400">✓</span>
                <span>Random Forest & XGBoost ML Regressors</span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-gray-400">✓</span>
                <span>Weather-Aware Demand Intelligence</span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-gray-400">✓</span>
                <span>Pharmacy POS & Billing Operations</span>
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="md:col-span-6 p-7 md:p-9 flex flex-col justify-center bg-[#FAFBFD]">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Access Control System
            </h2>

            <p className="text-[11px] text-gray-500 mt-1">
              Select an operational role to load the associated account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Role Presets */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                DEMO ACCOUNT PRESETS
              </span>

              <div className="space-y-1.5">
                {ROLES.map((role) => {
                  const isSelected = selectedRole === role.id;

                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleRoleSelect(role)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-150 flex items-start gap-2.5 ${
                        isSelected
                          ? "bg-[#E6F4F1] border-[#009677] shadow-sm"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`mt-0.5 ${
                          isSelected ? "text-[#009677]" : "text-gray-400"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-[18px] h-[18px]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>

                      <div>
                        <h3
                          className={`text-[13px] font-semibold leading-none ${
                            isSelected
                              ? "text-[#009677]"
                              : "text-gray-800"
                          }`}
                        >
                          {role.title}
                        </h3>

                        <p className="text-[11px] text-gray-500 mt-1">
                          {role.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1"
              >
                EMAIL ADDRESS
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#F3F5F8] border border-transparent rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-gray-800 focus:bg-white focus:border-[#009677] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1"
              >
                SECURE ACCESS CODE
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      width="18"
                      height="11"
                      x="3"
                      y="11"
                      rx="2"
                      ry="2"
                    />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#F3F5F8] border border-transparent rounded-xl pl-9 pr-11 py-2.5 text-[13px] text-gray-800 focus:bg-white focus:border-[#009677] focus:outline-none transition-all"
                />

                {/* Password Visibility */}
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#009677] transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 4.2A10.5 10.5 0 0 1 12 4c6.5 0 10 8 10 8a18.2 18.2 0 0 1-3.2 4.5" />
                      <path d="M6.1 6.1C3.6 7.8 2 12 2 12s3.5 8 10 8a10.5 10.5 0 0 0 4.1-.8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {message && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[11px] text-red-600">
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#009677] hover:bg-[#008267] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 tracking-wider text-[11px] uppercase shadow-md shadow-[#009677]/20 transition-all cursor-pointer mt-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" x2="3" y1="12" y2="12" />
              </svg>

              {loading ? "AUTHORIZING..." : "SECURE AUTHORIZATION"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}