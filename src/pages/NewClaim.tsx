import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Camera, ArrowLeft, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const expenseTypes = [
  "Office Supplies", "Cleaning Supplies", "Maintenance", "Transportation",
  "Refreshments", "Postage", "Printing", "Miscellaneous",
];

export default function NewClaim() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Claim Submitted",
      description: "Your claim has been submitted for OCR validation.",
    });
    navigate("/claims");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Claim</h1>
          <p className="text-sm text-muted-foreground">Submit a petty cash claim with receipt</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Receipt Upload */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Receipt Document</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/40 hover:bg-muted/30 transition-colors cursor-pointer">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Drop receipt image here or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or PDF · Max 10MB · OCR will extract data automatically</p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button type="button" variant="outline" size="sm">
                  <Upload className="h-3.5 w-3.5 mr-1" /> Upload File
                </Button>
                <Button type="button" variant="outline" size="sm">
                  <Camera className="h-3.5 w-3.5 mr-1" /> Take Photo
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="store" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Store</Label>
            <Select>
              <SelectTrigger id="store">
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bangkapi">Makro Bangkapi</SelectItem>
                <SelectItem value="sathorn">Makro Sathorn</SelectItem>
                <SelectItem value="rama4">Makro Rama 4</SelectItem>
                <SelectItem value="chaengwattana">Makro Chaengwattana</SelectItem>
                <SelectItem value="phnompenh1">Makro Phnom Penh 1</SelectItem>
                <SelectItem value="siemreap">Makro Siem Reap</SelectItem>
                <SelectItem value="yangon">Makro Yangon Central</SelectItem>
                <SelectItem value="mandalay">Makro Mandalay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expenseType" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Expense Type</Label>
            <Select>
              <SelectTrigger id="expenseType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {expenseTypes.map((type) => (
                  <SelectItem key={type} value={type.toLowerCase().replace(/\s/g, "-")}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Amount</Label>
            <Input id="amount" type="number" placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Currency</Label>
            <Select defaultValue="THB">
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="THB">THB – Thai Baht</SelectItem>
                <SelectItem value="USD">USD – US Dollar</SelectItem>
                <SelectItem value="MMK">MMK – Myanmar Kyat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptDate" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Receipt Date</Label>
            <Input id="receiptDate" type="date" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Vendor Name</Label>
            <Input id="vendor" placeholder="Enter vendor name" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Description</Label>
          <Textarea id="description" placeholder="Brief description of expense..." rows={3} />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit">Submit Claim</Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Save as Draft</Button>
        </div>
      </form>
    </div>
  );
}
