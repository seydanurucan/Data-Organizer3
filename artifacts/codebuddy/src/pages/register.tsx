import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Terminal, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";

const schema = z.object({
  email: z.string().email("Geçersiz e-posta adresi"),
  username: z.string().min(2, "Kullanıcı adı en az 2 karakter olmalı"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setToken } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const registerMutation = useRegister();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", username: "", password: "" },
  });

  const onSubmit = (values: FormValues) => {
    registerMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        setToken(res.token);
        toast({ title: "Kayıt başarılı.", description: "Sisteme hoşgeldiniz." });
        setLocation("/");
      },
      onError: () => {
        toast({ variant: "destructive", title: "Kayıt başarısız.", description: "Bu e-posta adresi zaten kullanılıyor." });
      },
    });
  };

  const fieldStyle = {
    background: 'rgba(0,0,0,0.5)',
    border: '1px solid rgba(0,255,65,0.12)',
    color: 'rgba(220,240,225,0.9)',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4"
      style={{ background: 'rgba(4,8,5,0.6)', backdropFilter: 'blur(2px)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.2)', boxShadow: '0 0 40px rgba(0,255,65,0.08)' }}>
            <Terminal className="w-7 h-7" style={{ color: '#00ff41' }} />
          </div>
          <h1 className="text-2xl font-bold font-mono text-gradient-green tracking-tight">CodeBuddy</h1>
          <p className="text-sm mt-1 font-mono" style={{ color: 'rgba(160,190,168,0.55)' }}>
            Yeni hesap oluşturun
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 glass-card-strong glow-border">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div className="space-y-1.5">
              <label className="text-xs font-mono tracking-widest" style={{ color: 'rgba(160,190,168,0.55)' }}>E-POSTA</label>
              <input
                {...register("email")}
                type="email"
                placeholder="kullanici@sistem.net"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none transition-all"
                style={fieldStyle}
                onFocus={e => (e.target.style.borderColor = 'rgba(0,255,65,0.4)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(0,255,65,0.12)')}
                data-testid="input-email"
              />
              {errors.email && <p className="text-xs font-mono" style={{ color: '#ff5555' }}>{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono tracking-widest" style={{ color: 'rgba(160,190,168,0.55)' }}>KULLANICI ADI</label>
              <input
                {...register("username")}
                type="text"
                placeholder="matrix_kullanici"
                autoComplete="username"
                className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none transition-all"
                style={fieldStyle}
                onFocus={e => (e.target.style.borderColor = 'rgba(0,255,65,0.4)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(0,255,65,0.12)')}
                data-testid="input-username"
              />
              {errors.username && <p className="text-xs font-mono" style={{ color: '#ff5555' }}>{errors.username.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono tracking-widest" style={{ color: 'rgba(160,190,168,0.55)' }}>ŞİFRE</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm font-mono outline-none transition-all"
                  style={fieldStyle}
                  onFocus={e => (e.target.style.borderColor = 'rgba(0,255,65,0.4)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(0,255,65,0.12)')}
                  data-testid="input-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'rgba(160,190,168,0.4)' }} data-testid="btn-toggle-password">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs font-mono" style={{ color: '#ff5555' }}>{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full py-3.5 rounded-xl font-mono font-bold text-sm tracking-widest btn-press mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: registerMutation.isPending ? 'rgba(0,180,40,0.4)' : 'linear-gradient(135deg, #00e838, #00cc2e)',
                color: '#020902',
                boxShadow: registerMutation.isPending ? 'none' : '0 0 20px rgba(0,255,65,0.2)',
                letterSpacing: '0.1em',
              }}
              data-testid="btn-register-submit"
            >
              {registerMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#020902]/40 border-t-[#020902] rounded-full animate-spin" />
                  KAYIT EDILIYOR...
                </>
              ) : (
                <><UserPlus className="w-4 h-4" /> KAYIT OL</>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 text-center text-xs font-mono"
            style={{ borderTop: '1px solid rgba(0,255,65,0.07)', color: 'rgba(140,170,148,0.5)' }}>
            Zaten hesabınız var mı?{" "}
            <Link href="/auth/login" style={{ color: '#00ff41' }} data-testid="link-login">Giriş yap</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
