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
              className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition shadow-lg"
            >

              {/* MESSAGE */}
              <p className="text-lg leading-relaxed">
                {post.message}
              </p>

              {/* ACTION BAR */}
              <div className="flex gap-6 mt-4 text-sm text-gray-400">


                <button
                  onClick={() => handleLike(post)}
                  className="hover:text-pink-400 transition disabled:opacity-50"
                  disabled={getLikedPosts().includes(post.id)}
                >
                  ❤️ {post.likes || 0}
                </button>

                <button className="hover:text-blue-400 transition">
                  💬 Reply
                </button>

                <button className="hover:text-green-400 transition">
                  🔁 Share
                </button>

              </div>

              <div className="text-xs text-gray-500 mt-2">
                👤 {post.username || "Anonymous"}
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