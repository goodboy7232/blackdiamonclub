import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ParticleBackground } from "@/components/shared/ParticleBackground";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          localStorage.setItem("bdc_token", data.token);
          queryClient.setQueryData(getGetMeQueryKey(), data.user);
          toast.success("Welcome to BlackDiamondClub");
          setLocation("/");
        },
        onError: (error) => {
          toast.error(error.data?.error || "Failed to login");
        },
      }
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background relative overflow-hidden px-4">
      <ParticleBackground />
      
      <div className="z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-heading font-bold tracking-widest text-white mb-2">
            BLACK<span className="text-primary text-glow">DIAMOND</span>
          </h1>
          <p className="text-primary font-medium tracking-widest text-sm">ELITE GAMBLING CLUB</p>
        </div>

        <div className="glass-gold p-8 rounded-2xl">
          <h2 className="text-2xl font-heading font-semibold text-white mb-6">Sign In</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        data-testid="input-username"
                      />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-gray-300">Password</FormLabel>
                      <Link href="/recover">
                        <span className="text-xs text-primary hover:text-white transition-colors cursor-pointer" data-testid="link-recover">
                          Forgot Password?
                        </span>
                      </Link>
                    </div>
                    <FormControl>
                      <Input 
                        type="password" 
                        {...field} 
                        className="bg-black/50 border-white/10 text-white focus:border-primary focus:ring-primary/50" 
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-primary text-black font-semibold hover:bg-primary/90 neon-border py-6"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "AUTHENTICATING..." : "ENTER THE CLUB"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <span className="text-gray-400 text-sm">Not a member yet? </span>
            <Link href="/register">
              <span className="text-primary hover:text-white text-sm font-medium transition-colors cursor-pointer" data-testid="link-register">
                Request Access
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}