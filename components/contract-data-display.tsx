"use client";

import React from 'react';
import { useContract } from '../hooks/use-contract';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { formatEther } from 'viem';

interface ContractDataDisplayProps {
  userAddress?: string;
}

export function ContractDataDisplay({ userAddress }: ContractDataDisplayProps) {
  const {
    // Contract data
    activeProducts,
    contractStats,
    recentPurchases,
    latestDraw,
    
    // User-specific data
    userInfo,
    userReferrer,
    isUserEligibleForDraw,
    
    // Loading states
    isLoadingActiveProducts,
    isLoadingStats,
    isLoadingRecentPurchases,
    isLoadingLatestDraw,
    isLoadingUserInfo,
    
    // Helper functions
    formatPrice,
    
    // Error handling
    error,
  } = useContract(userAddress);

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <p className="text-red-600">Error loading contract data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contract Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <p>Loading stats...</p>
          ) : contractStats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{contractStats.totalUsers.toString()}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{contractStats.totalPurchases.toString()}</p>
                <p className="text-sm text-gray-600">Total Purchases</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{contractStats.totalProducts.toString()}</p>
                <p className="text-sm text-gray-600">Total Products</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{contractStats.eligibleForDraw.toString()}</p>
                <p className="text-sm text-gray-600">Eligible for Draw</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{formatPrice(contractStats.contractBalance)} ETH</p>
                <p className="text-sm text-gray-600">Contract Balance</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{contractStats.totalDraws.toString()}</p>
                <p className="text-sm text-gray-600">Total Draws</p>
              </div>
            </div>
          ) : (
            <p>No stats available</p>
          )}
        </CardContent>
      </Card>

      {/* Active Products */}
      <Card>
        <CardHeader>
          <CardTitle>Active Products</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingActiveProducts ? (
            <p>Loading products...</p>
          ) : activeProducts.length > 0 ? (
            <div className="grid gap-4">
              {activeProducts.map((product) => (
                <div key={product.id.toString()} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-gray-600">Sold: {product.totalSold.toString()} units</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(product.price)} ETH</p>
                    <Badge variant={product.active ? "default" : "secondary"}>
                      {product.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No active products available</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Purchases */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRecentPurchases ? (
            <p>Loading recent purchases...</p>
          ) : recentPurchases.length > 0 ? (
            <div className="space-y-3">
              {recentPurchases.map((purchase) => (
                <div key={purchase.id.toString()} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{purchase.productName}</p>
                    <p className="text-sm text-gray-600">
                      Buyer: {purchase.buyer.slice(0, 6)}...{purchase.buyer.slice(-4)}
                    </p>
                    {purchase.referrer !== "0x0000000000000000000000000000000000000000" && (
                      <p className="text-sm text-green-600">
                        Referrer: {purchase.referrer.slice(0, 6)}...{purchase.referrer.slice(-4)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(purchase.amount)} ETH</p>
                    <p className="text-sm text-gray-600">
                      {new Date(Number(purchase.timestamp) * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No recent purchases</p>
          )}
        </CardContent>
      </Card>

      {/* Latest Draw Results */}
      {latestDraw.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Draw Results</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingLatestDraw ? (
              <p>Loading draw results...</p>
            ) : (
              <div className="space-y-2">
                {latestDraw.map((winner, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">
                        {winner.position.toString() === "1" && "🥇 1st Place"}
                        {winner.position.toString() === "2" && "🥈 2nd Place"}  
                        {winner.position.toString() === "3" && "🥉 3rd Place"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Winner: {winner.winner.slice(0, 6)}...{winner.winner.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatPrice(winner.prize)} ETH</p>
                      <p className="text-sm text-gray-600">Round {winner.round.toString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* User Information */}
      {userAddress && (
        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingUserInfo ? (
              <p>Loading user info...</p>
            ) : userInfo ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="font-bold">{formatPrice(userInfo.totalSpent)} ETH</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Commissions</p>
                    <p className="font-bold text-green-600">{formatPrice(userInfo.totalCommissions)} ETH</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Purchase Count</p>
                    <p className="font-bold">{userInfo.purchaseCount.toString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Draw Eligibility</p>
                    <Badge variant={userInfo.eligibleForDraw ? "default" : "secondary"}>
                      {userInfo.eligibleForDraw ? "Eligible" : "Not Eligible"}
                    </Badge>
                  </div>
                </div>
                {userReferrer && userReferrer !== "0x0000000000000000000000000000000000000000" && (
                  <div>
                    <p className="text-sm text-gray-600">Your Referrer</p>
                    <p className="font-mono text-sm">{userReferrer}</p>
                  </div>
                )}
              </div>
            ) : (
              <p>User not registered or no data available</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
