import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { MatrixBackground } from "./matrix-background";
import { Terminal, Star, Trophy, MessageSquare, Home, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const isAuthPage = location.startsWith('/auth');

  return (
    <div className="min-h-[100dvh] w-full flex justify-center bg-[#060907] text-foreground font-sans dark">
      <MatrixBackground />

      <div className="w-full max-w-[430px] relative flex flex-col min-h-[100dvh]" style={{ zIndex: 1 }}>

        {!isAuthPage && (
          <header className="flex-none sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
            style={{
              background: 'rgba(5,9,6,0.88)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(0,255,65,0.08)',
              boxShadow: '0 1px 0 rgba(0,255,65,0.04)',
            }}>
            <Link href="/" className="flex items-center gap-2.5 group" data-testid="link-home">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.2)' }}>
                <Terminal className="w-4 h-4 text-primary" />
              </div>
              <span className="font-mono font-bold text-base tracking-tight text-gradient-green">
                CodeBuddy
              </span>
            </Link>

            {isAuthenticated ? (
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs btn-press"
                style={{
                  background: 'rgba(255,60,60,0.07)',
                  border: '1px solid rgba(255,60,60,0.18)',
                  color: 'rgba(255,100,100,0.7)',
                }}
                data-testid="btn-logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                Çıkış
              </button>
            ) : (
              <div className="tag-pill">v1.0</div>
            )}
          </header>
        )}

        <main className="flex-1 overflow-y-auto pb-24 px-4 pt-5">
          {children}
        </main>

        {!isAuthPage && isAuthenticated && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-20"
            style={{
              background: 'rgba(4,8,5,0.94)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderTop: '1px solid rgba(0,255,65,0.08)',
              boxShadow: '0 -4px 30px rgba(0,0,0,0.6)',
            }}>
            <ul className="flex items-center justify-around px-2 py-2">
              <NavItem href="/" icon={<Home className="w-5 h-5" />} label="Ana Sayfa" active={location === '/'} />
              <NavItem href="/favorites" icon={<Star className="w-5 h-5" />} label="Favoriler" active={location === '/favorites'} />
              <NavItem href="/scores" icon={<Trophy className="w-5 h-5" />} label="Quizler" active={location.startsWith('/scores') || location.startsWith('/quiz')} />
              <NavItem href="/chat" icon={<MessageSquare className="w-5 h-5" />} label="Sohbet" active={location.startsWith('/chat')} />
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
      <Link
        href={href}
        className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all btn-press"
        style={{
          color: active ? '#00ff41' : 'rgba(180,200,185,0.45)',
          background: active ? 'rgba(0,255,65,0.07)' : 'transparent',
        }}
        data-testid={`nav-${label.toLowerCase().replace(' ', '-')}`}
      >
        {icon}
        <span className="text-[10px] font-mono font-medium tracking-wide">{label}</span>
      </Link>
    </li>
  );
}
