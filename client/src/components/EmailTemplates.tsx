import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Save } from "lucide-react";
import type { EmailTemplate } from "@shared/schema";

export default function EmailTemplates() {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formSubject, setFormSubject] = useState("");
  const [formBodyText, setFormBodyText] = useState("");

  const { data: templates = [], isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
  });

  const selected = templates.find((t) => t.id === selectedId) ?? null;

  const handleSelect = (template: EmailTemplate) => {
    setSelectedId(template.id);
    setFormSubject(template.subject);
    setFormBodyText(template.bodyText);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) throw new Error("No template selected");
      return apiRequest("PATCH", `/api/admin/email-templates/${selectedId}`, {
        subject: formSubject,
        bodyText: formBodyText,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      toast({ title: "Template saved!", description: "Changes will apply to the next email sent." });
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-2">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Email Templates
        </h2>
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => handleSelect(t)}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
              selectedId === t.id
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <p className="text-sm font-medium">{t.templateName}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{t.templateId}</p>
          </button>
        ))}
      </div>

      <div className="md:col-span-2">
        {!selected ? (
          <div className="flex items-center justify-center h-full py-24 text-muted-foreground text-sm">
            Select a template on the left to edit it.
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{selected.templateName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-md bg-muted/50 border border-border px-4 py-3 text-sm">
                <p className="font-semibold text-foreground mb-1">Available variables you can use:</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selected.availableVariables.split(",").map((v) => (
                    <Badge key={v.trim()} variant="secondary" className="font-mono text-xs">
                      {v.trim()}
                    </Badge>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs mt-2">
                  Type these exactly (including brackets) anywhere in the subject or body text and they will be replaced automatically when the email is sent.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Email subject..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bodyText">Body Text</Label>
                <Textarea
                  id="bodyText"
                  value={formBodyText}
                  onChange={(e) => setFormBodyText(e.target.value)}
                  rows={10}
                  placeholder="Email body text..."
                  className="font-mono text-sm resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  Plain text only — HTML structure, buttons, and links are managed separately and cannot be edited here.
                </p>
              </div>

              <Button
                className="w-full"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
