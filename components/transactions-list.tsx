"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  SearchIcon,
  Trash2,
  TrendingUp,
  ArrowLeftRight,
} from "lucide-react";
import { getTransactions, deleteTransaction } from "@/app/actions/transactions";
import { toast } from "@/hooks/use-toast";
import { TransactionDialog } from "./transaction-dialog";
import { Tables } from "@/lib/types/database.types";

export function TransactionsList({ type = "all" }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<
    Awaited<ReturnType<typeof getTransactions>>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [type]);

  const fetchTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteTransaction(id);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        fetchTransactions();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    // Filter by transaction type if specified
    if (type !== "all") {
      if (type === "income" && transaction.amount <= 0) return false;
      if (type === "expense" && transaction.amount >= 0) return false;
      // Add more type filters as needed
    }

    // Filter by search term
    return (
      transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.categories?.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

  const getCategoryColor = (category: Tables<"categories"> | null) => {
    if (!category) return "bg-gray-100 text-gray-800";

    switch (category.color) {
      case "green":
        return "bg-green-100 text-green-800";
      case "blue":
        return "bg-blue-100 text-blue-800";
      case "purple":
        return "bg-purple-100 text-purple-800";
      case "yellow":
      case "amber":
        return "bg-yellow-100 text-yellow-800";
      case "orange":
        return "bg-orange-100 text-orange-800";
      case "pink":
      case "rose":
        return "bg-pink-100 text-pink-800";
      case "red":
        return "bg-red-100 text-red-800";
      case "teal":
        return "bg-teal-100 text-teal-800";
      case "cyan":
        return "bg-cyan-100 text-cyan-800";
      case "emerald":
        return "bg-emerald-100 text-emerald-800";
      case "indigo":
        return "bg-indigo-100 text-indigo-800";
      case "slate":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTransactionIcon = (transaction: Tables<"transactions">) => {
    const amount = transaction.amount;

    if (amount > 0) {
      return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
    } else if (amount < 0) {
      return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
    }

    if (transaction.type === "investment") {
      return <TrendingUp className="h-4 w-4 text-blue-500" />;
    } else if (transaction.type === "transfer") {
      return <ArrowLeftRight className="h-4 w-4 text-purple-500" />;
    }

    return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
        </div>
        <TransactionDialog>
          <Button size="sm">Add Transaction</Button>
        </TransactionDialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {new Date(
                      transaction.transaction_date,
                    ).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(transaction.categories)}>
                      {transaction.categories?.name || "Uncategorized"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {getTransactionIcon(transaction)}
                      <span
                        className={
                          transaction.amount > 0
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(transaction.id)}
                      aria-label="Delete transaction"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
