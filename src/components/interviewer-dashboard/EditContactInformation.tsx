
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Interviewer } from "@/types";
import { useForm } from "react-hook-form";
import { Mail, Phone, MapPin, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EditContactInformationProps {
  interviewer: Interviewer;
  onCancel: () => void;
  onSave: (updatedInterviewer: Interviewer) => void;
}

export const EditContactInformation: React.FC<EditContactInformationProps> = ({
  interviewer,
  onCancel,
  onSave,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      email: interviewer.email || "",
      phone: interviewer.phone || "",
      island: interviewer.island || "",
      first_name: interviewer.first_name,
      last_name: interviewer.last_name,
    },
  });

  const handleSubmit = async (values: {
    email: string;
    phone: string;
    island: string;
    first_name: string;
    last_name: string;
  }) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('interviewers')
        .update({
          email: values.email,
          phone: values.phone,
          island: values.island || null,
          first_name: values.first_name,
          last_name: values.last_name,
        })
        .eq('id', interviewer.id);

      if (error) throw error;

      toast({
        title: "Contact information updated",
        description: "The interviewer's contact details have been updated successfully.",
      });

      onSave({
        ...interviewer,
        email: values.email,
        phone: values.phone,
        island: values.island as "Bonaire" | "Saba" | "Sint Eustatius" | undefined,
        first_name: values.first_name,
        last_name: values.last_name,
      });
    } catch (error) {
      console.error("Error updating contact information:", error);
      toast({
        title: "Error",
        description: "Could not update contact information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  First Name
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="First name" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Last Name
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Last name" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Email
                </FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="Email address" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Phone
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Phone number" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="island"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Island
                </FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    {...field}
                  >
                    <option value="">Select island</option>
                    <option value="Bonaire">Bonaire</option>
                    <option value="Saba">Saba</option>
                    <option value="Sint Eustatius">Sint Eustatius</option>
                  </select>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
