"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ChainGuardProps {
  children: React.ReactNode;
}

export function ChainGuard({ children }: ChainGuardProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return <>{children}</>;

  if (chainId !== bscTestnet.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Switch to BSC Testnet</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => switchChain({ chainId: bscTestnet.id })}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? "Switching..." : "Switch Network"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
