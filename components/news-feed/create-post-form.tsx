import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CreatePostFormProps {
    authorId: string
    onPostCreated: () => void
}

export function CreatePostForm({ authorId, onPostCreated }: CreatePostFormProps) {
    const [content, setContent] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return

        setIsLoading(true)
        setError(null)

        try {
            const { error: postError } = await supabase
                .from("news_feed")
                .insert([
                    {
                        content: content.trim(),
                        author_id: authorId,
                    },
                ])

            if (postError) throw postError

            setContent("")
            onPostCreated()
        } catch (err: any) {
            setError(err.message || "Failed to post")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="mb-6">
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea
                        placeholder="What's on your mind?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={isLoading}
                        className="min-h-[100px]"
                    />
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading || !content.trim()}>
                            {isLoading ? "Posting..." : "Post"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
