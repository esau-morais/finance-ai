"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  Lightbulb,
  TrendingUp,
  PiggyBank,
  AlertCircle,
  CreditCard,
  ShoppingBag,
  Zap,
} from "lucide-react";
import {
  getAIRecommendations,
  refreshRecommendations,
} from "@/app/actions/ai-recommendations";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/lib/types/database.types";

export function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<
    Tables<"ai_recommendations">[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const data = await getAIRecommendations();
      setRecommendations(data);
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to load recommendations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await refreshRecommendations();
      setRecommendations(data);
      toast({
        title: "Success",
        description: "Recommendations refreshed",
      });
    } catch (error) {
      console.error("Error refreshing recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to refresh recommendations",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getIcon = (iconName: string | null) => {
    switch (iconName) {
      case "trending-up":
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case "piggy-bank":
        return <PiggyBank className="h-5 w-5 text-green-500" />;
      case "lightbulb":
        return <Lightbulb className="h-5 w-5 text-amber-500" />;
      case "alert-circle":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "credit-card":
        return <CreditCard className="h-5 w-5 text-purple-500" />;
      case "shopping-bag":
        return <ShoppingBag className="h-5 w-5 text-pink-500" />;
      case "zap":
        return <Zap className="h-5 w-5 text-orange-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-amber-500" />;
    }
  };

  const getImpactColor = (impact: string | null) => {
    switch (impact) {
      case "High":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-amber-100 text-amber-800";
      case "Low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Personalized insights based on your financial data
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="h-8 gap-1"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground py-6">
              Add some transactions to get personalized recommendations
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recommendations.map((recommendation) => (
            <Card key={recommendation.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    {getIcon(recommendation.icon)}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{recommendation.title}</h4>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getImpactColor(recommendation.impact)}`}
                      >
                        {recommendation.impact} Impact
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {recommendation.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
