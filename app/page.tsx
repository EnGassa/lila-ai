import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // Smart Redirect Pattern: 
    // Check status directly here to avoid double-redirect (Landing -> Onboarding -> Dashboard)
    const { data: user } = await supabase
      .from('users')
      .select('onboarding_status')
      .eq('id', session.user.id)
      .single();

    if (user?.onboarding_status === 'complete') {
        redirect("/dashboard");
    } else {
        redirect("/onboarding");
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="px-6 h-16 flex items-center justify-between border-b border-border/40">
        <div className="font-serif text-2xl tracking-tight font-medium text-primary">
          Lila Skin
        </div>
        <nav className="flex gap-4">
          {/* Admin Login hidden for now */}
          <Button variant="ghost" className="text-muted-foreground hover:text-primary font-medium" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto space-y-8 py-20">
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Dermatology</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tight text-primary leading-[1.1]">
            Your personal <br className="hidden md:block" />
            <span className="italic block mt-1 text-accent">AI Dermatologist</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Clinical-grade skin analysis in your pocket. Get personalized routines,
            track progress, and discover what truly works for your unique skin profile.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
          {/* Main CTA */}
          <Button size="lg" className="h-12 px-8 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" asChild>
            <Link href="/login">
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40">
        <p>© 2025 Lila Skin. All rights reserved.</p>
      </footer>
    </div>
  );
}
