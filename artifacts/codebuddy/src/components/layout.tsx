import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { MatrixBackground } from "./matrix-background";
import { Terminal, Star, CheckSquare, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Hide nav on auth pages
  const isAuthPage = location.startsWith('/auth');

  return (
    <div className="min-h-[100dvh] w-full flex justify-center bg-background text-foreground font-sans dark">
      <MatrixBackground />
      <div className="w-full max-w-[430px] relative flex flex-col min-h-[100dvh] bg-background/80 shadow-2xl">
        
        {!isAuthPage && (
          <header className="flex-none p-4 sticky top-0 z-10 glass-card rounded-none border-b border-x-0 border-t-0 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2" data-testid="link-home">
              <Terminal className="w-6 h-6 text-primary" />
              <span className="font-mono font-bold text-lg tracking-tight text-gradient">CodeBuddy</span>
            </Link>
          </header>
        )}

        <main className="flex-1 overflow-y-auto pb-20 p-4">
          {children}
        </main>

        {!isAuthPage && isAuthenticated && (
          <nav className="fixed bottom-0 w-full max-w-[430px] glass-card rounded-none border-t border-x-0 border-b-0 p-2 pb-safe">
            <ul className="flex items-center justify-around">
              <NavItem href="/" icon={<Terminal className="w-5 h-5" />} label="Home" active={location === '/'} />
              <NavItem href="/favorites" icon={<Star className="w-5 h-5" />} label="Saved" active={location === '/favorites'} />
              <NavItem href="/scores" icon={<CheckSquare className="w-5 h-5" />} label="Quizzes" active={location.startsWith('/scores') || location.startsWith('/quiz')} />
              <NavItem href="/chat" icon={<MessageSquare className="w-5 h-5" />} label="Chat" active={location.startsWith('/chat')} />
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: ReactNode; label: string; active: boolean }) {
  return (
    <li>
      <Link href={href} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors active:scale-95 ${active ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'}`} data-testid={`nav-${label.toLowerCase()}`}>
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </Link>
    </li>
  );
}
