import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NoAccess() {
  const navigate = useNavigate();
  return (
    <div className="p-8">
      <Card className="max-w-xl mx-auto p-10 text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center">
          <ShieldAlert className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">No Access</h1>
        <p className="text-sm text-muted-foreground">
          You don't have permission to view this page. Please contact your administrator
          if you believe this is a mistake.
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
          <Button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
