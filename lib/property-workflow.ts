import { supabase } from "@/lib/supabase"

export const SINGLE_PROPERTY_TYPES = ["Single Room", "Self Contain", "Room and Parlour", "Mini Flat", "One Bedroom Flat", "Two Bedroom Flat", "Three Bedroom Flat", "Four Bedroom Flat", "Duplex", "Bungalow", "Warehouse"]
export const MULTI_PROPERTY_TYPES = ["Apartment Building", "Hostel", "Estate", "Office Complex", "Shopping Plaza", "Commercial Building", "Mixed Use Property"]
export const PAYMENT_FREQUENCIES = ["monthly", "quarterly", "biannually", "yearly"]

export function commaList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean)
}

export async function uploadPropertyImages(files: File[], ownerId: string, folder: string) {
  const urls: string[] = []
  for (const file of files) {
    if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`)
    if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} exceeds the 8 MB limit.`)
    const extension = file.name.split(".").pop() ?? "jpg"
    const path = `${ownerId}/${folder}/${crypto.randomUUID()}.${extension}`
    const { error } = await supabase.storage.from("property-images").upload(path, file)
    if (error) throw error
    urls.push(supabase.storage.from("property-images").getPublicUrl(path).data.publicUrl)
  }
  return urls
}
