import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  useGetMe, getGetMeQueryKey, 
  useGetProfileStats, getGetProfileStatsQueryKey,
  useUpdateProfile,
  useLogout
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, Mail, Phone, Lock, LogOut, ShieldAlert, FileText, ChevronDown } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const profileSchema = z.object({
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Must be at least 6 characters").optional().or(z.literal("")),
});

export default function Profile() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: stats } = useGetProfileStats({ query: { queryKey: getGetProfileStatsQueryKey() } });
  
  const updateMutation = useUpdateProfile();
  const logoutMutation = useLogout();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: "",
      phone: "",
      currentPassword: "",
      newPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email || "",
        phone: "", // Add if it was in user object
        currentPassword: "",
        newPassword: "",
      });
    }
  }, [user, form]);

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    updateMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast.success("Profile updated successfully");
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          form.setValue("currentPassword", "");
          form.setValue("newPassword", "");
        },
        onError: () => toast.error("Update failed")
      }
    );
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("bdc_token");
        queryClient.clear();
        setLocation("/login");
      }
    });
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto px-4 md:px-8 lg:px-12 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-heading font-bold text-white">Profile</h1>
          <p className="text-gray-400">Manage your VIP account settings.</p>
        </div>
        <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive hover:text-white" onClick={handleLogout} disabled={logoutMutation.isPending} data-testid="btn-logout">
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col - Stats */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-4xl font-heading font-bold text-primary mb-4 box-glow">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <h2 className="text-xl font-heading font-bold text-white mb-1">{user?.username}</h2>
            <p className="text-sm text-primary font-medium tracking-widest uppercase">Elite Member</p>
          </div>

          <div className="glass-gold p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-heading font-bold text-white border-b border-white/10 pb-2">Game Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Bets</p>
                <p className="text-xl font-mono text-white">{stats?.totalBets || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Win Rate</p>
                <p className="text-xl font-mono text-success">{stats?.winRate?.toFixed(1) || 0}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Wins</p>
                <p className="text-xl font-mono text-success">{stats?.totalWins || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Biggest Win</p>
                <p className="text-xl font-mono text-primary">${stats?.biggestWin?.toFixed(2) || "0.00"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col - Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass p-8 rounded-2xl">
            <h3 className="text-xl font-heading font-bold text-white mb-6">Account Settings</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-400">Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                            <Input {...field} className="pl-10 bg-black/50 border-white/10 text-white" data-testid="input-prof-email" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-400">Phone Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                            <Input {...field} className="pl-10 bg-black/50 border-white/10 text-white" data-testid="input-prof-phone" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t border-white/10 pt-6 mt-6">
                  <h4 className="text-sm font-medium text-white mb-4">Change Password</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-400">Current Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                              <Input type="password" {...field} className="pl-10 bg-black/50 border-white/10 text-white" data-testid="input-prof-currpass" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-400">New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <ShieldAlert className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                              <Input type="password" {...field} className="pl-10 bg-black/50 border-white/10 text-white" data-testid="input-prof-newpass" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button type="submit" className="bg-primary text-black font-bold hover:bg-primary/90 neon-border" disabled={updateMutation.isPending} data-testid="btn-save-profile">
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </div>

          <div className="glass p-8 rounded-2xl">
            <h3 className="text-xl font-heading font-bold text-white mb-6">Help & Legal</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-white/10">
                <AccordionTrigger className="text-gray-300 hover:text-white">How do deposits work?</AccordionTrigger>
                <AccordionContent className="text-gray-400 leading-relaxed">
                  We currently support USDT on the BEP20 network. You will be provided a unique wallet address and QR code. Transfer funds and upload a screenshot of the transaction. Our system will review and credit your account typically within 15 minutes.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-white/10">
                <AccordionTrigger className="text-gray-300 hover:text-white">Withdrawal times & limits</AccordionTrigger>
                <AccordionContent className="text-gray-400 leading-relaxed">
                  Minimum withdrawal is $10. Withdrawals are processed to the BEP20 wallet address you provide. Most withdrawals are approved and sent within 1-2 hours, depending on network congestion.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-white/10">
                <AccordionTrigger className="text-gray-300 hover:text-white">Privacy Policy</AccordionTrigger>
                <AccordionContent className="text-gray-400 leading-relaxed text-sm">
                  We take your privacy seriously. All data is encrypted and stored securely. We do not sell your personal information to third parties. For full details, contact our elite support team.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4" className="border-white/10">
                <AccordionTrigger className="text-gray-300 hover:text-white">Terms & Conditions</AccordionTrigger>
                <AccordionContent className="text-gray-400 leading-relaxed text-sm">
                  By playing on BlackDiamondClub, you agree that you are over 18 years of age and gambling is legal in your jurisdiction. The club reserves the right to suspend accounts engaged in fraudulent behavior.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}