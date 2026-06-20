"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { CreatePostForm } from "./create-post-form"
import { PostList } from "./post-list"
import { Loader2 } from "lucide-react"

interface NewsFeedProps {
    userId: string
    limit?: number
}

export function NewsFeed({ userId, limit }: NewsFeedProps) {
    const [posts, setPosts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchPosts = useCallback(async () => {
        try {
            let query = supabase
                .from("news_feed")
                .select(`
                    id,
                    content,
                    created_at,
                    author:author_id (
                        name
                    )
                `)
                .order("created_at", { ascending: false })

            if (limit) {
                query = query.limit(limit)
            }

            const { data, error } = await query

            if (error) {
                console.error("Error fetching posts:", error)
            } else {
                setPosts(data || [])
            }
        } catch (err) {
            console.error("Unexpected error:", err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPosts()

        // Optional: Set up realtime subscription
        const channel = supabase
            .channel('public:news_feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news_feed' }, () => {
                fetchPosts()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchPosts])

    return (
        <div className="max-w-2xl mx-auto py-6">
            <h2 className="text-2xl font-bold mb-6">News Feed</h2>
            <CreatePostForm authorId={userId} onPostCreated={fetchPosts} />

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <PostList posts={posts} />
            )}
        </div>
    )
}
