import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { 
  RefreshCcw, 
  Clock, 
  Calendar, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  Check
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { getOrderedOpeningHours } from "@/hooks/use-store-locations";
import { formatStoreHours } from "@/utils/formatStoreHours";
import { useState, useEffect } from "react";
// Define the store location type inline to avoid import issues
interface StoreLocation {
  id: number;
  name: string;
  city: string;
  address: string;
  full_address: string;
  phone: string;
  hours?: string;
  closed_days?: string;
  image: string;
  lat: number | string;
  lng: number | string;
  opening_hours?: Record<string, string>;
  description?: string;
}

interface StoreHoursDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeLocation: StoreLocation | null;
  onSave: (data: {
    opening_hours: Record<string, string>;
    hours: string;
    closed_days: string;
  }) => Promise<void>;
}

export default function StoreHoursDialog({
  open,
  onOpenChange,
  storeLocation,
  onSave,
}: StoreHoursDialogProps) {
  const [temporaryHours, setTemporaryHours] = useState<Record<string, Record<string, string>>>({});
  const [hoursSummary, setHoursSummary] = useState("");
  const [closedDays, setClosedDays] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copyingFromDay, setCopyingFromDay] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [previewMode, setPreviewMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{text: string; type: 'success' | 'error' | 'info'} | null>(null);
  
  // Templates for common hours patterns
  const hourTemplates = [
    { 
      name: "Standard Business", 
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], 
      open: "9:00 AM", 
      close: "5:00 PM" 
    },
    { 
      name: "Extended Evening", 
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], 
      open: "10:00 AM", 
      close: "8:00 PM" 
    },
    { 
      name: "Weekend Hours", 
      days: ["Saturday", "Sunday"], 
      open: "11:00 AM", 
      close: "6:00 PM" 
    },
    { 
      name: "Evening Weekend", 
      days: ["Friday", "Saturday"], 
      open: "10:00 AM", 
      close: "12:00 AM" 
    },
    { 
      name: "Late Night Weekend", 
      days: ["Friday", "Saturday"], 
      open: "10:00 AM", 
      close: "2:00 AM" 
    },
    {
      name: "Same Every Day",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      open: "10:00 AM",
      close: "10:00 PM"
    }
  ];

  useEffect(() => {
    if (storeLocation && open) {
      // Initialize from store location data
      const initialHours: Record<string, Record<string, string>> = {};
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      // Initialize hours for all days
      days.forEach(day => {
        initialHours[day] = {
          open: '',
          close: ''
        };
      });
      
      // Fill with existing hours if available
      if (storeLocation.opening_hours) {
        Object.entries(storeLocation.opening_hours).forEach(([day, hoursString]) => {
          if (typeof hoursString === 'string') {
            const [open, close] = hoursString.split(' - ');
            if (open && close) {
              initialHours[day] = {
                open,
                close
              };
            }
          }
        });
      }
      
      setTemporaryHours(initialHours);
      setHoursSummary(storeLocation.hours || '');
      setClosedDays(storeLocation.closed_days || '');
    }
  }, [storeLocation, open]);

  const getOpeningHour = (day: string) => {
    return temporaryHours[day]?.open || '';
  };

  const getClosingHour = (day: string) => {
    return temporaryHours[day]?.close || '';
  };

  const handleHourChange = (day: string, type: 'open' | 'close', value: string) => {
    setTemporaryHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: value
      }
    }));
  };

  const handleCopyHours = (day: string) => {
    setCopyingFromDay(day);
  };

  const copyToDay = (targetDay: string) => {
    if (copyingFromDay && copyingFromDay !== targetDay) {
      setTemporaryHours(prev => ({
        ...prev,
        [targetDay]: { ...prev[copyingFromDay] }
      }));
    }
    setCopyingFromDay(null);
  };
  
  // Apply template to selected days
  const applyTemplate = (template: typeof hourTemplates[0]) => {
    setTemporaryHours(prev => {
      const updated = { ...prev };
      template.days.forEach(day => {
        updated[day] = {
          open: template.open,
          close: template.close
        };
      });
      return updated;
    });
    
    setStatusMessage({
      text: `Applied template "${template.name}" to ${template.days.length} days`,
      type: 'success'
    });
    
    // Auto-dismiss the status message after 3 seconds
    setTimeout(() => setStatusMessage(null), 3000);
  };
  
  // Generate a preview of the hours summary based on current values
  const generateHoursSummary = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const daysWithHours = days.filter(day => 
      temporaryHours[day]?.open && temporaryHours[day]?.close
    );
    
    if (daysWithHours.length === 0) return "No hours set";
    
    // Create temporary opening_hours format
    const opening_hours: Record<string, string> = {};
    daysWithHours.forEach(day => {
      opening_hours[day] = `${temporaryHours[day].open} - ${temporaryHours[day].close}`;
    });
    
    // Use our utility for consistent formatting
    return formatStoreHours(opening_hours);
  };
  
  // Update hours summary automatically if preview mode is on
  useEffect(() => {
    if (previewMode) {
      setHoursSummary(generateHoursSummary());
    }
  }, [temporaryHours, previewMode]);

  const handleSaveStoreHours = async () => {
    if (!storeLocation) return;
    
    setIsSaving(true);
    
    // Convert temporary hours format to opening_hours format
    const opening_hours: Record<string, string> = {};
    Object.entries(temporaryHours).forEach(([day, hours]) => {
      if (hours.open && hours.close) {
        opening_hours[day] = `${hours.open} - ${hours.close}`;
      }
    });
    
    // If not using the preview mode, generate a formatted hours summary
    // This ensures that even if the user manually edits the summary, we save a properly
    // formatted version to the database as well
    const formattedHours = previewMode ? hoursSummary : formatStoreHours(opening_hours);
    
    try {
      await onSave({
        opening_hours,
        hours: formattedHours,
        closed_days: closedDays
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save store hours:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-4 w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle>Manage Store Hours</DialogTitle>
          <DialogDescription className="text-gray-400">
            {storeLocation ? 
              `Update operating hours for ${storeLocation.name} (${storeLocation.city}).` 
              : "Select a store location to manage hours."
            }
          </DialogDescription>
        </DialogHeader>
        
        {storeLocation && (
          <div className="space-y-6 mt-4">
            {/* Status message display */}
            {statusMessage && (
              <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${
                statusMessage.type === 'success' 
                  ? 'bg-green-900/30 text-green-400 border border-green-800' 
                  : statusMessage.type === 'error'
                    ? 'bg-red-900/30 text-red-400 border border-red-800'
                    : 'bg-blue-900/30 text-blue-400 border border-blue-800'
              }`}>
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 size={16} />
                ) : statusMessage.type === 'error' ? (
                  <AlertCircle size={16} />
                ) : (
                  <Clock size={16} />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}
            
            <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 bg-gray-800">
                <TabsTrigger value="basic" className="data-[state=active]:bg-gray-700">
                  <span className="flex items-center gap-2">
                    <Clock size={16} />
                    <span className="hidden sm:inline">Basic Info</span>
                    <span className="inline sm:hidden">Basic</span>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="advanced" className="data-[state=active]:bg-gray-700">
                  <span className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span className="hidden sm:inline">Schedule</span>
                    <span className="inline sm:hidden">Hours</span>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="templates" className="data-[state=active]:bg-gray-700">
                  <span className="flex items-center gap-2">
                    <Copy size={16} />
                    <span className="hidden sm:inline">Templates</span>
                    <span className="inline sm:hidden">Presets</span>
                  </span>
                </TabsTrigger>
              </TabsList>
              
              {/* Basic Tab - Summary Information */}
              <TabsContent value="basic" className="p-4 bg-gray-800 rounded-md mt-2 border border-gray-700">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium">Hours Summary</h3>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="auto-preview" className="text-xs">Auto Preview</Label>
                      <Switch 
                        id="auto-preview" 
                        checked={previewMode}
                        onCheckedChange={setPreviewMode}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Textarea 
                      id="hoursSummary"
                      value={hoursSummary}
                      onChange={(e) => {
                        if (!previewMode) {
                          setHoursSummary(e.target.value);
                        }
                      }}
                      className="bg-gray-900 border-gray-700 resize-none text-white"
                      placeholder="Mon-Fri: 10am-8pm, Sat: 11am-7pm, Sun: Closed"
                      disabled={previewMode}
                    />
                    <p className="text-xs text-gray-400">
                      {previewMode 
                        ? "Auto-preview mode is on. Hours summary is generated from your schedule." 
                        : "This is the formatted text shown to customers on the website."}
                    </p>
                    
                    {!previewMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setHoursSummary(generateHoursSummary())}
                      >
                        <span className="flex items-center gap-2">
                          <RefreshCcw size={14} />
                          Generate from Schedule
                        </span>
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2 mt-6">
                    <Label htmlFor="closedDays" className="text-sm font-medium">Special Hours & Holiday Closures</Label>
                    <Textarea 
                      id="closedDays"
                      value={closedDays}
                      onChange={(e) => setClosedDays(e.target.value)}
                      className="bg-gray-900 border-gray-700 resize-none text-white"
                      placeholder="Closed on Thanksgiving, Christmas Day, New Year's Day"
                    />
                    <p className="text-xs text-gray-400">List any special hours, holiday closures, or temporary changes.</p>
                  </div>
                </div>
              </TabsContent>
              
              {/* Advanced Tab - Day-by-day Hours */}
              <TabsContent value="advanced" className="p-4 bg-gray-800 rounded-md mt-2 border border-gray-700">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-medium">Regular Operating Hours</h3>
                    <div className="text-xs text-gray-400">Format: 9:00 AM - 8:00 PM</div>
                  </div>
                  
                  <div className="space-y-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <div 
                        key={day} 
                        data-day={day} 
                        className={`flex flex-col sm:flex-row gap-2 sm:items-center p-3 bg-gray-900 rounded-md ${
                          copyingFromDay === day ? 'ring-2 ring-primary/60' : 'border border-gray-700'
                        }`}
                        onClick={() => copyingFromDay && copyToDay(day)}
                      >
                        <div className="w-28 flex items-center justify-between">
                          <span className="text-sm font-medium">{day}</span>
                          <Button 
                            type="button" 
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyHours(day);
                            }}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="flex items-center justify-center text-gray-400 hover:text-white">
                                    <Copy size={14} />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p className="text-xs">
                                    {copyingFromDay === day 
                                      ? "Click on another day to copy hours there" 
                                      : "Copy these hours to another day"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Button>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <Label htmlFor={`${day}-open`} className="text-xs text-gray-400 mb-1">Open</Label>
                            <Input
                              id={`${day}-open`}
                              value={getOpeningHour(day)}
                              onChange={(e) => handleHourChange(day, 'open', e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white h-9 text-sm"
                              placeholder="9:00 AM"
                            />
                          </div>
                          <div className="flex flex-col">
                            <Label htmlFor={`${day}-close`} className="text-xs text-gray-400 mb-1">Close</Label>
                            <Input
                              id={`${day}-close`}
                              value={getClosingHour(day)}
                              onChange={(e) => handleHourChange(day, 'close', e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white h-9 text-sm"
                              placeholder="8:00 PM"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {copyingFromDay && (
                    <div className="mt-2 text-sm text-primary flex items-center gap-1 bg-primary/10 p-2 rounded-md">
                      <RefreshCcw size={14} />
                      <span>Click on a day to copy hours from {copyingFromDay}</span>
                      <Button 
                        type="button" 
                        variant="link" 
                        className="text-sm h-auto p-0 ml-2 text-gray-400 hover:text-white"
                        onClick={() => setCopyingFromDay(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Templates Tab - Quick apply templates */}
              <TabsContent value="templates" className="p-4 bg-gray-800 rounded-md mt-2 border border-gray-700">
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Quick Templates</h3>
                  <p className="text-sm text-gray-400">Apply common hours patterns with a single click. This will overwrite the existing hours for the selected days.</p>
                  
                  <div className="grid gap-3 sm:grid-cols-2">
                    {hourTemplates.map((template, index) => (
                      <div 
                        key={index}
                        className="p-3 border border-gray-700 bg-gray-900 rounded-md hover:border-gray-600 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {template.days.length === 7 
                              ? 'All days' 
                              : template.days.length === 5 
                                ? 'Weekdays' 
                                : `${template.days.length} days`}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-gray-400 mb-3">
                          {template.days.length > 3 
                            ? `${template.days[0]}-${template.days[template.days.length-1]}` 
                            : template.days.join(', ')}
                        </div>
                        
                        <div className="text-sm mb-3">
                          {template.open} - {template.close}
                        </div>
                        
                        <Button 
                          type="button" 
                          size="sm" 
                          className="w-full"
                          onClick={() => applyTemplate(template)}
                        >
                          Apply
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-transparent border-gray-600 text-white hover:bg-gray-700 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSaveStoreHours}
            className="bg-primary hover:bg-primary/90"
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <RefreshCcw size={16} className="animate-spin" />
                Saving...
              </div>
            ) : (
              "Save Hours"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}