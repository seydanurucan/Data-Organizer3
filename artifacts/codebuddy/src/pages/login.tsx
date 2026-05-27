import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Terminal, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setToken } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        setToken(res.token);
        toast({
          title: "Access granted.",
          description: "Welcome to the mainframe.",
        });
        setLocation("/");
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Access denied.",
          description: "Invalid credentials.",
        });
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Terminal className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gradient font-mono">System Login</h1>
          <p className="text-muted-foreground text-sm mt-2">Identify yourself to proceed.</p>
        </div>

        <div className="glass-card p-6 rounded-2xl glow-border">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground font-mono">EMAIL</FormLabel>
                    <FormControl>
                      <Input placeholder="user@system.net" className="bg-black/50 border-white/10 focus-visible:ring-primary text-primary font-mono" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground font-mono">PASSWORD</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          className="bg-black/50 border-white/10 focus-visible:ring-primary text-primary font-mono pr-10" 
                          {...field} 
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                          data-testid="btn-toggle-password"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full mt-6 bg-primary hover:bg-primary/80 text-black font-bold font-mono active:scale-95 transition-transform" 
                disabled={loginMutation.isPending}
                data-testid="btn-login-submit"
              >
                {loginMutation.isPending ? "AUTHENTICATING..." : <><LogIn className="w-4 h-4 mr-2" /> AUTHENTICATE</>}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            No access codes? <Link href="/auth/register" className="text-primary hover:underline" data-testid="link-register">Request clearance</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
