"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
  useTracks,
  VideoTrack,
  useDataChannel,
  isTrackReference,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { topicApi } from "@/services/topicService";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  ArrowLeft,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  X,
  Users,
  MessageSquare,
  Info,
  Hand,
  Smile,
  ShieldAlert,
  LogOut,
  CircleDot,
  Layout,
  Send,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

export default function MeetingRoomPage() {
  const { id: topicId } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const router = useRouter();

  const [token, setToken] = useState<string>("");
  const [roomName, setRoomName] = useState<string>("");
  const [wsUrl, setWsUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || !topicId) {
      setError("Missing course or topic information");
      setIsLoading(false);
      return;
    }
    fetchToken();
  }, [courseId, topicId]);

  const fetchToken = async () => {
    try {
      setIsLoading(true);
      const res = await topicApi.getMeetingToken(courseId!, topicId);
      const data = res.data;
      setToken(data.token);
      setRoomName(data.roomName);
      setWsUrl(data.wsUrl);
    } catch (err: any) {
      console.error("Failed to get meeting token:", err);
      setError(
        err.response?.data?.error || "Failed to connect to meeting server",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = useCallback(async () => {
    router.push(`/meetings/${topicId}?courseId=${courseId}`);
  }, [courseId, topicId, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-xl font-bold animate-pulse">
          Establishing secure connection...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
        <h1 className="text-3xl font-black mb-4">Connection Blocked</h1>
        <p className="text-slate-400 mb-10">{error}</p>
        <button
          onClick={() => router.back()}
          className="bg-white text-black px-10 py-4 rounded-2xl font-black"
        >
          Return to Class
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black overflow-hidden flex flex-col text-white font-sans selection:bg-blue-500/30">
      <LiveKitRoom
        video={false}
        audio={false}
        token={token}
        serverUrl={
          wsUrl.startsWith("ws")
            ? window.location.protocol === "https:"
              ? wsUrl.replace("ws://", "wss://")
              : wsUrl
            : wsUrl
        }
        onDisconnected={handleLeave}
        connect={true}
        className="flex-1 flex flex-col relative"
      >
        <MeetingRoomInternal
          roomName={roomName}
          wsUrl={wsUrl}
          topicId={topicId}
          courseId={courseId!}
          handleLeave={handleLeave}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function MeetingRoomInternal({
  roomName,
  wsUrl,
  topicId,
  courseId,
  handleLeave,
}: any) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "none" | "details" | "participants" | "chat"
  >("none");
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadChat, setUnreadChat] = useState(false);
  const [reactions, setReactions] = useState<any[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { localParticipant } = useLocalParticipant();

  const { send } = useDataChannel("meeting-data", (data) => {
    const payload = JSON.parse(new TextDecoder().decode(data.payload));
    if (payload.type === "chat") {
      setMessages((prev) => [...prev, payload.data]);
      if (activeTab !== "chat") setUnreadChat(true);
    } else if (payload.type === "reaction") {
      addReaction(payload.data.emoji, payload.data.userName);
    }
  });

  const addReaction = (emoji: string, userName: string) => {
    const id = Date.now() + Math.random();
    setReactions((prev) => [...prev, { id, emoji, userName }]);
    setTimeout(
      () => setReactions((prev) => prev.filter((r) => r.id !== id)),
      4000,
    );
  };

  const handleSendReaction = (emoji: string) => {
    const data = { emoji, userName: user?.username || "Someone" };
    send(new TextEncoder().encode(JSON.stringify({ type: "reaction", data })), {
      reliable: true,
    });
    addReaction(emoji, "You");
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    if (activeTab === "chat") setUnreadChat(false);
  }, [activeTab]);

  const handleSendMessage = (msg: string) => {
    if (!msg.trim()) return;
    const chatData = {
      id: Date.now().toString(),
      user: user?.username || "Anonymous",
      text: msg.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    send(
      new TextEncoder().encode(
        JSON.stringify({ type: "chat", data: chatData }),
      ),
      { reliable: true },
    );
    setMessages((prev) => [...prev, { ...chatData, isMe: true }]);
  };

  const toggleScreenShare = async () => {
    try {
      await localParticipant.setScreenShareEnabled(
        !localParticipant.isScreenShareEnabled,
      );
    } catch (err) {
      toast.error("Failed to share screen");
    }
  };

  return (
    <div className="flex-1 flex flex-col relative bg-black overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      <div className="flex-1 relative overflow-hidden flex gap-0">
        <div className="flex-1 relative bg-gradient-to-br from-[#4F5B93] via-[#6B4E91] to-[#8B448F] flex items-center justify-center p-1 md:p-4">
          <RoomContent />
          <div className="absolute inset-0 pointer-events-none z-50">
            {reactions.map((r) => (
              <div
                key={r.id}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce-up"
              >
                <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white mb-2 border border-white/10">
                  {r.userName}
                </div>
                <span className="text-4xl">{r.emoji}</span>
              </div>
            ))}
          </div>
          <div className="absolute bottom-4 left-4 z-20">
            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] font-bold text-white flex items-center gap-2 border border-white/10">
              <span>{user?.username || "You"} (Local)</span>
            </div>
          </div>
        </div>

        {activeTab !== "none" && (
          <div className="w-full md:w-[360px] fixed md:relative inset-y-0 right-0 bg-[#1A1A1A] border-l border-white/5 flex flex-col overflow-hidden shadow-2xl z-[250] md:z-[150] h-[calc(100vh-72px)] md:h-auto">
            <div className="p-6 flex items-center justify-between border-b border-white/5 text-slate-200">
              <h3 className="text-lg font-bold capitalize flex items-center gap-3">
                {activeTab === "details" && <Info className="w-5 h-5" />}
                {activeTab === "participants" && <Users className="w-5 h-5" />}
                {activeTab === "chat" && <MessageSquare className="w-5 h-5" />}
                {activeTab}
              </h3>
              <button
                onClick={() => setActiveTab("none")}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "details" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      Meeting ID
                    </p>
                    <p className="text-sm font-medium text-slate-300 bg-white/5 p-4 rounded-xl border border-white/5 break-all">
                      {topicId}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      Joining Info
                    </p>
                    <p className="text-sm font-medium text-slate-300 bg-white/5 p-4 rounded-xl border border-white/5 truncate">
                      https://letslearn.edu/m/{topicId}
                    </p>
                  </div>
                </div>
              )}
              {activeTab === "participants" && <ParticipantsList />}
              {activeTab === "chat" && (
                <ChatBox
                  messages={messages}
                  onSendMessage={handleSendMessage}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="h-[72px] md:h-[100px] bg-black border-t border-white/5 px-3 md:px-6 flex items-center justify-between z-[200] relative">
        <div className="hidden md:flex items-center gap-4 text-slate-400 font-medium text-sm">
          <span>
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="opacity-40">|</span>
          <span className="truncate max-w-[150px]">{topicId}</span>
        </div>

        <div className="flex-1 md:absolute md:left-1/2 md:-translate-x-1/2 flex items-center justify-center gap-1.5 md:gap-3 py-1 relative">
          <MediaControls />
          <div className="w-px h-8 bg-white/10 mx-1 flex-shrink-0 hidden md:block"></div>
          <MeetButton
            active={localParticipant.isScreenShareEnabled}
            onClick={toggleScreenShare}
            icon={<MonitorUp className="w-4 h-4 md:w-5 md:h-5" />}
            label="Present"
            className="hidden md:flex"
          />
          <MeetButton
            icon={<CircleDot className="w-4 h-4 md:w-5 md:h-5" />}
            label="Record"
            className="hidden md:flex"
          />
          <MeetButton
            icon={<Layout className="w-4 h-4 md:w-5 md:h-5" />}
            label="Whiteboard"
            className="hidden md:flex"
          />
          <div className="relative group flex-shrink-0 hidden md:block">
            <MeetButton
              active={showEmojiPicker}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              icon={<Smile className="w-4 h-4 md:w-5 md:h-5" />}
              label="React"
            />
            {showEmojiPicker && (
              <div className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 bg-[#2D2D2D] p-3 rounded-2xl flex gap-3 shadow-2xl border border-white/10 animate-in slide-in-from-bottom-2 z-[300]">
                {["❤️", "👍", "😂", "🎉", "🔥", "👏"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSendReaction(emoji)}
                    className="text-2xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <MeetButton
            icon={<Hand className="w-4 h-4 md:w-5 md:h-5" />}
            label="Raise hand"
            className="hidden md:flex"
          />

          {/* More Options Button (Mobile Only) */}
          <div className="relative group flex-shrink-0 md:hidden">
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`w-10 h-9 flex items-center justify-center rounded-[18px] transition-all ${showMoreMenu ? "bg-blue-500 text-white" : "bg-[#3C4043] text-white"}`}
              >
                <MoreHorizontal className="w-5 h-5 text-white" />
              </button>
              <span className="hidden md:block text-[10px] text-slate-400 font-bold uppercase">
                More
              </span>
            </div>

            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-[290] bg-black/20 backdrop-blur-[1px]" onClick={() => setShowMoreMenu(false)} />
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[#1A1A1A]/95 backdrop-blur-md border border-white/10 rounded-[24px] p-4 w-[280px] shadow-2xl z-[300] animate-in fade-in zoom-in-95 duration-150">
                  <div className="grid grid-cols-3 gap-y-4 gap-x-2 justify-items-center">
                    {/* Screen Share */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => {
                          toggleScreenShare();
                          setShowMoreMenu(false);
                        }}
                        className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${localParticipant.isScreenShareEnabled ? "bg-blue-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                      >
                        <MonitorUp className="w-5 h-5" />
                      </button>
                      <span className="text-[10px] text-slate-300 font-medium">Present</span>
                    </div>

                    {/* Record */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          toast.info("Recording is not supported in this room yet");
                        }}
                        className="w-11 h-11 flex items-center justify-center rounded-full transition-all bg-white/10 text-white hover:bg-white/20"
                      >
                        <CircleDot className="w-5 h-5" />
                      </button>
                      <span className="text-[10px] text-slate-300 font-medium">Record</span>
                    </div>

                    {/* Whiteboard */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          toast.info("Whiteboard is coming soon!");
                        }}
                        className="w-11 h-11 flex items-center justify-center rounded-full transition-all bg-white/10 text-white hover:bg-white/20"
                      >
                        <Layout className="w-5 h-5" />
                      </button>
                      <span className="text-[10px] text-slate-300 font-medium">Whiteboard</span>
                    </div>

                    {/* React */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          setShowEmojiPicker(true);
                        }}
                        className="w-11 h-11 flex items-center justify-center rounded-full transition-all bg-white/10 text-white hover:bg-white/20"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                      <span className="text-[10px] text-slate-300 font-medium">React</span>
                    </div>

                    {/* Raise Hand */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          handleSendReaction("✋");
                        }}
                        className="w-11 h-11 flex items-center justify-center rounded-full transition-all bg-white/10 text-white hover:bg-white/20"
                      >
                        <Hand className="w-5 h-5" />
                      </button>
                      <span className="text-[10px] text-slate-300 font-medium">Raise Hand</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              onClick={handleLeave}
              className="w-10 h-9 md:w-[52px] md:h-[40px] bg-[#EA4335] hover:bg-[#D93025] flex items-center justify-center rounded-[18px] md:rounded-[20px] transition-all ml-2"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </button>
            <span className="hidden md:block text-[10px] text-slate-400 font-bold uppercase">
              Leave
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <TabButton
            active={activeTab === "details"}
            onClick={() =>
              setActiveTab(activeTab === "details" ? "none" : "details")
            }
            icon={<Info className="w-4 h-4 md:w-5 md:h-5" />}
          />
          <TabButton
            active={activeTab === "participants"}
            onClick={() =>
              setActiveTab(
                activeTab === "participants" ? "none" : "participants",
              )
            }
            icon={<Users className="w-4 h-4 md:w-5 md:h-5" />}
            badge={<ParticipantCount />}
          />
          <TabButton
            active={activeTab === "chat"}
            onClick={() => setActiveTab(activeTab === "chat" ? "none" : "chat")}
            icon={<MessageSquare className="w-4 h-4 md:w-5 md:h-5" />}
            isUnread={unreadChat}
          />
        </div>
      </div>
    </div>
  );
}

function MediaControls() {
  const { isMicrophoneEnabled, isCameraEnabled, localParticipant } =
    useLocalParticipant();
  return (
    <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() =>
            localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
          }
          className={`w-10 h-9 md:w-[52px] md:h-[40px] flex items-center justify-center rounded-[18px] md:rounded-[20px] transition-all ${isMicrophoneEnabled ? "bg-[#3C4043] text-white" : "bg-[#EA4335] text-white"}`}
        >
          <Mic className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <span className="hidden md:block text-[10px] text-slate-400 font-bold uppercase">
          {isMicrophoneEnabled ? "Mute" : "Unmute"}
        </span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
          className={`w-10 h-9 md:w-[52px] md:h-[40px] flex items-center justify-center rounded-[18px] md:rounded-[20px] transition-all ${isCameraEnabled ? "bg-[#3C4043] text-white" : "bg-[#EA4335] text-white"}`}
        >
          <VideoIcon className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <span className="hidden md:block text-[10px] text-slate-400 font-bold uppercase">
          {isCameraEnabled ? "Stop video" : "Start video"}
        </span>
      </div>
    </div>
  );
}

function MeetButton({ icon, label, onClick, active, className }: any) {
  return (
    <div className={`flex flex-col items-center gap-1 flex-shrink-0 ${className || ""}`}>
      <button
        onClick={onClick}
        className={`w-10 h-9 md:w-[52px] md:h-[40px] flex items-center justify-center rounded-[18px] md:rounded-[20px] transition-all ${active ? "bg-blue-500 text-white" : "bg-[#3C4043] text-white"}`}
      >
        {icon}
      </button>
      <span className="hidden md:block text-[10px] text-slate-400 font-bold uppercase">
        {label}
      </span>
    </div>
  );
}

function TabButton({ icon, onClick, active, badge, isUnread }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-all relative ${active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5"}`}
    >
      {icon}
      {badge && (
        <span className="absolute top-1 right-1 md:top-2 md:right-2 min-w-[14px] md:min-w-[16px] h-3.5 md:h-4 bg-blue-500 text-[9px] md:text-[10px] font-black text-white px-1 rounded-full border border-black flex items-center justify-center">
          {badge}
        </span>
      )}
      {isUnread && (
        <span className="absolute top-2 right-2 md:top-3 md:right-3 w-1.5 md:w-2 h-1.5 md:h-2 bg-[#EA4335] rounded-full border border-black animate-pulse"></span>
      )}
    </button>
  );
}

function RoomContent() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  return (
    <div className="grid h-full w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 p-2 md:p-6 overflow-y-auto no-scrollbar">
      {tracks.length > 0 ? (
        tracks.map((track) => (
          <div
            key={track.participant.identity + track.source}
            className="relative group rounded-[32px] overflow-hidden bg-slate-800 border border-white/5 shadow-lg aspect-video"
          >
            <div className="relative w-full h-full">
              {isTrackReference(track) ? (
                <VideoTrack
                  trackRef={track}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-3xl font-black text-white border-[6px] border-white/10 shadow-2xl">
                    {track.participant.name?.charAt(0) ||
                      track.participant.identity.charAt(0)}
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black text-white border border-white/5">
                  {track.participant.name || track.participant.identity}
                </div>
                <div className="w-8 h-8 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-xl border border-white/5">
                  {track.participant.isMicrophoneEnabled ? (
                    <Mic className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5 text-red-500" />
                  )}
                </div>
              </div>
              {!track.participant.isCameraEnabled &&
                track.source === Track.Source.Camera && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 z-0">
                    <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-3xl font-black text-white border-[6px] border-white/10 shadow-2xl">
                      {track.participant.name?.charAt(0) ||
                        track.participant.identity.charAt(0)}
                    </div>
                  </div>
                )}
            </div>
          </div>
        ))
      ) : (
        <div className="col-span-full flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p className="text-slate-400 font-bold">
            Waiting for participants...
          </p>
        </div>
      )}
    </div>
  );
}

function ParticipantCount() {
  const participants = useParticipants();
  return <>{participants.length.toString()}</>;
}

function ParticipantsList() {
  const participants = useParticipants();
  return (
    <div className="space-y-4 text-slate-200">
      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">
        {participants.length} PEOPLE IN CALL
      </p>
      {participants.map((p) => (
        <div
          key={p.identity}
          className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white">
              {p.name?.charAt(0) || p.identity.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold">
                {p.name || p.identity}
              </span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                {p.isLocal ? "You (Host)" : "Participant"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 opacity-60">
            {p.isMicrophoneEnabled ? (
              <Mic className="w-4 h-4 text-green-400" />
            ) : (
              <MicOff className="w-4 h-4 text-red-400" />
            )}
            {p.isCameraEnabled ? (
              <VideoIcon className="w-4 h-4 text-green-400" />
            ) : (
              <VideoOff className="w-4 h-4 text-red-400" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatBox({
  messages,
  onSendMessage,
}: {
  messages: any[];
  onSendMessage: (msg: string) => void;
}) {
  const [msg, setMsg] = useState("");
  const sendMessage = () => {
    if (!msg.trim()) return;
    onSendMessage(msg);
    setMsg("");
  };
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
        {messages.length > 0 ? (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.isMe ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-black text-slate-500 uppercase">
                  {m.user}
                </span>
                <span className="text-[9px] text-slate-600 font-bold">
                  {m.time}
                </span>
              </div>
              <div
                className={`p-4 rounded-2xl max-w-[85%] text-sm font-medium ${m.isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white/10 text-slate-200 rounded-tl-none border border-white/5"}`}
              >
                {m.text}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
            <Send className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold">No messages yet</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-2 pr-4">
        <input
          type="text"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Send a message..."
          className="flex-1 bg-transparent border-none outline-none text-sm font-medium py-3 px-4"
        />
        <button
          onClick={sendMessage}
          className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-xl"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
