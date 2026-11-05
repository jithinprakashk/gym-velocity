import { ActionForm } from "@/components/action-form";
import { AdminPage } from "@/components/admin-page";
import { Field } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { deleteGalleryImage, uploadGalleryImage } from "./actions";

export default async function GalleryPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("gallery_images").select("id, storage_path, title").order("sort_order").order("created_at", { ascending: false });
  return (
    <AdminPage title="Gallery management" current="/admin/gallery">
      <section className="max-w-xl rounded-xl border border-edge bg-panel p-5">
        <h2 className="text-2xl">Upload image</h2>
        <p className="mt-2 text-sm text-mist">Supabase Storage serves these images publicly. Maximum file size is 10 MB.</p>
        <ActionForm action={uploadGalleryImage} submitLabel="Upload" className="mt-5 space-y-4">
          <Field label="Image" name="file" type="file" accept="image/*" required />
          <Field label="Title (optional)" name="title" />
        </ActionForm>
      </section>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((image) => {
          const url = supabase.storage.from("gallery").getPublicUrl(image.storage_path).data.publicUrl;
          return <article key={image.id} className="overflow-hidden rounded-xl border border-edge bg-panel"><img src={url} alt={image.title || "Gym gallery"} className="aspect-[4/3] w-full object-cover" /><div className="flex items-center justify-between gap-3 p-3"><span className="text-sm">{image.title || "Untitled image"}</span><ActionForm action={deleteGalleryImage} submitLabel="Delete" confirm="Delete this gallery image?" className="m-0" buttonClass="btn btn-ghost !min-h-9 !px-3 !text-xs"><input type="hidden" name="id" value={image.id} /><input type="hidden" name="path" value={image.storage_path} /></ActionForm></div></article>;
        })}
      </div>
    </AdminPage>
  );
}
