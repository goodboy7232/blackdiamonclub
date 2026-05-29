import { Link, useLocation } from "wouter";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ParticleBackground } from "@/components/shared/ParticleBackground";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-400" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-400" };
  return { score, label: "Strong", color: "bg-green-500" };
}

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  recoveryQuestion: z.string().min(1, "Please select a recovery question"),
  recoveryAnswer: z.string().min(1, "Answer is required"),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const registerMutation = useRegister();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      recoveryQuestion: "",
      recoveryAnswer: "",
    },
  });

  function onSubmit(values: z.infer<typeof registerSchema>) {
    registerMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          localStorage.setItem("bdc_token", data.token);
          queryClient.setQueryData(getGetMeQueryKey(), data.user);
          toast.success("Membership approved. Welcome to the Club.");
          setLocation("/");
        },
        onError: (error) => {
          toast.error(error.data?.error || "Failed to register");
        },
      }
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background relative overflow-hidden px-4 py-8">
      <ParticleBackground />
      
      <div className="z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold tracking-widest text-white mb-2">
            BLACK<span className="text-primary text-glow">DIAMOND</span>
          </h1>
          <p className="text-primary font-medium tracking-widest text-xs">MEMBERSHIP APPLICATION</p>
        </div>

        <div className="glass-gold p-8 rounded-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Username</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-black/50 border-white/10 text-white focus:border-primary focus:ring-primary/50" 
                        data-testid="input-reg-username"
                      />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => {
                  const strength = getPasswordStrength(field.value || "");
                  return (
                    <FormItem>
                      <FormLabel className="text-gray-300">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            {...field} 
                            className="bg-black/50 border-white/10 text-white focus:border-primary focus:ring-primary/50 pr-10" 
                            data-testid="input-reg-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </FormControl>
                      {field.value && (
                        <div className="space-y-1.5 mt-1.5">
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map((s) => (
                              <div
                                key={s}
                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                  s <= strength.score ? strength.color : "bg-white/10"
                                }`}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Shield size={11} className={
                              strength.score >= 4 ? "text-green-400" :
                              strength.score >= 3 ? "text-yellow-400" :
                              "text-red-400"
                            } />
                            <span className="text-[10px] text-white/50">{strength.label} password</span>
                          </div>
                        </div>
                      )}
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="recoveryQuestion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Recovery Question</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black/50 border-white/10 text-white focus:ring-primary/50" data-testid="select-recovery-q">
                          <SelectValue placeholder="Select a question" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-white/10 text-white">
                        <SelectItem value="Mother's maiden name">Mother's maiden name</SelectItem>
                        <SelectItem value="First pet's name">First pet's name</SelectItem>
                        <SelectItem value="Childhood nickname">Childhood nickname</SelectItem>
                        <SelectItem value="Favorite teacher">Favorite teacher</SelectItem>
                        <SelectItem value="Birth city">Birth city</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recoveryAnswer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Recovery Answer</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-black/50 border-white/10 text-white focus:border-primary focus:ring-primary/50" 
                        data-testid="input-recovery-answer"
                      />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-primary text-black font-semibold hover:bg-primary/90 neon-border py-6 mt-4"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? "PROCESSING..." : "JOIN THE CLUB"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <span className="text-gray-400 text-sm">Already a member? </span>
            <Link href="/login">
              <span className="text-primary hover:text-white text-sm font-medium transition-colors cursor-pointer" data-testid="link-login">
                Sign In
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}