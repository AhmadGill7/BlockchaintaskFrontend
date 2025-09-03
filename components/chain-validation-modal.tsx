"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useChainValidation } from "@/hooks/use-chain-validation";

interface ChainValidationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  force?: boolean; // If true, user cannot close the modal
}

export function ChainValidationModal({ open, onOpenChange, force = false }: ChainValidationModalProps) {
  const {
    isWrongChain,
    currentChainName,
    requiredChainName,
    switchToBSCTestnet,
    isSwitching,
    switchError,
  } = useChainValidation();

  if (!isWrongChain && !force) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={force ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={force ? (e) => e.preventDefault() : undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Wrong Network Detected
          </DialogTitle>
          <DialogDescription>
            You must connect to BSC Testnet to use this application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-orange-800">
              <div className="space-y-1">
                <p><strong>Current Network:</strong> {currentChainName}</p>
                <p><strong>Required Network:</strong> {requiredChainName}</p>
              </div>
            </AlertDescription>
          </Alert>

          {switchError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                Failed to switch network. Please try again or switch manually in your wallet.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-600">
            <p><strong>BSC Testnet Details:</strong></p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• <strong>Network Name:</strong> BSC Testnet</li>
              <li>• <strong>RPC URL:</strong> https://data-seed-prebsc-1-s1.binance.org:8545/</li>
              <li>• <strong>Chain ID:</strong> 97</li>
              <li>• <strong>Currency Symbol:</strong> BNB</li>
              <li>• <strong>Block Explorer:</strong> https://testnet.bscscan.com</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col space-y-2">
          <Button
            onClick={switchToBSCTestnet}
            disabled={isSwitching}
            className="w-full"
          >
            {isSwitching ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Switching Network...
              </>
            ) : (
              "Switch to BSC Testnet"
            )}
          </Button>
          
          {!force && (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              I'll Switch Manually
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
