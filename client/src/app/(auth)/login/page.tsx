"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import Logo from "@/components/Logo";
import { GradientButton } from "@/components/ui/gradient-button";
import PageWrapper from "@/components/PageWrapper";
import { ArrowLeft, Briefcase, GraduationCap, Loader2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface LoginData {
  email: string;
  password: string;
  role: "learner" | "mentor";
}

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
    role: "learner",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const router = useRouter();
  const { login } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});

    try {
      await login({
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      if (formData.role === "mentor") {
        router.push("/mentor");
      } else {
        router.push("/user");
      }
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen flex">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <motion.div
            className="w-full max-w-md space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-primary hover:text-primary-dark transition-colors mb-8"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>

              <Logo size="md" />
              <h2 className="mt-6 text-3xl font-bold">Welcome Back</h2>
              <p className="mt-2 text-muted-foreground">
                Sign in to continue your journey as a Learner or a Mentor.
              </p>
            </div>

            {/* Login Form */}
            <motion.form
              onSubmit={handleLogin}
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {errors.general && (
                <div className="text-red-600 text-sm mb-2">
                  {errors.general}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium">Sign in as</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: "learner" }))}
                    className={`text-left w-full rounded-xl border p-4 transition-all ${
                      formData.role === "learner"
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl border bg-background flex items-center justify-center">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Learner</p>
                        <p className="text-xs text-muted-foreground">I want to learn and book sessions</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: "mentor" }))}
                    className={`text-left w-full rounded-xl border p-4 transition-all ${
                      formData.role === "mentor"
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl border bg-background flex items-center justify-center">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Mentor</p>
                        <p className="text-xs text-muted-foreground">I want to guide learners and host sessions</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <label className="block text-sm font-medium mb-1" htmlFor="email">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email address"
                aria-invalid={!!errors.email}
                aria-describedby="email-error"
              />
              {errors.email && (
                <div id="email-error" className="text-red-600 text-xs mb-2">
                  {errors.email}
                </div>
              )}

              <label
                className="block text-sm font-medium mb-1"
                htmlFor="password"
              >
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter your password"
                aria-invalid={!!errors.password}
                aria-describedby="password-error"
              />
              {errors.password && (
                <div id="password-error" className="text-red-600 text-xs mb-2">
                  {errors.password}
                </div>
              )}

              <div className="flex items-center justify-between">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary-dark"
                >
                  Forgot your password?
                </Link>
              </div>

              <Button disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="text-primary hover:text-primary-dark font-medium"
                >
                  Sign up here
                </Link>
              </p>
            </motion.form>
          </motion.div>
        </div>

        {/* Right side - Visual */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 items-center justify-center p-12">
          <motion.div
            className="text-center max-w-md"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="text-6xl mb-6">💡</div>
            <h3 className="text-2xl font-bold mb-4">Welcome Back!</h3>
            <p className="text-muted-foreground leading-relaxed">
              Whether you're here to learn from the best or to share your own
              expertise, your journey of growth continues here.
            </p>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Login;
