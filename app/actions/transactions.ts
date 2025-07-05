"use server";

import { createClient } from "@/lib/supabase/server";
import { Tables } from "@/lib/types/database.types";
import { revalidatePath } from "next/cache";

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return user;
}

export async function getCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data;
}

export async function getTransactions() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      *,
      categories (*)
    `,
    )
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }

  return data;
}

export async function addTransaction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const amount = Number.parseFloat(formData.get("amount") as string);
  const type = formData.get("type") as Tables<"transactions">["type"];
  const description = formData.get("description") as string;
  const categoryId = formData.get("category") as string;
  const date = new Date(formData.get("date") as string)
    .toISOString()
    .split("T")[0];

  // If it's an expense, make the amount negative
  const finalAmount = type === "expense" ? -Math.abs(amount) : Math.abs(amount);

  const { error } = await supabase.from("transactions").insert({
    type,
    user_id: user.id,
    amount: finalAmount,
    description,
    category_id: categoryId,
    transaction_date: date,
  });

  if (error) {
    console.error("Error adding transaction:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/");
  return { success: true, message: "Transaction added successfully" };
}

export async function deleteTransaction(id: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting transaction:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/");
  return { success: true, message: "Transaction deleted successfully" };
}

export async function getFinancialSummary() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();

  // Get current month's data
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  // Get previous month's data
  const firstDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .split("T")[0];
  const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    .toISOString()
    .split("T")[0];

  // Current month transactions
  const { data: currentMonthData, error: currentMonthError } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", user.id)
    .gte("transaction_date", firstDayOfMonth)
    .lte("transaction_date", lastDayOfMonth);

  // Previous month transactions
  const { data: prevMonthData, error: prevMonthError } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", user.id)
    .gte("transaction_date", firstDayOfPrevMonth)
    .lte("transaction_date", lastDayOfPrevMonth);

  if (currentMonthError || prevMonthError) {
    console.error(
      "Error fetching financial summary:",
      currentMonthError || prevMonthError,
    );
    return null;
  }

  // Calculate totals
  const currentMonthIncome = currentMonthData
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const currentMonthExpenses = currentMonthData
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const prevMonthIncome = prevMonthData
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const prevMonthExpenses = prevMonthData
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Calculate percentages
  const incomeChange = prevMonthIncome
    ? ((currentMonthIncome - prevMonthIncome) / prevMonthIncome) * 100
    : 0;
  const expensesChange = prevMonthExpenses
    ? ((currentMonthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100
    : 0;

  // Calculate balance and savings rate
  const currentBalance = currentMonthIncome - currentMonthExpenses;
  const prevBalance = prevMonthIncome - prevMonthExpenses;
  const balanceChange = prevBalance
    ? ((currentBalance - prevBalance) / Math.abs(prevBalance)) * 100
    : 0;

  const savingsRate =
    currentMonthIncome > 0 ? (currentBalance / currentMonthIncome) * 100 : 0;
  const prevSavingsRate =
    prevMonthIncome > 0 ? (prevBalance / prevMonthIncome) * 100 : 0;
  const savingsRateChange = prevSavingsRate ? savingsRate - prevSavingsRate : 0;

  return {
    balance: currentBalance,
    balanceChange,
    income: currentMonthIncome,
    incomeChange,
    expenses: currentMonthExpenses,
    expensesChange,
    savingsRate,
    savingsRateChange,
  };
}

export async function getMonthlyData() {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const supabase = await createClient();

  // Get transactions for the past 12 months
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, transaction_date")
    .eq("user_id", user.id)
    .gte("transaction_date", oneYearAgo)
    .order("transaction_date");

  if (error) {
    console.error("Error fetching monthly data:", error);
    return [];
  }

  // Group by month
  const monthlyData: Record<string, { income: number; expenses: number }> = {};

  data.forEach((transaction) => {
    const date = new Date(transaction.transaction_date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { income: 0, expenses: 0 };
    }

    const amount = transaction.amount;
    if (amount > 0) {
      monthlyData[monthYear].income += amount;
    } else {
      monthlyData[monthYear].expenses += Math.abs(amount);
    }
  });

  // Convert to array and format for chart
  return Object.entries(monthlyData).map(([monthYear, data]) => {
    const [year, month] = monthYear.split("-");
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1);
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return {
      name: monthNames[date.getMonth()],
      income: Number.parseFloat(data.income.toFixed(2)),
      expenses: Number.parseFloat(data.expenses.toFixed(2)),
    };
  });
}
