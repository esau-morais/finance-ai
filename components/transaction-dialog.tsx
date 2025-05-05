"use client";

import { useState, useEffect, JSX } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  CreditCard,
  DollarSign,
  TrendingUp,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { addTransaction, getCategories } from "@/app/actions/transactions";
import { Tables } from "@/lib/types/database.types";

// Base schema for all transaction types
const baseSchema = {
  date: z.date({
    required_error: "A date is required.",
  }),
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) !== 0, {
    message: "Amount must be a non-zero number.",
  }),
  category: z.string({
    required_error: "Please select a category.",
  }),
  notes: z.string().optional(),
};

// Income schema
const incomeSchema = z.object({
  ...baseSchema,
  type: z.literal("income"),
});

// Expense schema
const expenseSchema = z.object({
  ...baseSchema,
  type: z.literal("expense"),
});

// Investment schema
const investmentSchema = z.object({
  ...baseSchema,
  type: z.literal("investment"),
  investmentType: z.enum(
    ["stock", "crypto", "real_estate", "retirement", "other"],
    {
      required_error: "Please select an investment type.",
    },
  ),
  quantity: z.string().optional(),
  price: z.string().optional(),
});

// Transfer schema
const transferSchema = z.object({
  ...baseSchema,
  type: z.literal("transfer"),
  fromAccount: z.string({
    required_error: "Please select the source account.",
  }),
  toAccount: z.string({
    required_error: "Please select the destination account.",
  }),
});

// Combined schema
const formSchema = z.discriminatedUnion("type", [
  incomeSchema,
  expenseSchema,
  investmentSchema,
  transferSchema,
]);

type TransactionDialogProps = {
  children: JSX.Element;
  onSuccess(): void;
};

export function TransactionDialog({
  children,
  onSuccess,
}: TransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [transactionType, setTransactionType] = useState("expense");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      description: "",
      amount: "",
      type: "expense" as const,
      notes: "",
    },
  });

  // Reset form when transaction type changes
  useEffect(() => {
    form.reset({
      date: new Date(),
      description: "",
      amount: "",
      type: transactionType as any,
      notes: "",
      ...(transactionType === "investment" && {
        investmentType: undefined,
        quantity: "",
        price: "",
      }),
      ...(transactionType === "transfer" && {
        fromAccount: "",
        toAccount: "",
      }),
    });
  }, [transactionType, form]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchCategories();
    }
  }, [open]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("date", values.date.toISOString());
      formData.append("description", values.description);
      formData.append("amount", values.amount);
      formData.append("type", values.type);
      formData.append("category", values.category);

      if (values.notes) {
        formData.append("notes", values.notes);
      }

      // Add investment-specific fields
      if (values.type === "investment" && values.investmentType) {
        formData.append("investmentType", values.investmentType);
        if (values.quantity) formData.append("quantity", values.quantity);
        if (values.price) formData.append("price", values.price);
      }

      // Add transfer-specific fields
      if (values.type === "transfer") {
        formData.append("fromAccount", values.fromAccount);
        formData.append("toAccount", values.toAccount);
      }

      const result = await addTransaction(formData);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });

        setOpen(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredCategories = categories.filter((category) => {
    if (transactionType === "investment")
      return category.type === "investment" || category.type === "expense";
    return category.type === transactionType;
  });

  // Mock accounts for transfer functionality
  const accounts = [
    { id: "checking", name: "Checking Account" },
    { id: "savings", name: "Savings Account" },
    { id: "investment", name: "Investment Account" },
    { id: "credit", name: "Credit Card" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Record a new financial transaction in your account.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="expense"
          value={transactionType}
          onValueChange={setTransactionType}
          className="mt-2"
        >
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="expense" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Expense</span>
            </TabsTrigger>
            <TabsTrigger value="income" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Income</span>
            </TabsTrigger>
            <TabsTrigger value="investment" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Investment</span>
            </TabsTrigger>
            <TabsTrigger value="transfer" className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden sm:inline">Transfer</span>
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`e.g., ${
                            transactionType === "expense"
                              ? "Grocery shopping"
                              : transactionType === "income"
                                ? "Salary payment"
                                : transactionType === "investment"
                                  ? "Stock purchase"
                                  : "Transfer to savings"
                          }`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                              $
                            </span>
                            <Input
                              placeholder="0.00"
                              {...field}
                              className="pl-7"
                              type="number"
                              step="0.01"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Investment-specific fields */}
                {transactionType === "investment" && (
                  <>
                    <FormField
                      control={form.control}
                      name="investmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Investment Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select investment type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="stock">Stocks</SelectItem>
                              <SelectItem value="crypto">
                                Cryptocurrency
                              </SelectItem>
                              <SelectItem value="real_estate">
                                Real Estate
                              </SelectItem>
                              <SelectItem value="retirement">
                                Retirement
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 10 shares" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price per Unit (Optional)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  placeholder="0.00"
                                  {...field}
                                  className="pl-7"
                                  type="number"
                                  step="0.01"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {/* Transfer-specific fields */}
                {transactionType === "transfer" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fromAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Account</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select source account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="toAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To Account</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select destination account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional details about this transaction"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Transaction"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
