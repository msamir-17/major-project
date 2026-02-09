"use client";

import React from "react";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";
import { GradientButton } from "@/components/ui/gradient-button";
import PageWrapper from "@/components/PageWrapper";
import { ArrowRight, Star, Users, Award, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const Landing: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: "Expert Mentors",
      description:
        "Connect with industry professionals and experienced experts",
    },
    {
      icon: Award,
      title: "Personalized Learning",
      description: "Get tailored guidance based on your goals and interests",
    },
    {
      icon: MessageCircle,
      title: "Real-time Support",
      description: "Chat, video calls, and ongoing mentorship support",
    },
  ];

  const stats = [
    { value: "10K+", label: "Active Mentors" },
    { value: "50K+", label: "Successful Matches" },
    { value: "95%", label: "Satisfaction Rate" },
    { value: "100+", label: "Skills Covered" },
  ];
  const router = useRouter();

  return (
    <PageWrapper className="bg-gradient">
      {/* Header */}
      <motion.header
        className="absolute top-0 left-0 right-0 z-10 p-6"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Logo size="md" />
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push("/login")}
              className="hidden sm:flex border border-transparent hover:border-primary text-black font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Button>
            <Button
              onClick={() => router.push("/register")}
              className="border text-black font-semibold px-5 py-2 rounded-lg bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary transition-colors shadow"
            >
              Get Started
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="absolute inset-0 bg-white" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-black leading-tight">
              Find Your Perfect
              <br />
              <span className="bg-clip-text text-black">Mentor</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect with industry experts, accelerate your learning, and
              achieve your career goals with personalized mentorship.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <GradientButton
                variant="hero"
                size="xl"
                onClick={() => router.push("/register")}
                className="group bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary transition-colors shadow"
              >
                Join for Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </GradientButton>

              <GradientButton
                variant="outline"
                size="xl"
                onClick={() => router.push("/login")}
                className="hover:text-black"
              >
                Already have an account? Log In
              </GradientButton>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center border-2 rounded-lg p-2"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <div className="text-3xl md:text-4xl font-bold bg-clip-text text-black">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose{" "}
              <span className="text-gray-400 bg-clip-text">MentorConnect</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We make meaningful mentorship connections that drive real results
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group p-8 rounded-xl shadow shadow-soft hover:shadow-medium transition-all duration-300"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                whileHover={{ y: -5 }}
              >
                <div className="mb-6">
                  <div className="w-14 h-14 bg-gray-700 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center gradient-card rounded-2xl p-12 shadow-strong"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center mb-6">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="h-6 w-6 text-yellow-400 fill-current"
                />
              ))}
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have accelerated their growth
            with expert mentorship
          </p>
          <GradientButton
            variant="hero"
            size="xl"
            onClick={() => router.push("/register")}
            className="group"
          >
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </GradientButton>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground mt-4">
            © 2024 MentorConnect. Empowering careers through meaningful
            connections.
          </p>
        </div>
      </footer>
    </PageWrapper>
  );
};

export default Landing;
