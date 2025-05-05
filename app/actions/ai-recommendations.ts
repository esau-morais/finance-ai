"use server";

import { getCurrentUser, getTransactions } from "./transactions";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getAIRecommendations() {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const supabase = await createClient();

  // First check if we have recent recommendations
  const { data: existingRecommendations, error: fetchError } = await supabase
    .from("ai_recommendations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  if (fetchError) {
    console.error("Error fetching recommendations:", fetchError);
    return [];
  }

  // If we have recent recommendations (less than 24 hours old), return them
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  if (
    existingRecommendations.length > 0 &&
    new Date(existingRecommendations[0].created_at) > twentyFourHoursAgo
  ) {
    return existingRecommendations;
  }

  // Otherwise, generate new recommendations
  return generateRecommendations();
}

export async function generateRecommendations() {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  // Get user's transactions
  const transactions = await getTransactions();

  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Prepare data for AI analysis
  const transactionData = transactions.map((t) => ({
    date: t.transaction_date,
    amount: Number.parseFloat(t.amount),
    category: t.categories?.name || "Uncategorized",
    description: t.description,
  }));

  // Group expenses by category
  const expensesByCategory: Record<string, number> = {};
  const incomeTotal = transactionData
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  transactionData
    .filter((t) => t.amount < 0)
    .forEach((t) => {
      const category = t.category;
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = 0;
      }
      expensesByCategory[category] += Math.abs(t.amount);
    });

  // Convert to array and sort by amount
  const expensesArray = Object.entries(expensesByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Prepare prompt for AI
  const prompt = `
    As a financial advisor, analyze this user's financial data and provide 3 personalized recommendations.
    
    Income: $${incomeTotal.toFixed(2)}
    
    Top Expenses by Category:
    ${expensesArray.map((e) => `${e.category}: $${e.amount.toFixed(2)}`).join("\n")}
    
    Recent Transactions:
    ${transactionData
      .slice(0, 10)
      .map(
        (t) =>
          `${t.date}: ${t.description} - ${t.amount > 0 ? "+" : ""}$${Math.abs(t.amount).toFixed(2)} (${t.category})`,
      )
      .join("\n")}
    
    For each recommendation:
    1. Provide a short, specific title (max 5 words)
    2. Write a detailed explanation (1-2 sentences)
    3. Assign an impact level (Low, Medium, or High)
    4. Suggest an icon name from: trending-up, piggy-bank, lightbulb, alert-circle, credit-card, shopping-bag, zap
    
    Format your response as a JSON array with objects containing title, description, impact, and icon fields.
  `;

  try {
    // Generate recommendations using AI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Parse the response
    const recommendations = JSON.parse(text);

    // Save recommendations to database
    const supabase = await createClient();

    for (const rec of recommendations) {
      await supabase.from("ai_recommendations").insert({
        user_id: user.id,
        title: rec.title,
        description: rec.description,
        impact: rec.impact,
        icon: rec.icon,
      });
    }

    revalidatePath("/");

    // Return the new recommendations
    const { data: newRecommendations } = await supabase
      .from("ai_recommendations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    return newRecommendations || [];
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [];
  }
}

export async function refreshRecommendations() {
  const recommendations = await generateRecommendations();
  revalidatePath("/");
  return recommendations;
}
