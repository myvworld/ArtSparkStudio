import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus } from "lucide-react";

interface SubscriptionPlan {
  id: number;
  name: string;
  code: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyUploadLimit: number;
  features: string[];
  isActive: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  subscriptionTier: string;
  monthlyUploadsUsed: number;
  tokenBalance: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Fetch subscription plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/subscription-plans"],
  });

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Update subscription plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      const response = await fetch(`/api/admin/subscription-plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({
        title: "Success",
        description: "Subscription plan updated successfully",
      });
      setIsEditingPlan(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user?.isAdmin) {
    return (
      <div className="dashboard-container">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You need to log out and log back in to access this page with admin privileges.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Subscription Plans</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Plan
            </Button>
          </div>

          {isLoadingPlans ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              {plans?.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedPlan(plan);
                          setIsEditingPlan(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium">Monthly Price</p>
                          <p className="text-muted-foreground">
                            ${plan.monthlyPrice}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Yearly Price</p>
                          <p className="text-muted-foreground">
                            ${plan.yearlyPrice}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">Features</p>
                        <ul className="list-disc list-inside text-muted-foreground">
                          {plan.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Users</h2>
          </div>

          {isLoadingUsers ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Uploads Used</TableHead>
                    <TableHead>Token Balance</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.subscriptionTier}</TableCell>
                      <TableCell>{user.monthlyUploadsUsed}</TableCell>
                      <TableCell>{user.tokenBalance}</TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isEditingPlan} onOpenChange={setIsEditingPlan}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>
              Make changes to the subscription plan here.
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedPlan) {
                  updatePlanMutation.mutate(selectedPlan);
                }
              }}
              className="space-y-4"
            >
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    value={selectedPlan.name}
                    onChange={(e) =>
                      setSelectedPlan({ ...selectedPlan, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="monthlyPrice">Monthly Price ($)</Label>
                  <Input
                    id="monthlyPrice"
                    type="number"
                    value={selectedPlan.monthlyPrice}
                    onChange={(e) =>
                      setSelectedPlan({
                        ...selectedPlan,
                        monthlyPrice: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="yearlyPrice">Yearly Price ($)</Label>
                  <Input
                    id="yearlyPrice"
                    type="number"
                    value={selectedPlan.yearlyPrice}
                    onChange={(e) =>
                      setSelectedPlan({
                        ...selectedPlan,
                        yearlyPrice: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingPlan(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
  <div className="card">
    <h3 className="text-lg font-semibold mb-4">Featured Artwork Settings</h3>
    <div className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground">Number of Featured Images</label>
        <Input 
          type="number" 
          min="1"
          max="10"
          defaultValue="5"
          onChange={async (e) => {
            try {
              await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  key: 'featured_artwork_count',
                  value: { count: parseInt(e.target.value) }
                })
              });
            } catch (error) {
              console.error('Error updating setting:', error);
            }
          }}
        />
      </div>
    </div>
  </div>
