import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"

export default function App() {
  const [message, setMessage] = useState("")
  const [posts, setPosts] = useState([])

  async function fetchPosts() {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })

    setPosts(data || [])
  }

  useEffect(() => {
    fetchPosts()

    const channel = supabase
      .channel('posts-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => fetchPosts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  function generateUsername() {
    const words = ["Silent", "Dark", "Ghost", "Hidden", "Shadow", "Void"]
    const num = Math.floor(Math.random() * 9999)
    return words[Math.floor(Math.random() * words.length)] + num
  }

  async function handleLike(post) {
    const likedPosts = getLikedPosts()

    if (likedPosts.includes(post.id)) {
      return
    }

    setPosts(prev =>
      prev.map(p =>
        p.id === post.id
          ? { ...p, likes: (p.likes || 0) + 1 }
          : p
      )
    )

    // DB update
    await supabase
      .from("posts")
      .update({ likes: (post.likes || 0) + 1 })
      .eq("id", post.id)

    // save like locally
    setLikedPosts([...likedPosts, post.id])
  }

  function getLikedPosts() {
    return JSON.parse(localStorage.getItem("likedPosts") || "[]")
  }

  function setLikedPosts(list) {
    localStorage.setItem("likedPosts", JSON.stringify(list))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!message.trim()) return

    const username = generateUsername()

    await supabase.from("posts").insert([
      {
        message,
        username,
        likes: 0
      }
    ])

    setMessage("")
  }

  return (
    <div className="min-h-screen bg-[#070A12] text-white">

      {/* TOP BAR */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-black/40 border-b border-white/10 px-4 py-3 flex items-center justify-center relative">

        <h1 className="text-xl font-bold tracking-wide">
          🔥 WhisperWall
        </h1>
      </div>

      {/* MAIN FEED */}
      <div className="max-w-xl mx-auto px-4 pb-32">

        {/* HERO TEXT */}
        <div className="text-center my-6">
          <h2 className="text-3xl font-extrabold">
            Say it. Don’t own it.
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Anonymous confessions that disappear into the feed.
          </p>
        </div>

        {/* POSTS */}
        <div className="space-y-4">

          {posts.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              No posts yet… be the first spark 🔥
            </div>
          )}

          {posts.map((post) => (
            <div
              key={post.id}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-2xl hover:scale-[1.02] hover:bg-white/10 transition duration-300"
            >

              {/* Glow effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-r from-white/5 via-transparent to-white/5 pointer-events-none"></div>

              {/* Message */}
              <p className="relative text-[17px] leading-relaxed text-white font-medium">
                {post.message}
              </p>

              {/* Footer */}
              <div className="relative flex items-center justify-between mt-5 pt-4 border-t border-white/10">

                <button
                  onClick={() => handleLike(post)}
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-pink-500/20 text-sm text-gray-300 hover:text-pink-300 transition"
                >
                  ❤️ {post.likes || 0}
                </button>

                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    👤 {post.username || "Anonymous"}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>

              </div>

            </div>
          ))}

        </div>
      </div>

      {/* FLOATING INPUT (VIRAL STYLE) */}
      <form
        onSubmit={handleSubmit}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-xl bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex gap-3 shadow-2xl"
      >
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-white/20"
          placeholder="Drop a confession..."
        />

        <button className="px-5 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 active:scale-95 transition">
          Post
        </button>
      </form>

    </div>
  )
}