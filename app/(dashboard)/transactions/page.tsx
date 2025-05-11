import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionsList } from "@/components/transactions-list";
import { Plus } from "lucide-react";

export default function TransactionsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">
            View and manage all your financial transactions
          </p>
        </div>
        <div className="hidden md:flex">
          <Button className="ml-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
          </TabsList>
          <div className="md:hidden">
            <Button size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>
                View all your financial transactions in one place
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="h-[400px] flex items-center justify-center">
                    Loading transactions...
                  </div>
                }
              >
                <TransactionsList type="all" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Income</CardTitle>
              <CardDescription>
                View all your income transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="h-[400px] flex items-center justify-center">
                    Loading transactions...
                  </div>
                }
              >
                <TransactionsList type="income" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Expenses</CardTitle>
              <CardDescription>
                View all your expense transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="h-[400px] flex items-center justify-center">
                    Loading transactions...
                  </div>
                }
              >
                <TransactionsList type="expense" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Investments</CardTitle>
              <CardDescription>
                View all your investment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="h-[400px] flex items-center justify-center">
                    Loading transactions...
                  </div>
                }
              >
                <TransactionsList type="investment" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Transfers</CardTitle>
              <CardDescription>
                View all your transfer transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="h-[400px] flex items-center justify-center">
                    Loading transactions...
                  </div>
                }
              >
                <TransactionsList type="transfer" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
