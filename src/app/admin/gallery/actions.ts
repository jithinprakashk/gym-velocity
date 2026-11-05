"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function uploadGalleryImage(_prev: { error?: string; message?: string } | undefined, fd: FormData) {
  const profile = await requireRole("admin");
  const file = fd.get("file");
  const title = z.string().trim().max(160).parse(fd.get("title") ?? "");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image to upload." };
  if (!file.type.startsWith("image/")) return { error: "Only image files can be uploaded." };
  if (file.size > 10 * 1024 * 1024) return { error: "Images must be 10 MB or smaller." };
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${randomUUID()}.${ext}`;
  const supabase = await createClient();
  const upload = await supabase.storage.from("gallery").upload(path, file, { contentType: file.type, upsert: false });
  if (upload.error) return { error: "Could not upload the image." };
  const { error } = await supabase.from("gallery_images").insert({ storage_path: path, title, uploaded_by: profile.id });
  if (error) {
    await supabase.storage.from("gallery").remove([path]);
    return { error: "Could not save the gallery image." };
  }
  revalidatePath("/admin/gallery");
  revalidatePath("/");
  return { message: "Image uploaded." };
}

export async function deleteGalleryImage(_prev: { error?: string; message?: string } | undefined, fd: FormData) {
  await requireRole("admin");
  const id = z.string().uuid().safeParse(fd.get("id"));
  const path = z.string().min(1).safeParse(fd.get("path"));
  if (!id.success || !path.success) return { error: "Invalid gallery image." };
  const supabase = await createClient();
  const removed = await supabase.storage.from("gallery").remove([path.data]);
  if (removed.error) return { error: "Could not remove the image file." };
  const { error } = await supabase.from("gallery_images").delete().eq("id", id.data);
  if (error) return { error: "Could not remove the gallery record." };
  revalidatePath("/admin/gallery");
  revalidatePath("/");
  return { message: "Image removed." };
}
