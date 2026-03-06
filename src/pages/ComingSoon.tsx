import { Construction } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function ComingSoon() {
  const location = useLocation();
  const pageName = location.pathname.split("/").filter(Boolean).pop() || "Page";
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Construction className="h-5 w-5 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold text-foreground capitalize">{pageName.replace(/-/g, " ")}</h1>
      <p className="text-sm text-muted-foreground mt-1">This module is under development</p>
    </div>
  );
}
