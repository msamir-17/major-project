"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import { GradientButton } from '@/components/ui/gradient-button';
import PageWrapper from '@/components/PageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageCircle, Users, TrendingUp, User, LogOut, Star, Clock, DollarSign, BookOpen, MoreHorizontal, Bell, Settings, BarChart3, Video, Mail, MessageSquare, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const MentorDashboard: React.FC = () => {
  const [sessions, setSessions] = useState([]); // To hold the sessions

  
    useEffect(() => {
      const fetchSessions = async () => {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setSessions(data);
        }
      };
      fetchSessions();
    }, []);
  const { logout } = useAuth();
  // Mock data for mentees and activity
  const recentMentees = [
    {
      id: 1,
      name: "Alex Thompson",
      field: "Frontend Development",
      progress: 85,
      lastSession: "2 days ago",
      avatar: "👨‍💻"
    },
    {
      id: 2,
      name: "Maria Garcia",
      field: "UX Design",
      progress: 72,
      lastSession: "1 week ago", 
      avatar: "👩‍🎨"
    },
    {
      id: 3,
      name: "James Wilson",
      field: "Data Science",
      progress: 90,
      lastSession: "Yesterday",
      avatar: "👨‍🔬"
    }
  ];

  // const upcomingSessions = [
  //   {
  //     mentee: "Alex Thompson",
  //     topic: "Advanced React Patterns",
  //     date: "Today",
  //     time: "3:00 PM"
  //   },
  //   {
  //     mentee: "Maria Garcia", 
  //     topic: "Design System Review",
  //     date: "Tomorrow",
  //     time: "11:00 AM"
  //   },
  //   {
  //     mentee: "James Wilson",
  //     topic: "ML Model Optimization",
  //     date: "Friday",
  //     time: "2:00 PM"
  //   }
  // ];

  const stats = [
    { title: "Total Mentees", value: "24", icon: Users, color: "text-primary" },
    { title: "Sessions This Month", value: "18", icon: Calendar, color: "text-accent" },
    { title: "Average Rating", value: "4.8", icon: Star, color: "text-yellow-500" },
    { title: "Earnings This Month", value: "$1,240", icon: DollarSign, color: "text-green-500" }
  ];

  const recentActivity = [
    { action: "Completed session with Alex Thompson", time: "2 hours ago", type: "session" },
    { action: "New mentee request from Sarah Kim", time: "1 day ago", type: "request" },
    { action: "Payment received: $75", time: "2 days ago", type: "payment" },
    { action: "Profile viewed by 12 potential mentees", time: "3 days ago", type: "view" }
  ];

  return (
    <PageWrapper>
      {/* Header */}
      <header className="border-b border-border/30 bg-gradient-to-r from-background/95 via-background/98 to-background/95 backdrop-blur-md sticky top-0 z-50 shadow-sm" role="banner">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div className="h-6 w-px bg-border/50"></div>
            <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/20 px-3 py-1" aria-label="User role">
              ✨ Mentor
            </Badge>
          </div>
          
          <nav className="flex items-center gap-3" role="navigation" aria-label="User navigation">
            <button 
              className="relative p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 group"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background"></div>
            </button>
            <button 
              className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 group"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
            <div className="h-6 w-px bg-border/50"></div>
            <GradientButton 
              variant="ghost" 
              size="sm" 
              aria-label="User profile" 
              className="bg-muted/30 hover:bg-muted/50 text-foreground border border-border/50 px-4 py-2 rounded-xl transition-all duration-200"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </GradientButton>
            <GradientButton 
              onClick={logout}
              variant="outline" 
              size="sm" 
              aria-label="Logout" 
              className="border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 px-4 py-2 rounded-xl transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </GradientButton>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8" role="main">
        {/* Welcome Section */}
        <motion.section
          className="text-center py-12 px-8 rounded-2xl bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 border border-primary/10 mx-auto max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          aria-labelledby="welcome-heading"
        >
          <h1 id="welcome-heading" className="text-4xl md:text-5xl font-bold mb-4 text-foreground leading-tight">
            Welcome back! <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Ready to inspire</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Transform lives through mentorship. Your guidance shapes the next generation of innovators and future leaders.
          </p>
        </motion.section>


        {/* Stats Grid */}
        <motion.section
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          aria-labelledby="stats-heading"
        >
          <h2 id="stats-heading" className="sr-only">Dashboard Statistics</h2>
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <Card className="relative group overflow-hidden border-0 bg-gradient-to-br from-background to-muted/30 shadow-lg hover:shadow-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/50 focus-within:ring-offset-2">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                      <p className="text-3xl font-bold text-foreground" aria-label={`${stat.title}: ${stat.value}`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-4 rounded-2xl bg-gradient-to-br from-background/50 to-muted/50 border border-border/30`} aria-hidden="true">
                      <stat.icon className={`h-7 w-7 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.section>

        {/* Quick Actions */}
        <motion.section
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          aria-labelledby="quick-actions-heading"
        >
          <h2 id="quick-actions-heading" className="sr-only">Quick Actions</h2>
          
          <GradientButton 
            variant="primary" 
            className="h-20 flex-col gap-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 text-white hover:text-white border-0 bg-gradient-to-br from-primary to-primary/80"
            aria-label="Open schedule management"
          >
            <Calendar className="h-6 w-6 text-white drop-shadow-sm" aria-hidden="true" />
            <span className="text-sm font-medium text-white">Schedule</span>
          </GradientButton>
          
          <GradientButton 
            variant="accent" 
            className="h-20 flex-col gap-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 text-white hover:text-white border-0 bg-gradient-to-br from-accent to-accent/80 hover:from-accent/90 hover:to-accent/90"
            aria-label="Open messages"
          >
            <MessageCircle className="h-6 w-6 text-white drop-shadow-sm" aria-hidden="true" />
            <span className="text-sm font-medium text-white drop-shadow-sm">Messages</span>
          </GradientButton>
          
          <GradientButton 
            variant="outline" 
            className="h-20 flex-col gap-2 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 border-2 border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary bg-gradient-to-br from-primary/5 to-primary/10"
            aria-label="View my mentees"
          >
            <Users className="h-6 w-6" aria-hidden="true" />
            <span className="text-sm font-medium">My Mentees</span>
          </GradientButton>
          
          <GradientButton 
            variant="ghost" 
            className="h-20 flex-col gap-2 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 bg-gradient-to-br from-muted/50 to-muted/30 text-foreground hover:bg-muted hover:text-foreground border border-border/50"
            aria-label="View analytics"
          >
            <TrendingUp className="h-6 w-6 text-foreground" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">Analytics</span>
          </GradientButton>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Mentees */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              aria-labelledby="recent-mentees-heading"
            >
              <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b border-border/30 pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl" id="recent-mentees-heading">
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                      <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    Recent Mentees
                  </CardTitle>
                  <CardDescription className="text-base">
                    Track progress and engage with your most active mentees
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {recentMentees.map((mentee, index) => (
                    <motion.article
                      key={mentee.id}
                      className="group flex items-center gap-4 p-5 rounded-2xl border border-border/30 bg-gradient-to-r from-background to-muted/30 hover:from-primary/5 hover:to-accent/5 hover:shadow-lg transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-primary/50 focus-within:ring-offset-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      whileHover={{ scale: 1.02 }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${mentee.name}'s profile`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          // Handle mentee selection
                        }
                      }}
                    >
                      <div className="text-4xl bg-gradient-to-br from-primary/10 to-accent/10 p-3 rounded-2xl border border-primary/20" aria-hidden="true">
                        {mentee.avatar}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{mentee.name}</h3>
                          <p className="text-sm text-muted-foreground">{mentee.field}</p>
                        </div>
                        <div className="space-y-2" role="progressbar" aria-valuenow={mentee.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress: ${mentee.progress}%`}>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Progress</span>
                            <span className="text-sm font-bold text-primary">{mentee.progress}%</span>
                          </div>
                          <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-700 ease-out shadow-sm" 
                              style={{ width: `${mentee.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last session: <time className="font-medium">{mentee.lastSession}</time>
                        </p>
                      </div>
                      <GradientButton 
                        size="sm" 
                        variant="outline" 
                        aria-label={`View ${mentee.name}'s profile`}
                        className="focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 border-2 border-primary/30 text-primary hover:bg-primary hover:text-white transition-all duration-200 rounded-xl px-4 py-2"
                      >
                        View Profile
                      </GradientButton>
                    </motion.article>
                  ))}
                </CardContent>
              </Card>
            </motion.section>

            {/* Recent Activity */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              aria-labelledby="recent-activity-heading"
            >
              <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-accent/10 via-primary/5 to-accent/10 border-b border-border/30 pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl" id="recent-activity-heading">
                    <div className="p-2 rounded-xl bg-accent/10 border border-accent/20">
                      <TrendingUp className="h-5 w-5 text-accent" aria-hidden="true" />
                    </div>
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="text-base">
                    Stay updated with your latest mentoring activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4" role="list">
                    {recentActivity.map((activity, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-background to-muted/30 hover:from-accent/5 hover:to-primary/5 transition-all duration-300 border border-border/30"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 * index }}
                        role="listitem"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border border-primary/20" aria-hidden="true">
                          {activity.type === 'session' && <BookOpen className="h-5 w-5 text-primary" />}
                          {activity.type === 'request' && <Users className="h-5 w-5 text-accent" />}
                          {activity.type === 'payment' && <DollarSign className="h-5 w-5 text-green-500" />}
                          {activity.type === 'view' && <TrendingUp className="h-5 w-5 text-blue-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{activity.action}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <time className="font-medium">{activity.time}</time>
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6" role="complementary" aria-label="Dashboard sidebar">
            {/* Upcoming Sessions */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              aria-labelledby="upcoming-sessions-heading"
            >
              <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-xl rounded-2xl overflow-hidden">
                 {sessions.length > 0 ? (
          sessions.map((session: any, index: number) => (
            <motion.div key={index} /* ... (rest of the code is the same) ... */ >
              <h4 className="font-medium text-sm">{`Session with Mentor ID: ${session.mentor_id}`}</h4>
              <p className="text-xs text-muted-foreground">
                Status: {session.status}
              </p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-primary">
                  {new Date(session.scheduled_time).toLocaleDateString()}
                </span>
                <span className="text-xs font-medium">
                  {new Date(session.scheduled_time).toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming sessions.</p>
        )}
              </Card>
            </motion.section>

            {/* Performance Overview */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              aria-labelledby="performance-heading"
            >
              <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-accent/10 via-primary/5 to-accent/10 border-b border-border/30 pb-6">
                  <CardTitle className="flex items-center gap-3" id="performance-heading">
                    <div className="p-2 rounded-xl bg-accent/10 border border-accent/20">
                      <TrendingUp className="h-4 w-4 text-accent" aria-hidden="true" />
                    </div>
                    This Month's Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-background to-muted/30 border border-border/30">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-foreground">Sessions Goal</span>
                        <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">18/20</span>
                      </div>
                      <div className="w-full bg-muted/50 rounded-full h-3 shadow-inner" role="progressbar" aria-valuenow={90} aria-valuemin={0} aria-valuemax={100} aria-label="Sessions goal progress: 90%">
                        <div className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-700 shadow-sm" style={{ width: '90%' }}></div>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-background to-muted/30 border border-border/30">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-foreground">Satisfaction Rate</span>
                        <span className="text-sm font-bold text-accent bg-accent/10 px-2 py-1 rounded-lg">96%</span>
                      </div>
                      <div className="w-full bg-muted/50 rounded-full h-3 shadow-inner" role="progressbar" aria-valuenow={96} aria-valuemin={0} aria-valuemax={100} aria-label="Satisfaction rate: 96%">
                        <div className="bg-gradient-to-r from-accent to-primary h-3 rounded-full transition-all duration-700 shadow-sm" style={{ width: '96%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <GradientButton 
                      variant="outline" 
                      size="sm" 
                      className="w-full bg-gradient-to-r from-background to-muted/20 border-2 border-primary/30 text-primary hover:border-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:text-primary transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-md hover:shadow-lg"
                      aria-label="View detailed analytics"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" aria-hidden="true" />
                      View Analytics
                    </GradientButton>
                    <GradientButton 
                      variant="ghost" 
                      size="sm" 
                      className="w-full bg-gradient-to-r from-muted/20 to-background text-foreground hover:bg-gradient-to-r hover:from-muted/40 hover:to-muted/20 border border-border/30 hover:border-border transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-md hover:shadow-lg"
                      aria-label="Update profile information"
                    >
                      <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                      Update Profile
                    </GradientButton>
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          </aside>
        </div>
      </main>
    </PageWrapper>
  );
};

export default MentorDashboard;