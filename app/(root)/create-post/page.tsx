"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Image as ImageIcon, 
  MapPin, 
  Loader2, 
  X, 
  Plus, 
  ArrowLeft 
} from "lucide-react";
import Link from "next/link";

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

// Define form schema
const postSchema = z.object({
  caption: z
    .string()
    .min(1, "Caption cannot be empty")
    .max(1000, "Caption cannot exceed 1000 characters"),
  mediaUrl: z.string().optional(),
  location: z.string().max(100, "Location cannot exceed 100 characters").optional(),
});

type PostValues = z.infer<typeof postSchema>;

export default function CreatePostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const form = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      caption: "",
      mediaUrl: "",
      location: "",
    },
  });

  // Handle image selection and S3 upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Show local preview immediately
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setIsUploading(true);

      // 2. Upload file to S3
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post("/api/upload?type=post", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const data = response.data;

        // 3. Set uploaded S3 URL to form
        setPreviewUrl(data.url);
        form.setValue("mediaUrl", data.url);
      } catch (error: any) {
        console.error("[CreatePost] S3 Upload error:", error);
        alert(error.message || "Failed to upload image. Please try again.");
        // Clear preview on failure
        setPreviewUrl("");
        form.setValue("mediaUrl", "");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeSelectedImage = () => {
    setPreviewUrl("");
    form.setValue("mediaUrl", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Submit handler
  const onSubmit = async (values: PostValues) => {
    if (isUploading) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post("/api/posts", values);
      const data = response.data;

      console.log("[CreatePost] Successfully created post:", data.post);
      router.push("/"); // Redirect to feed
      router.refresh();
    } catch (error: any) {
      console.error("[CreatePost] Submit error:", error);
      alert(error.message || "An unexpected error occurred while sharing your post.");
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const captionValue = form.watch("caption");
  const charCount = captionValue?.length || 0;

  return (
    <div className="w-full flex flex-col gap-6 select-none animate-fade-in">
      {/* Header Row with Back Link */}
      <div className="flex items-center gap-3">
        <Link 
          href="/" 
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/40 dark:bg-zinc-950/45 border border-black/[0.05] dark:border-white/[0.08] text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
            Create a Post
          </h2>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
            Share what is on your mind with other vibesters
          </p>
        </div>
      </div>

      {/* Main Form Container Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white/40 dark:bg-zinc-950/45 backdrop-blur-md border border-black/[0.05] dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.02)] p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Media Upload Box */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Media File (Optional)
              </span>

              {previewUrl ? (
                <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-black/[0.05] dark:border-white/[0.08] bg-black/5 dark:bg-white/5 flex items-center justify-center group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Post preview"
                    className="h-full w-full object-cover"
                  />
                  
                  {/* Upload Overlay spinner */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white font-semibold text-sm">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                      <span>Uploading to S3...</span>
                    </div>
                  )}

                  {/* Remove Image button */}
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all duration-200 hover:scale-105"
                      aria-label="Remove image"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div 
                  onClick={triggerFileSelect}
                  className="w-full h-52 rounded-3xl border-2 border-dashed border-black/[0.08] dark:border-white/[0.12] hover:border-indigo-500/50 dark:hover:border-indigo-400/50 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/5 cursor-pointer flex flex-col items-center justify-center gap-3 transition-all duration-200 select-none group"
                >
                  <div className="h-12 w-12 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/10 flex items-center justify-center text-neutral-500 dark:text-neutral-400 group-hover:scale-105 transition-transform duration-200">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      Click to upload an image
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                      Supports JPG, PNG, GIF, WebP
                    </p>
                  </div>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Caption Input */}
            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-baseline mb-1">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      Caption
                    </FormLabel>
                    <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
                      {charCount}/1000
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Write something cool... Add #hashtags to categorise your vibes!"
                      rows={5}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Input */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Location
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                      <Input 
                        placeholder="e.g. Miami, FL or Paris, France" 
                        className="pl-10" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || isUploading}
              className="w-full h-11 rounded-2xl bg-neutral-950 hover:bg-neutral-900 dark:bg-neutral-50 dark:hover:bg-neutral-100 text-neutral-50 dark:text-neutral-950 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-black/5 hover:scale-102 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Creating Post...
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Uploading Media...
                </>
              ) : (
                <>
                  <Plus className="h-4.5 w-4.5" />
                  Share Post
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
