import { PostItem } from "./post-item"

interface Post {
    id: string
    content: string
    created_at: string
    author: {
        name: string
    } | null
}

interface PostListProps {
    posts: Post[]
}

export function PostList({ posts }: PostListProps) {
    if (posts.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No posts yet. Be the first to share something!
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <PostItem key={post.id} post={post} />
            ))}
        </div>
    )
}
