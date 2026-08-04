"use client"

import { useEffect, useRef } from "react"
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff, X } from "lucide-react"
import { useChat } from "./chat-provider"
import { Button } from "@/components/ui/button"

export function CallModal() {
  const { activeCall, acceptCall, declineCall, endCall, dismissCall, toggleMute, toggleCamera } = useChat()
  const localVideo = useRef<HTMLVideoElement>(null)
  const remoteVideo = useRef<HTMLVideoElement>(null)

  useEffect(() => { if (localVideo.current) localVideo.current.srcObject = activeCall.localStream }, [activeCall.localStream])
  useEffect(() => { if (remoteVideo.current) remoteVideo.current.srcObject = activeCall.remoteStream }, [activeCall.remoteStream])
  if (activeCall.phase === "idle") return null

  const canControl = ["outgoing", "connecting", "active"].includes(activeCall.phase)
  const label = activeCall.phase === "incoming" ? `Incoming ${activeCall.type} call` : activeCall.phase === "outgoing" ? "Calling…" : activeCall.phase === "active" ? "Connected" : activeCall.phase === "requesting" ? "Requesting device access…" : activeCall.phase === "error" ? "Call unavailable" : activeCall.phase === "ended" ? "Call ended" : "Connecting…"

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={label}>
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950 text-white shadow-2xl">
        <div className="relative flex min-h-[420px] items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-6">
          {activeCall.type === "video" && activeCall.remoteStream ? <video ref={remoteVideo} autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" /> : <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-600/20 ring-1 ring-blue-400/30"><Phone className="h-12 w-12 text-blue-300" /></div>}
          {activeCall.type === "video" && activeCall.localStream && <video ref={localVideo} autoPlay muted playsInline className="absolute bottom-6 right-6 h-28 w-40 rounded-xl border border-white/20 bg-black object-cover shadow-xl sm:h-36 sm:w-52" />}
          <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-6 text-center"><h2 className="text-xl font-semibold">{label}</h2>{activeCall.error && <p className="mx-auto mt-2 max-w-lg text-sm text-red-200">{activeCall.error}</p>}</div>
        </div>
        <div className="flex min-h-24 items-center justify-center gap-3 border-t border-white/10 bg-slate-900 px-4 py-5">
          {activeCall.phase === "incoming" ? <><Button size="lg" className="rounded-full bg-emerald-600 hover:bg-emerald-700" onClick={() => void acceptCall()}><Phone className="mr-2 h-5 w-5" />Answer</Button><Button size="lg" variant="destructive" className="rounded-full" onClick={() => void declineCall()}><PhoneOff className="mr-2 h-5 w-5" />Decline</Button></> : canControl ? <><Button size="icon-lg" variant={activeCall.muted ? "destructive" : "secondary"} className="rounded-full" onClick={toggleMute} aria-label={activeCall.muted ? "Unmute" : "Mute"}>{activeCall.muted ? <MicOff /> : <Mic />}</Button>{activeCall.type === "video" && <Button size="icon-lg" variant={activeCall.cameraOff ? "destructive" : "secondary"} className="rounded-full" onClick={toggleCamera} aria-label={activeCall.cameraOff ? "Turn camera on" : "Turn camera off"}>{activeCall.cameraOff ? <VideoOff /> : <Video />}</Button>}<Button size="icon-lg" variant="destructive" className="rounded-full" onClick={() => void endCall()} aria-label="End call"><PhoneOff /></Button></> : <Button variant="secondary" onClick={dismissCall}><X className="mr-2 h-4 w-4" />Close</Button>}
        </div>
      </div>
    </div>
  )
}
