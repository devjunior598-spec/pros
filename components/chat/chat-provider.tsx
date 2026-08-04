"use client"

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export type CallType = "audio" | "video"
export type CallPhase = "idle" | "requesting" | "outgoing" | "incoming" | "connecting" | "active" | "ended" | "error"

type CallRecord = {
  id: string
  conversation_id: string
  caller_id: string
  receiver_id: string
  type: CallType
  status: string
  offer: RTCSessionDescriptionInit | null
  answer: RTCSessionDescriptionInit | null
}

export type ActiveCall = {
  id: string | null
  conversationId: string | null
  otherUserId: string | null
  type: CallType
  phase: CallPhase
  incoming: boolean
  muted: boolean
  cameraOff: boolean
  error: string | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
}

interface ChatContextType {
  isConnected: boolean
  unreadMessageCount: number
  typingUsers: Record<string, string[]>
  activeCall: ActiveCall
  sendTyping: (conversationId: string, isTyping: boolean) => void
  markMessageAsRead: (conversationId: string, messageId: string) => void
  callUser: (id: string, type: CallType, conversationId: string) => Promise<void>
  acceptCall: () => Promise<void>
  declineCall: () => Promise<void>
  endCall: () => Promise<void>
  dismissCall: () => void
  toggleMute: () => void
  toggleCamera: () => void
}

const emptyCall: ActiveCall = {
  id: null, conversationId: null, otherUserId: null, type: "audio", phase: "idle", incoming: false,
  muted: false, cameraOff: false, error: null, localStream: null, remoteStream: null,
}

const ChatContext = createContext<ChatContextType | null>(null)

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) throw new Error("useChat must be used inside ChatProvider")
  return context
}

const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
}

function waitForIceGathering(peer: RTCPeerConnection) {
  if (peer.iceGatheringState === "complete") return Promise.resolve()
  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(done, 5000)
    function done() {
      window.clearTimeout(timeout)
      peer.removeEventListener("icegatheringstatechange", check)
      resolve()
    }
    function check() { if (peer.iceGatheringState === "complete") done() }
    peer.addEventListener("icegatheringstatechange", check)
  })
}

function mediaErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "NotAllowedError") return "Microphone or camera permission was denied. Allow access in your browser settings and try again."
  if (error instanceof DOMException && error.name === "NotFoundError") return "The required microphone or camera was not found on this device."
  return error instanceof Error ? error.message : "The call could not be started."
}

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({})
  const [globalChannel, setGlobalChannel] = useState<RealtimeChannel | null>(null)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [activeCall, setActiveCall] = useState<ActiveCall>(emptyCall)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const callRef = useRef<ActiveCall>(emptyCall)
  const currentUserIdRef = useRef<string | null>(null)

  useEffect(() => { callRef.current = activeCall }, [activeCall])

  const stopMedia = useCallback(() => {
    peerRef.current?.close()
    peerRef.current = null
    callRef.current.localStream?.getTracks().forEach(track => track.stop())
    callRef.current.remoteStream?.getTracks().forEach(track => track.stop())
  }, [])

  const createPeer = useCallback((localStream: MediaStream) => {
    const peer = new RTCPeerConnection(rtcConfiguration)
    const remoteStream = new MediaStream()
    localStream.getTracks().forEach(track => peer.addTrack(track, localStream))
    peer.ontrack = event => {
      event.streams[0]?.getTracks().forEach(track => remoteStream.addTrack(track))
      setActiveCall(current => ({ ...current, remoteStream, phase: "active" }))
    }
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") setActiveCall(current => ({ ...current, phase: "active", error: null }))
      if (["failed", "disconnected"].includes(peer.connectionState)) {
        setActiveCall(current => ({ ...current, phase: "error", error: "The call connection was lost." }))
      }
    }
    peerRef.current = peer
    return { peer, remoteStream }
  }, [])

  useEffect(() => {
    let active = true
    let messageChannel: RealtimeChannel | null = null
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) return
      currentUserIdRef.current = user.id
      const refreshCount = async () => {
        const { data: conversations } = await supabase.from("conversations").select("id").or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`)
        const ids = (conversations || []).map(item => item.id)
        if (!ids.length) return setUnreadMessageCount(0)
        const { count } = await supabase.from("messages").select("id", { count: "exact", head: true }).in("conversation_id", ids).neq("sender_id", user.id).is("read_at", null)
        if (active) setUnreadMessageCount(count || 0)
      }
      await refreshCount()
      messageChannel = supabase.channel(`chat-events:${user.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => void refreshCount())
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => void refreshCount())
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "calls", filter: `receiver_id=eq.${user.id}` }, payload => {
          const call = payload.new as CallRecord
          if (callRef.current.phase !== "idle") {
            void supabase.from("calls").update({ status: "declined", ended_at: new Date().toISOString() }).eq("id", call.id)
            return
          }
          setActiveCall({ ...emptyCall, id: call.id, conversationId: call.conversation_id, otherUserId: call.caller_id, type: call.type, phase: "incoming", incoming: true })
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "calls", filter: `caller_id=eq.${user.id}` }, payload => {
          const call = payload.new as CallRecord
          if (call.id !== callRef.current.id) return
          if (call.status === "declined" || call.status === "missed") {
            stopMedia(); setActiveCall(current => ({ ...current, phase: "ended", error: call.status === "declined" ? "Call declined." : "No answer." }))
          } else if (call.status === "completed") {
            stopMedia(); setActiveCall(current => ({ ...current, phase: "ended" }))
          } else if (call.answer && peerRef.current && !peerRef.current.remoteDescription) {
            void peerRef.current.setRemoteDescription(call.answer).then(() => setActiveCall(current => ({ ...current, phase: "connecting" })))
          }
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "calls", filter: `receiver_id=eq.${user.id}` }, payload => {
          const call = payload.new as CallRecord
          if (call.id === callRef.current.id && call.status === "completed") {
            stopMedia(); setActiveCall(current => ({ ...current, phase: "ended" }))
          }
        })
        .subscribe(status => setIsConnected(status === "SUBSCRIBED"))
    }
    void initialize()
    return () => { active = false; if (messageChannel) supabase.removeChannel(messageChannel); stopMedia() }
  }, [stopMedia])

  useEffect(() => {
    const channel = supabase.channel("global_chat_presence")
      .on("broadcast", { event: "typing" }, payload => {
        const { conversation_id, userId, isTyping } = payload.payload
        setTypingUsers(previous => {
          const current = previous[conversation_id] || []
          return { ...previous, [conversation_id]: isTyping ? Array.from(new Set([...current, userId])) : current.filter(id => id !== userId) }
        })
      })
      .subscribe(status => { if (status === "SUBSCRIBED") setGlobalChannel(channel) })
    return () => { supabase.removeChannel(channel) }
  }, [])

  const sendTyping = async (conversationId: string, isTyping: boolean) => {
    if (!globalChannel || !currentUserIdRef.current) return
    await globalChannel.send({ type: "broadcast", event: "typing", payload: { conversation_id: conversationId, userId: currentUserIdRef.current, isTyping } })
  }

  const markMessageAsRead = useCallback(async (conversationId: string, messageId: string) => {
    await fetch("/api/messages/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId, messageId }) })
  }, [])

  const callUser = async (otherUserId: string, type: CallType, conversationId: string) => {
    if (!currentUserIdRef.current || activeCall.phase !== "idle") return
    setActiveCall({ ...emptyCall, otherUserId, conversationId, type, phase: "requesting" })
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === "video" })
      setActiveCall(current => ({ ...current, localStream: stream, phase: "connecting" }))
      const { peer, remoteStream } = createPeer(stream)
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      await waitForIceGathering(peer)
      const { data, error } = await supabase.from("calls").insert({ conversation_id: conversationId, caller_id: currentUserIdRef.current, receiver_id: otherUserId, type, status: "ringing", offer: peer.localDescription?.toJSON() }).select("id").single()
      if (error) throw error
      setActiveCall(current => ({ ...current, id: data.id, phase: "outgoing", remoteStream }))
    } catch (error) {
      stopMedia()
      setActiveCall(current => ({ ...current, phase: "error", error: mediaErrorMessage(error) }))
    }
  }

  const acceptCall = async () => {
    const call = callRef.current
    if (!call.id || call.phase !== "incoming") return
    setActiveCall(current => ({ ...current, phase: "requesting" }))
    try {
      const { data: record, error } = await supabase.from("calls").select("offer").eq("id", call.id).single()
      if (error || !record?.offer) throw error || new Error("Call invitation is no longer available.")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: call.type === "video" })
      const { peer, remoteStream } = createPeer(stream)
      setActiveCall(current => ({ ...current, localStream: stream, remoteStream, phase: "connecting" }))
      await peer.setRemoteDescription(record.offer as RTCSessionDescriptionInit)
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      await waitForIceGathering(peer)
      const { error: updateError } = await supabase.from("calls").update({ answer: peer.localDescription?.toJSON(), status: "ongoing" }).eq("id", call.id)
      if (updateError) throw updateError
    } catch (error) {
      stopMedia()
      setActiveCall(current => ({ ...current, phase: "error", error: mediaErrorMessage(error) }))
    }
  }

  const finishCall = async (status: "declined" | "completed") => {
    const id = callRef.current.id
    stopMedia()
    if (id) await supabase.from("calls").update({ status, ended_at: new Date().toISOString() }).eq("id", id)
    setActiveCall(current => ({ ...current, phase: "ended" }))
  }

  const toggleMute = () => setActiveCall(current => {
    const muted = !current.muted
    current.localStream?.getAudioTracks().forEach(track => { track.enabled = !muted })
    return { ...current, muted }
  })
  const toggleCamera = () => setActiveCall(current => {
    const cameraOff = !current.cameraOff
    current.localStream?.getVideoTracks().forEach(track => { track.enabled = !cameraOff })
    return { ...current, cameraOff }
  })
  const dismissCall = () => { stopMedia(); setActiveCall(emptyCall) }

  return <ChatContext.Provider value={{ isConnected, unreadMessageCount, typingUsers, activeCall, sendTyping, markMessageAsRead, callUser, acceptCall, declineCall: () => finishCall("declined"), endCall: () => finishCall("completed"), dismissCall, toggleMute, toggleCamera }}>{children}</ChatContext.Provider>
}
