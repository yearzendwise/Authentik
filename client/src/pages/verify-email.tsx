import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      setError("Invalid verification link. Please check your email and try again.");
      setIsVerifying(false);
      return;
    }

    // Verify the email token
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (response) => {
        const data = await response.json();
        
        if (response.ok) {
          setIsVerified(true);
          toast({
            title: "Email Verified!",
            description: "Your account has been successfully verified. You can now log in.",
          });
        } else {
          setError(data.message || "Failed to verify email");
        }
      })
      .catch(() => {
        setError("An error occurred while verifying your email. Please try again.");
      })
      .finally(() => {
        setIsVerifying(false);
      });
  }, [toast]);

  const handleResendVerification = async () => {
    const email = prompt("Please enter your email address to resend verification:");
    if (!email) return;

    setIsResending(true);
    
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox for the new verification email.",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send verification email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while sending the verification email",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Your Email</h2>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Please wait while we verify your email address...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {isVerified ? (
              <CheckCircle className="h-16 w-16 text-green-600" />
            ) : (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isVerified ? "Email Verified!" : "Verification Failed"}
          </CardTitle>
          <CardDescription>
            {isVerified
              ? "Your account has been successfully verified."
              : error || "There was an issue verifying your email."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {isVerified ? (
            <Button
              onClick={() => setLocation("/auth")}
              className="w-full"
            >
              Continue to Login
            </Button>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full"
                variant="outline"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              <Button
                onClick={() => setLocation("/auth")}
                variant="ghost"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}