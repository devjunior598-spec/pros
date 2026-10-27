import { supabase } from "@/lib/supabase"

export const SINGLE_PROPERTY_TYPES = ["Apartment", "Condo", "Townhouse", "Single-Family Home", "Duplex", "Manufactured Home", "Office", "Retail", "Warehouse"]
export const MULTI_PROPERTY_TYPES = ["Multi-family Building", "Condominium Building", "Townhome Community", "Office Building", "Retail Center", "Warehouse", "Mixed Use"]
export const PAYMENT_FREQUENCIES = ["monthly", "quarterly", "biannually", "yearly"]

export function commaList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean)
}

export interface UploadedPropertyImage {
  path: string
  url: string
}

async function compressImage(file: File): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/") || file.type === "image/gif") return file
  const bitmap = await createImageBitmap(file)
  const maxEdge = 2200
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82))
  return blob ? new File([blob], `${file.name.replace(/\.[^/.]+$/, "")}.webp`, { type: "image/webp" }) : file
}

export async function uploadPropertyImages(files: File[], ownerId: string, folder: string): Promise<UploadedPropertyImage[]> {
  if (!files || files.length === 0) return []
  const images: UploadedPropertyImage[] = []
  for (const file of files) {
    if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`)
    if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} exceeds the 8 MB limit.`)
    const prepared = await compressImage(file)
    const path = `${ownerId}/${folder}/${crypto.randomUUID()}.webp`
    const { error } = await supabase.storage.from("property-images").upload(path, prepared, { contentType: prepared.type, upsert: false })
    if (error) {
      await deletePropertyImages(images)
      throw new Error(`Could not upload ${file.name}: ${error.message}`)
    }
    const url = supabase.storage.from("property-images").getPublicUrl(path).data.publicUrl
    if (!url) {
      await deletePropertyImages([...images, { path, url: "" }])
      throw new Error(`Could not create an image URL for ${file.name}.`)
    }
    images.push({ path, url })
  }
  return images
}

export async function deletePropertyImages(images: UploadedPropertyImage[]) {
  const paths = images.map((image) => image.path).filter(Boolean)
  if (paths.length) await supabase.storage.from("property-images").remove(paths)
}
