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
      .channel("posts-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
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

  function getLikedPosts() {
    return JSON.parse(localStorage.getItem("likedPosts") || "[]")
  }

  function setLikedPosts(list) {
    localStorage.setItem("likedPosts", JSON.stringify(list))
  }

  async function handleLike(post) {
    const likedPosts = getLikedPosts()

    if (likedPosts.includes(post.id)) return

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likes: (p.likes || 0) + 1 }
          : p
      )
    )

    await supabase
      .from("posts")
      .update({ likes: (post.likes || 0) + 1 })
      .eq("id", post.id)

    setLikedPosts([...likedPosts, post.id])
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!message.trim()) return

    const username = generateUsername()

    await supabase.from("posts").insert([
      {
        message,
        username,
        likes: 0,
      },
    ])

    setMessage("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070A12] via-[#111827] to-[#070A12] text-white relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-pink-500/10 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-500/10 blur-3xl rounded-full"></div>

      {/* TOP BAR */}
      <div className="sticky top-0 z-20 backdrop-blur-2xl bg-black/30 border-b border-white/10 px-4 py-4 flex justify-center">
        <h1 className="text-2xl font-black tracking-wide bg-gradient-to-r from-pink-400 to-purple-400 text-transparent bg-clip-text">
          WhisperWall ✨
        </h1>
      </div>

      {/* MAIN */}
      <div className="max-w-xl mx-auto px-4 pb-36 relative z-10">

        {/* HERO */}
        <div className="text-center py-8">
          <h2 className="text-4xl font-black leading-tight">
            Speak Freely.
            <br />
            Stay Unknown.
          </h2>

          <p className="text-gray-400 mt-3 text-sm">
            Share secrets, confessions, and thoughts anonymously.
          </p>
        </div>

        {/* POSTS */}
        <div className="space-y-5">

          {posts.length === 0 && (
            <div className="text-center text-gray-500 mt-16">
              No whispers yet... be the first 🔥
            </div>
          )}

          {posts.map((post) => (
            <div
              key={post.id}
              className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-5 shadow-2xl hover:-translate-y-1 hover:bg-white/10 transition duration-300"
            >
              {/* Username */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-pink-300">
                  👤 {post.username || "Anonymous"}
                </p>

                <p className="text-xs text-gray-500">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Message */}
              <p className="text-[17px] leading-relaxed text-white">
                {post.message}
              </p>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">

                <button
                  onClick={() => handleLike(post)}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-sm font-medium text-pink-200 transition"
                >
                  ❤️ {post.likes || 0}
                </button>

                <span className="text-xs text-gray-500">
                  Anonymous Voice
                </span>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FLOATING INPUT */}
      <form
        onSubmit={handleSubmit}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 flex gap-3 shadow-2xl z-30"
      >
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 px-4 py-3 rounded-2xl bg-black/30 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-pink-400/40"
          placeholder="Drop your confession..."
        />

        <button className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 font-bold hover:scale-105 active:scale-95 transition">
          Post
        </button>
      </form>
    </div>
  )
}