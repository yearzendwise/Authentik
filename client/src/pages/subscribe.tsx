import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Star, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { SubscriptionPlan } from "@shared/schema";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
}

const CheckoutForm = ({ planId, billingCycle }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Welcome to your new subscription!",
        });
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full">
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Subscribe ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPlan, setCurrentPlan] = useState<string>('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user already has a subscription
  const { data: userSubscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/my-subscription'],
    enabled: !!user,
  });

  // Debug logging
  console.log('Subscribe page - User:', user);
  console.log('Subscribe page - Subscription data:', userSubscription);
  console.log('Subscribe page - Subscription loading:', subscriptionLoading);

  // If user has subscription, redirect to dashboard
  useEffect(() => {
    if (userSubscription?.subscription && !subscriptionLoading) {
      console.log('Redirecting to dashboard - subscription found:', userSubscription);
      setLocation('/dashboard');
    }
  }, [userSubscription, subscriptionLoading, setLocation]);

  // Fetch subscription plans
  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: { planId: string; billingCycle: 'monthly' | 'yearly' }) => {
      const response = await apiRequest("POST", "/api/create-subscription", data);
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  const handlePlanSelection = (planId: string) => {
    setCurrentPlan(planId);
    createSubscriptionMutation.mutate({ planId, billingCycle });
  };

  const handleStartFreeTrial = (planId: string) => {
    // Start free trial for current user
    setCurrentPlan(planId);
    createSubscriptionMutation.mutate({ 
      planId, 
      billingCycle
    });
  };

  if (plansLoading || subscriptionLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-4">Loading subscription plans...</span>
        </div>
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">No Plans Available</h1>
          <p className="text-muted-foreground">
            Subscription plans are currently not available. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // If we have a client secret, show the payment form
  if (clientSecret && currentPlan) {
    const selectedPlanData = plans.find(p => p.id === currentPlan);
    
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Subscription</h1>
          <p className="text-muted-foreground">
            {selectedPlanData?.displayName} - {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm planId={currentPlan} billingCycle={billingCycle} />
            </Elements>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show plan selection
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Start with a 14-day free trial. No credit card required. Cancel anytime.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">
              Yearly
              <Badge variant="secondary" className="ml-2">Save 20%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.isPopular ? 'border-primary shadow-lg' : ''}`}>
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
              <CardDescription className="text-sm">{plan.description}</CardDescription>
              
              <div className="py-4">
                <div className="text-4xl font-bold">
                  ${billingCycle === 'yearly' ? plan.yearlyPrice : plan.price}
                </div>
                <div className="text-sm text-muted-foreground">
                  per {billingCycle === 'yearly' ? 'year' : 'month'}
                </div>
                {billingCycle === 'yearly' && plan.yearlyPrice && (
                  <div className="text-xs text-green-600 mt-1">
                    Save ${((parseFloat(plan.price) * 12) - parseFloat(plan.yearlyPrice)).toFixed(2)}/year
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <Button 
                className="w-full mb-6" 
                variant={plan.isPopular ? "default" : "outline"}
                onClick={() => handleStartFreeTrial(plan.id)}
                disabled={createSubscriptionMutation.isPending}
              >
                {createSubscriptionMutation.isPending && currentPlan === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Start Free Trial`
                )}
              </Button>

              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
                <div className="space-y-1">
                  {plan.maxUsers && <div>Up to {plan.maxUsers} users</div>}
                  {plan.maxProjects && <div>Up to {plan.maxProjects} projects</div>}
                  {plan.storageLimit && <div>{plan.storageLimit}GB storage</div>}
                  <div className="capitalize">{plan.supportLevel} support</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12 text-sm text-muted-foreground">
        <p>All plans include a 14-day free trial • No setup fees • Cancel anytime</p>
        <p className="mt-2">
          Questions? <a href="mailto:support@example.com" className="text-primary hover:underline">Contact our sales team</a>
        </p>
      </div>
    </div>
  );
}