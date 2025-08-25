"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isMagicLink, setIsMagicLink] = useState(true);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleMagicLink() {
    setLoading(true);
    setError("");
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.signInWithOtp({ 
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) {
        setError(error.message);
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailPassword() {
    setLoading(true);
    setError("");
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    setLoading(true);
    setError("");
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) {
        setError(error.message);
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to SDSS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Smart Decision Support System
          </p>
        </div>
        
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="flex mb-6">
            <button
              onClick={() => setIsMagicLink(true)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md ${
                isMagicLink
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Magic Link
            </button>
            <button
              onClick={() => setIsMagicLink(false)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md ${
                !isMagicLink
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Email & Password
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {sent && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">
                Check your email for the sign-in link!
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1"
              />
            </div>

            {!isMagicLink && (
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-1"
                />
              </div>
            )}

            {isMagicLink ? (
              <Button
                className="w-full bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
                onClick={handleMagicLink}
                disabled={loading || !email}
              >
                {loading ? "Sending…" : "Send Magic Link"}
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  className="w-full bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
                  onClick={handleEmailPassword}
                  disabled={loading || !email || !password}
                >
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSignUp}
                  disabled={loading || !email || !password}
                >
                  {loading ? "Creating account…" : "Create Account"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
