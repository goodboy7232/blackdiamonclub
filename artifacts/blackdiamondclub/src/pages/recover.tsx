import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRecoverAccount } from "@workspace/api-client-react";
import { toast } from "sonner";
import { ParticleBackground } from "@/components/shared/ParticleBackground";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const recoverSchema = z.object({
  username: z.string().min(1, "Username is required"),
  recoveryAnswer: z.string().min(1, "Answer is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export default function Recover() {
  const [, setLocation] = useLocation();
  const recoverMutation = useRecoverAccount();

  const form = useForm<z.infer<typeof recoverSchema>>({
    resolver: zodResolver(recoverSchema),
    defaultValues: {
      username: "",
      recoveryAnswer: "",
      newPassword: "",
    },
  });

  function onSubmit(values: z.infer<typeof recoverSchema>) {
    recoverMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast.success("Password reset successful. Please sign in.");
          setLocation("/login");
        },
        onError: (error) => {
          toast.error(error.data?.error || "Failed to recover account");
        },
      }
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background relative overflow-hidden px-4">
      <ParticleBackground />
      
      <div className="z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold tracking-widest text-white mb-2">
            BLACK<span className="text-primary text-glow">DIAMOND</span>
          </h1>
          <p className="text-primary font-medium tracking-widest text-xs">ACCOUNT RECOVERY</p>
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
                        data-testid="input-rec-username"
                      />
                    </FormControl>
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
                        data-testid="input-rec-answer"
                      />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        {...field} 
                        className="bg-black/50 border-white/10 text-white focus:border-primary focus:ring-primary/50" 
                        data-testid="input-rec-newpassword"
                      />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-primary text-black font-semibold hover:bg-primary/90 neon-border py-6 mt-4"
                disabled={recoverMutation.isPending}
                data-testid="button-recover"
              >
                {recoverMutation.isPending ? "VERIFYING..." : "RESET PASSWORD"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link href="/login">
              <span className="text-primary hover:text-white text-sm font-medium transition-colors cursor-pointer" data-testid="link-back-login">
                Back to Sign In
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}