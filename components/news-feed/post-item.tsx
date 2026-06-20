import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

interface Post {
    id: string
    content: string
    created_at: string
    author: {
        name: string
    } | null
}

interface PostItemProps {
    post: Post
}

export function PostItem({ post }: PostItemProps) {
    return (
        <Card className="mb-4">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-semibold">
                        {post.author?.name || "Unknown Author"}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap text-sm text-foreground/80">{post.content}</p>
            </CardContent>
        </Card>
    )
}
