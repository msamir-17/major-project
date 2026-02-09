"use client";

import React from "react";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";
import PageWrapper from "@/components/PageWrapper";
import { ArrowLeft, Loader2, User, Briefcase } from "lucide-react";
import { RegisterData } from "@/types";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useForm } from "@/hooks";

const Register: React.FC = () => {
  const router = useRouter();
  const {
    register: registerUser,
    error: authError,
    isLoading,
    clearError,
  } = useAuth();

  const redirectUser = (userRole: string) => {
    switch (userRole) {
      case "mentor":
        router.push("/mentor");
        break;
      case "learner":
        router.push("/user");
        break;
      default:
        router.push("/");
    }
  };

  // Form validation
  const validateForm = (values: RegisterData) => {
    const errors: Record<string, string> = {};

    // Basic validation
    if (!values.full_name.trim()) errors.full_name = "Full name is required";
    if (!values.email.trim()) errors.email = "Email is required";
    if (!/\S+@\S+\.\S+/.test(values.email))
      errors.email = "Invalid email format";
    // Enhanced password validation
    if (!values.password) {
      errors.password = "Password is required";
    } else {
      if (values.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      } else if (values.password.length > 128) {
        errors.password = "Password is too long (max 128 characters)";
      } else if (new TextEncoder().encode(values.password).length > 72) {
        errors.password = "Password contains too many special characters";
      } else {
        // Check for strength
        const hasUpper = /[A-Z]/.test(values.password);
        const hasLower = /[a-z]/.test(values.password);
        const hasDigit = /\d/.test(values.password);

        if (!hasUpper || !hasLower || !hasDigit) {
          errors.password =
            "Password should contain uppercase, lowercase, and numeric characters";
        }
      }
    }

    // Mentor-specific validation
    if (values.is_mentor) {
      if (!values.skills?.trim())
        errors.skills = "Skills are required for mentors";
      if (!values.expertise?.trim())
        errors.expertise = "Expertise is required for mentors";
      if (!values.experience_years || values.experience_years < 1) {
        errors.experience_years = "Experience years must be at least 1";
      }
      if (!values.languages_spoken?.trim())
        errors.languages_spoken = "Languages spoken is required for mentors";
    }

    return errors;
  };

  // Form hook
  const {
    values: formData,
    errors,
    handleChange,
    handleSubmit,
    setFieldValue,
  } = useForm<RegisterData>({
    initialValues: {
      full_name: "",
      email: "",
      password: "",
      phone_number: "",
      profile_picture_url: "",
      bio: "",
      location: "",
      is_mentor: false,
      // Learner fields
      learning_goal: "",
      preferred_language: "English",
      time_zone: "",
      learning_style: "",
      experience_level: "",
      availability: "",
      skills_interested: "",
      current_skills: "",
      // Mentor fields
      skills: "",
      expertise: "",
      experience_years: 0,
      languages_spoken: "English",
      mentor_availability: "",
      hourly_rate: 0,
      linkedin_url: "",
      company: "",
      job_title: "",
    },
    validate: validateForm,
    onSubmit: async (data) => {
      try {
        clearError();
        const result = await registerUser(data);

        // Navigate based on user role after successful registration
        if (result && result.user) {
          // Show success message briefly before redirecting
          setTimeout(() => {
            redirectUser(result.user.role);
          }, 1000);
        } else {
          // Fallback - navigate based on form data
          const role = data.is_mentor ? "mentor" : "learner";
          setTimeout(() => {
            redirectUser(role);
          }, 1000);
        }
      } catch (error) {
        // Error handled by context
        console.error("Registration failed:", error);
      }
    },
  });

  return (
    <PageWrapper>
      <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-left mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-primary hover:text-primary-dark transition-colors mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>

              <h1 className="mt-6 text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {formData.is_mentor ? 'Become a Mentor' : 'Start Your Learning Journey'}
              </h1>
              <p className="mt-3 text-lg text-muted-foreground max-w-md mx-auto">
                {formData.is_mentor
                  ? 'Share your expertise and guide the next generation of talent.'
                  : 'Connect with expert mentors to achieve your career goals.'}
              </p>
            </div>

            {/* Role Selection Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Button
                className={`cursor-pointer transition-all duration-300 ${
                  !formData.is_mentor
                    ? "ring-2 ring-primary shadow-lg scale-105"
                    : "hover:shadow-md hover:scale-102"
                }`}
                onClick={() => setFieldValue("is_mentor", false)}
              >
                Learner
              </Button>

              <Button
                className={`cursor-pointer transition-all duration-300 ${
                  formData.is_mentor
                    ? "ring-2 ring-accent shadow-lg scale-105"
                    : "hover:shadow-md hover:scale-102"
                }`}
                onClick={() => setFieldValue("is_mentor", true)}
              >
                Mentor
              </Button>
            </div>

            {/* Registration Form */}
            <Card className="shadow-xl w-full max-w-5xl mx-auto">
              {" "}
              {/* Add width constraints */}{" "}
              <CardContent className="p-8">
                {/* Display auth error */}
                {authError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Basic Information */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h3 className="text-2xl font-semibold mb-6 pb-2 border-b border-gray-200">
                      Basic Information
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          className="mt-1"
                        />
                        {errors.full_name && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.full_name}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your.email@example.com"
                          className="mt-1"
                        />
                        {errors.email && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Create a strong password"
                          className="mt-1"
                        />
                        {errors.password && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.password}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                          id="phone_number"
                          name="phone_number"
                          type="tel"
                          value={formData.phone_number || ""}
                          onChange={handleChange}
                          placeholder="+1 (555) 123-4567"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          name="location"
                          value={formData.location || ""}
                          onChange={handleChange}
                          placeholder="City, Country"
                          className="mt-1"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={formData.bio || ""}
                          onChange={handleChange}
                          placeholder="Tell us about yourself..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Learner-specific fields */}
                  {!formData.is_mentor && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <h3 className="text-2xl font-semibold mb-6 pb-2 border-b border-gray-200">
                        Learning Profile
                      </h3>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="learning_goal">Learning Goal</Label>
                          <Input
                            id="learning_goal"
                            name="learning_goal"
                            value={formData.learning_goal || ""}
                            onChange={handleChange}
                            placeholder="What do you want to achieve?"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="experience_level">
                            Experience Level
                          </Label>
                          <select
                            id="experience_level"
                            name="experience_level"
                            value={formData.experience_level || ""}
                            onChange={handleChange}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Select your level</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="learning_style">
                            Preferred Learning Style
                          </Label>
                          <select
                            id="learning_style"
                            name="learning_style"
                            value={formData.learning_style || ""}
                            onChange={handleChange}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Select style</option>
                            <option value="visual">Visual</option>
                            <option value="hands-on">Hands-on</option>
                            <option value="theoretical">Theoretical</option>
                            <option value="project-based">Project-based</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="availability">Availability</Label>
                          <Input
                            id="availability"
                            name="availability"
                            value={formData.availability || ""}
                            onChange={handleChange}
                            placeholder="e.g., Evenings, Weekends"
                            className="mt-1"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="skills_interested">
                            Skills You Want to Learn
                          </Label>
                          <Textarea
                            id="skills_interested"
                            name="skills_interested"
                            value={formData.skills_interested || ""}
                            onChange={handleChange}
                            placeholder="e.g., React, Python, Data Science, UI/UX Design"
                            rows={2}
                            className="mt-1"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="current_skills">Current Skills</Label>
                          <Textarea
                            id="current_skills"
                            name="current_skills"
                            value={formData.current_skills || ""}
                            onChange={handleChange}
                            placeholder="What skills do you already have?"
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Mentor-specific fields */}
                  {formData.is_mentor && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <h3 className="text-2xl font-semibold mb-6 pb-2 border-b border-gray-200">
                        Mentor Profile
                      </h3>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <Label htmlFor="skills">Your Skills *</Label>
                          <Textarea
                            id="skills"
                            name="skills"
                            value={formData.skills || ""}
                            onChange={handleChange}
                            placeholder="e.g., JavaScript, React, Node.js, Python, Machine Learning"
                            rows={2}
                            className="mt-1"
                          />
                          {errors.skills && (
                            <p className="text-sm text-red-600 mt-1">
                              {errors.skills}
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="expertise">
                            Areas of Expertise *
                          </Label>
                          <Textarea
                            id="expertise"
                            name="expertise"
                            value={formData.expertise || ""}
                            onChange={handleChange}
                            placeholder="e.g., Full-Stack Development, Data Science, Product Management"
                            rows={2}
                            className="mt-1"
                          />
                          {errors.expertise && (
                            <p className="text-sm text-red-600 mt-1">
                              {errors.expertise}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="experience_years">
                            Years of Experience *
                          </Label>
                          <Input
                            id="experience_years"
                            name="experience_years"
                            type="number"
                            min="1"
                            max="50"
                            value={formData.experience_years || ""}
                            onChange={handleChange}
                            placeholder="5"
                            className="mt-1"
                          />
                          {errors.experience_years && (
                            <p className="text-sm text-red-600 mt-1">
                              {errors.experience_years}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="languages_spoken">
                            Languages Spoken *
                          </Label>
                          <Input
                            id="languages_spoken"
                            name="languages_spoken"
                            value={formData.languages_spoken || ""}
                            onChange={handleChange}
                            placeholder="English, Spanish, French"
                            className="mt-1"
                          />
                          {errors.languages_spoken && (
                            <p className="text-sm text-red-600 mt-1">
                              {errors.languages_spoken}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="mentor_availability">
                            Availability
                          </Label>
                          <Input
                            id="mentor_availability"
                            name="mentor_availability"
                            value={formData.mentor_availability || ""}
                            onChange={handleChange}
                            placeholder="Weekdays 6-8 PM EST"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="hourly_rate">Hourly Rate (USD)</Label>
                          <Input
                            id="hourly_rate"
                            name="hourly_rate"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.hourly_rate || ""}
                            onChange={handleChange}
                            placeholder="50.00 (0 for free mentoring)"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="company">Current Company</Label>
                          <Input
                            id="company"
                            name="company"
                            value={formData.company || ""}
                            onChange={handleChange}
                            placeholder="Google, Microsoft, etc."
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="job_title">Job Title</Label>
                          <Input
                            id="job_title"
                            name="job_title"
                            value={formData.job_title || ""}
                            onChange={handleChange}
                            placeholder="Senior Software Engineer"
                            className="mt-1"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
                          <Input
                            id="linkedin_url"
                            name="linkedin_url"
                            type="url"
                            value={formData.linkedin_url || ""}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/yourprofile"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="pt-6 border-t border-gray-200"
                  >
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent-dark text-white py-3 text-lg font-medium"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating Your Account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
                        </>
                      )}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Already have an account?{" "}
                      <Link
                        href="/login"
                        className="text-primary hover:text-primary-dark font-medium hover:underline"
                      >
                        Sign in here
                      </Link>
                    </p>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 items-center justify-center p-12">
          <motion.div
            className="text-center max-w-md"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="text-6xl mb-6">💡</div>
            <h3 className="text-2xl font-bold mb-4">Continue Your Journey</h3>
            <p className="text-muted-foreground leading-relaxed">
              Welcome back to your mentorship journey. Connect with your
              mentors, continue learning, and achieve your professional goals.
            </p>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Register;
