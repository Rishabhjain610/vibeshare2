"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  bio: z.string().max(160, "Bio cannot exceed 160 characters"),
  profilePhoto: z.string(),
  location: z.string().max(100, "Location cannot exceed 100 characters").optional(),
  website: z.string().max(100, "Website URL cannot exceed 100 characters").optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

interface AccountProfileProps {
  initialData?: {
    name: string;
    username: string;
    bio: string;
    profilePhoto: string;
    location: string;
    website: string;
  };
}

const AccountProfile = ({ initialData }: AccountProfileProps) => {
  const { user } = useUser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData?.name || "",
      username: initialData?.username || "",
      bio: initialData?.bio || "",
      profilePhoto: initialData?.profilePhoto || "",
      location: initialData?.location || "",
      website: initialData?.website || "",
    },
  });

  // Prepopulate form when user mounts
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
      setPreviewUrl(initialData.profilePhoto || "");
    } else if (user) {
      form.reset({
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        username: user.username || "",
        bio: "",
        profilePhoto: user.imageUrl || "",
        location: "",
        website: "",
      });
      setPreviewUrl(user.imageUrl || "");
    }
  }, [user, initialData, form]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Show local preview immediately
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setIsLoading(true);

      // 2. Upload to S3 API
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post("/api/upload?type=profile", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const data = response.data;

        // 3. Update preview and form value with S3 URL
        setPreviewUrl(data.url);
        form.setValue("profilePhoto", data.url);
      } catch (error: any) {
        console.error("[AccountProfile] Upload error:", error);
        alert(error.message || "Failed to upload profile photo. Please try again.");
        // Revert to original
        setPreviewUrl(form.getValues("profilePhoto") || "");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (values: ProfileValues) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/profile", values);
      const data = response.data;

      router.push(`/profile/${data.user.username}`);
    } catch (error: any) {
      console.error("[AccountProfile] Submit error:", error);
      alert(error.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5 w-full bg-white dark:bg-black p-6 rounded-3xl border border-black/[0.05] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
      >
        {/* Profile Photo Upload */}
        <div className="flex flex-col items-center gap-2">
          <div
            onClick={triggerFileSelect}
            className="relative h-20 w-20 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/10 flex items-center justify-center cursor-pointer group overflow-hidden transition-all duration-200 hover:scale-102"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Profile preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <Camera className="h-6 w-6 text-neutral-400 dark:text-neutral-500" />
            )}

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <span
            onClick={triggerFileSelect}
            className="text-xs font-medium text-neutral-400 hover:text-neutral-950 dark:text-neutral-500 dark:hover:text-neutral-200 cursor-pointer transition-colors duration-200"
          >
            Change Photo
          </span>
        </div>

        {/* Full Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Full Name
              </FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Username */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Username
              </FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bio */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Bio
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell other vibesters about yourself..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Location
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., New York, USA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Website */}
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Website URL
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., https://yourwebsite.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 rounded-xl bg-neutral-950 hover:bg-neutral-900 dark:bg-neutral-50 dark:hover:bg-neutral-100 text-neutral-50 dark:text-neutral-950 font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm mt-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving Profile...
            </>
          ) : (
            "Save and Continue"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AccountProfile;
