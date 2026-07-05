"use client";

import React, { useState, useRef } from "react"; // State management aur dynamic references ke liye React hooks.
import { useRouter } from "next/navigation"; // Form submit hone par `/reels` par navigate karne ke liye router hook.
import axios from "axios"; // API requests ko manage karne ke liye Axios import kiya.
import { useForm } from "react-hook-form"; // Form state aur validation handle karne ke liye React Hook Form.
import { zodResolver } from "@hookform/resolvers/zod"; // Zod validation schema link karne ke liye resolver.
import * as z from "zod"; // Validation schema structure define karne ke liye Zod.
import { 
  Film, 
  MapPin, 
  Loader2, 
  X, 
  Plus, 
  ArrowLeft 
} from "lucide-react"; // Icons import kiye.
import Link from "next/link"; // Client routing ke liye Next.js Link.

import { Button } from "@/components/ui/button"; // Reusable UI components import kiye.
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

// 1. Zod Validation Schema define karenge Reel create ke liye
const reelSchema = z.object({
  caption: z
    .string()
    .min(1, "Caption cannot be empty") // Minimum 1 character zaroori hai.
    .max(1000, "Caption cannot exceed 1000 characters"), // Maximum 1000 chars.
  mediaUrl: z.string().min(1, "Please upload a video for your Reel"), // Reel ke liye video mandatory hai.
  location: z.string().max(100, "Location cannot exceed 100 characters").optional(), // Location name limit 100.
});

type ReelValues = z.infer<typeof reelSchema>;

export default function CreateReelPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null); // File upload trigger ke liye ref handler.

  const [isLoading, setIsLoading] = useState(false); // Post publication loading state.
  const [isUploading, setIsUploading] = useState(false); // Video uploading animation state.
  const [previewUrl, setPreviewUrl] = useState(""); // Selected video file local preview blob URL.
  const [characterCount, setCharacterCount] = useState(0); // Input caption counter.

  // 2. React Hook Form implementation
  const form = useForm<ReelValues>({
    resolver: zodResolver(reelSchema),
    defaultValues: {
      caption: "",
      mediaUrl: "",
      location: "",
    },
  });

  // 3. Video selection and S3 uploading controller.
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Safety Check: Sirf video formats allow karenge.
      if (!file.type.startsWith("video/")) {
        alert("Please select a valid video file!");
        return;
      }

      // Max size limit validation: 50MB maximum payload check.
      if (file.size > 50 * 1024 * 1024) {
        alert("Video size must be less than 50MB!");
        return;
      }

      // Local preview generate kiya video player me render ke liye.
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file); // Selected file append ki.

        // Axios POST request to S3 upload route with type=reel so it stores under 'reels/' folder in S3.
        const response = await axios.post("/api/upload?type=reel", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const data = response.data;

        // Set S3 uploaded URL path to form state.
        setPreviewUrl(data.url);
        form.setValue("mediaUrl", data.url);
      } catch (error: any) {
        console.error("[CreateReel] S3 Upload failed:", error);
        alert(error.response?.data?.error || error.message || "Failed to upload video. Please try again.");
        // Clear preview states on failure.
        setPreviewUrl("");
        form.setValue("mediaUrl", "");
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Video reset/remove handler.
  const removeSelectedVideo = () => {
    setPreviewUrl("");
    form.setValue("mediaUrl", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Input DOM values clear kiya.
    }
  };

  // 4. Form Submit Handler (Post share controller)
  const onSubmit = async (values: ReelValues) => {
    setIsLoading(true);

    try {
      // Axios call database POST /api/posts to insert the new Reel (post table item)
      await axios.post("/api/posts", {
        caption: values.caption,
        mediaUrl: values.mediaUrl,
        location: values.location || "",
      });

      // Clear local state variables.
      form.reset();
      setPreviewUrl("");

      // Redirect user directly to `/reels` page so they can watch their reel.
      router.push("/reels");
      router.refresh(); // Refresh state components immediately.
    } catch (error: any) {
      console.error("[CreateReel] Database publication failed:", error);
      alert(error.response?.data?.error || error.message || "Failed to publish Reel. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 select-none animate-fade-in pb-10">
      
      {/* Back Button Header */}
      <div className="flex items-center gap-2">
        <Link href="/reels">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900"
            aria-label="Back to Reels"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-50">
            Create Reel
          </h1>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">
            Share a short video reel with the world
          </p>
        </div>
      </div>

      {/* Main Form container */}
      <div className="w-full overflow-hidden rounded-[2.5rem] bg-white/40 dark:bg-zinc-950/45 backdrop-blur-md border border-black/[0.05] dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.015)] p-5 md:p-8">
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* A. Video Upload Section */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Upload Video
              </span>
              
              <div className="relative w-full aspect-[9/16] max-w-[320px] mx-auto rounded-[2rem] border-2 border-dashed border-black/10 dark:border-white/10 bg-black/5 dark:bg-zinc-950/40 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 hover:border-indigo-500/50 dark:hover:border-indigo-400/50">
                
                {previewUrl ? (
                  /* Case A: Previewing selected video */
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
                    <video 
                      src={previewUrl} 
                      controls 
                      className="w-full h-full object-cover" 
                      playsInline
                    />
                    
                    {/* Delete preview button */}
                    {!isUploading && !isLoading && (
                      <button
                        type="button"
                        onClick={removeSelectedVideo}
                        className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all duration-200 shadow-md backdrop-blur-sm hover:scale-105"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  /* Case B: Empty selection upload prompt area */
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer focus:outline-none"
                  >
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl mb-3 border border-indigo-100/50 dark:border-indigo-950/30">
                      <Film className="h-7 w-7 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                      Select Video
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 font-semibold uppercase tracking-wider">
                      MP4, MOV or WebM (Max 50MB)
                    </span>
                  </button>
                )}

                {/* Loading state overlays */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-2" />
                    <span className="text-xs font-bold uppercase tracking-wider">Uploading to S3...</span>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading || isLoading}
              />
              
              {/* Form validation messages */}
              <FormField
                control={form.control}
                name="mediaUrl"
                render={() => (
                  <FormItem>
                    <FormMessage className="text-rose-500 text-xs font-bold text-center mt-1" />
                  </FormItem>
                )}
              />
            </div>

            {/* B. Caption Box */}
            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Caption
                    </FormLabel>
                    {/* Character limit counting widget */}
                    <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500">
                      {characterCount} / 1000
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="What is happening in this Reel? Share details, write tags #dance #vibes..."
                      className="min-h-[100px] max-h-[220px] rounded-2xl border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-zinc-950/20 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus-visible:ring-1 focus-visible:ring-neutral-950 dark:focus-visible:ring-neutral-300 font-semibold p-4"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setCharacterCount(e.target.value.length); // Character tracker increment.
                      }}
                      disabled={isUploading || isLoading}
                    />
                  </FormControl>
                  <FormMessage className="text-rose-500 text-xs font-bold" />
                </FormItem>
              )}
            />

            {/* C. Location Input */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                    <span>Location (Optional)</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                      <Input
                        placeholder="Add location (e.g. Mumbai, India)"
                        className="rounded-2xl border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-zinc-950/20 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus-visible:ring-1 focus-visible:ring-neutral-950 dark:focus-visible:ring-neutral-300 font-semibold pl-5 py-5.5"
                        {...field}
                        disabled={isUploading || isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-rose-500 text-xs font-bold" />
                </FormItem>
              )}
            />

            {/* Submit Action Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isUploading || isLoading || !previewUrl}
                className="w-full py-6 rounded-2xl bg-neutral-950 text-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 font-bold hover:bg-neutral-900 dark:hover:bg-white/90 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/5 hover:scale-101 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Publishing Reel...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span>Publish Reel</span>
                  </>
                )}
              </Button>
            </div>

          </form>
        </Form>
      </div>
    </div>
  );
}
