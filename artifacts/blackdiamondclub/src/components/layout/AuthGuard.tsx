import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

export function AuthGuard({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading, isError } = useGetMe({
    query: {
      retry: false,
      queryKey: getGetMeQueryKey(),
    }
  });

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      setLocation("/login");
    }
  }, [isLoading, isError, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-t-2 border-primary animate-spin"></div>
          <p className="mt-4 text-primary font-heading tracking-widest text-sm">AUTHENTICATING</p>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return null;
  }

  return <>{children}</>;
}
