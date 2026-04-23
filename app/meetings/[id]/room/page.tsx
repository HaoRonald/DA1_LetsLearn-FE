'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer,
  ControlBar,
  ParticipantTile,
  LayoutContextProvider,
  useLocalParticipant,
  useParticipants,
  useTracks,
  useRoomContext,
  TrackReference,
  ParticipantLoop,
  ParticipantName,
  TrackMutedIndicator,
  VideoTrack,
  useDataChannel,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { topicApi } from '@/services/topicService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Loader2, ArrowLeft, Mic, MicOff, Video as VideoIcon, 
  VideoOff, MonitorUp, MoreVertical, X, Users, MessageSquare, 
  Info, Hand, Smile, ShieldAlert, LogOut, Settings, CircleDot,
  LayoutGrid, Share2, PenTool
} from 'lucide-react';
import { toast } from 'sonner';

export default function MeetingRoomPage() {
  const { id: topicId } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const router = useRouter();
  const { user } = useAuth();

  const [token, setToken] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');
  const [wsUrl, setWsUrl] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI States
  const [activeTab, setActiveTab] = useState<'none' | 'details' | 'participants' | 'chat'>('none');

  useEffect(() => {
    if (!courseId || !topicId) {
      setError('Missing course or topic information');
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
      setRole(data.role);
    } catch (err: any) {
      console.error('Failed to get meeting token:', err);
      setError(err.response?.data?.error || 'Failed to connect to meeting server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = useCallback(async () => {
    // In a real scenario, we would save history here for teachers
    router.push(`/meetings/${topicId}?courseId=${courseId}`);
  }, [courseId, topicId, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F172A] text-white">
        <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <VideoIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-500" />
        </div>
        <p className="mt-6 text-xl font-bold tracking-tight animate-pulse">Establishing secure connection...</p>
        <p className="text-slate-400 text-sm mt-2">Joining room: {topicId.substring(0, 8)}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F172A] text-white p-6 text-center">
        <div className="w-24 h-24 bg-red-500/10 rounded-[32px] flex items-center justify-center mb-8 border border-red-500/20">
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-black mb-4">Connection Blocked</h1>
        <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 max-w-md mb-10">
            <p className="text-slate-300 leading-relaxed font-medium">{error}</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-3 bg-white text-black hover:bg-slate-200 px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-white/5"
        >
          <ArrowLeft className="w-5 h-5" />
          Return to Class
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#0F172A] overflow-hidden flex flex-col text-white font-sans selection:bg-blue-500/30">
      <LiveKitRoom
        video={false}
        audio={false}
        token={token}
        serverUrl={wsUrl}
        onDisconnected={handleLeave}
        connect={true}
        className="flex-1 flex flex-col relative"
      >
        {/* Modern Header / Info Bar */}
        <div className="absolute top-6 left-6 z-[100] flex items-center gap-4">
            <button 
                onClick={handleLeave}
                className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-red-500 rounded-2xl transition-all backdrop-blur-xl border border-white/10 group"
            >
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-2xl hidden md:flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-0.5">Live Session</span>
                <span className="text-sm font-bold text-slate-200 truncate max-w-[200px]">{roomName}</span>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex relative overflow-hidden p-6 gap-6 mt-16 mb-24">
           <div className="flex-1 relative bg-slate-900/50 rounded-[40px] overflow-hidden border border-white/5 shadow-2xl">
              <RoomContent />
           </div>

           {/* Custom Right Sidebar */}
           {activeTab !== 'none' && (
             <div className="w-[380px] bg-white/5 backdrop-blur-2xl rounded-[40px] border border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-500 shadow-2xl">
                <div className="p-8 flex items-center justify-between border-b border-white/5">
                    <h3 className="text-xl font-black capitalize flex items-center gap-3">
                        {activeTab === 'details' && <><Info className="w-5 h-5 text-blue-400" /> Details</>}
                        {activeTab === 'participants' && <><Users className="w-5 h-5 text-green-400" /> Participants</>}
                        {activeTab === 'chat' && <><MessageSquare className="w-5 h-5 text-orange-400" /> Chat</>}
                    </h3>
                    <button 
                        onClick={() => setActiveTab('none')}
                        className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {activeTab === 'details' && (
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Room Address</p>
                                <p className="text-sm font-bold text-slate-300 break-all bg-white/5 p-4 rounded-2xl border border-white/5">{wsUrl}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Meeting ID</p>
                                <p className="text-sm font-bold text-slate-300 bg-white/5 p-4 rounded-2xl border border-white/5">{topicId}</p>
                            </div>
                            <div className="p-6 bg-blue-500/10 rounded-3xl border border-blue-500/20">
                                <p className="text-xs text-blue-400 font-bold mb-2">SECURITY INFO</p>
                                <p className="text-[13px] text-slate-300 leading-relaxed">
                                    All participants are encrypted. Only enrolled students and teachers can join this session.
                                </p>
                            </div>
                        </div>
                    )}
                    {activeTab === 'participants' && <ParticipantsList />}
                    {activeTab === 'chat' && <ChatBox />}
                </div>
             </div>
           )}
        </div>

        {/* Custom Glassmorphism Control Bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-fit">
            <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 px-8 py-5 rounded-[32px] flex items-center gap-6 shadow-2xl">
                <MediaControls />
                
                <div className="h-8 w-px bg-white/10 mx-2"></div>
                
                <div className="flex items-center gap-3">
                    <ControlButton 
                        icon={<MonitorUp className="w-5 h-5" />} 
                        label="Share" 
                        color="blue"
                    />
                    <ControlButton 
                        icon={<PenTool className="w-5 h-5" />} 
                        label="Board" 
                        color="indigo"
                    />
                    <ControlButton 
                        icon={<Smile className="w-5 h-5" />} 
                        label="React" 
                        color="orange"
                    />
                </div>

                <div className="h-8 w-px bg-white/10 mx-2"></div>

                <div className="flex items-center gap-3">
                    <ControlButton 
                        active={activeTab === 'details'}
                        onClick={() => setActiveTab(activeTab === 'details' ? 'none' : 'details')}
                        icon={<Info className="w-5 h-5" />} 
                    />
                    <ControlButton 
                         active={activeTab === 'participants'}
                         onClick={() => setActiveTab(activeTab === 'participants' ? 'none' : 'participants')}
                         icon={<Users className="w-5 h-5" />} 
                         badge="1"
                    />
                    <ControlButton 
                         active={activeTab === 'chat'}
                         onClick={() => setActiveTab(activeTab === 'chat' ? 'none' : 'chat')}
                         icon={<MessageSquare className="w-5 h-5" />} 
                    />
                </div>

                <button 
                    onClick={handleLeave}
                    className="ml-4 flex items-center gap-3 bg-red-500 hover:bg-red-600 px-8 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-red-500/20 group"
                >
                    <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    Leave
                </button>
            </div>
        </div>

        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function RoomContent() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  return (
    <div className="grid h-full w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {tracks.length > 0 ? (
        tracks.map((track) => (
          <div key={track.participant.identity + track.source} className="relative group rounded-[32px] overflow-hidden bg-slate-800 border border-white/5 shadow-lg aspect-video">
             {/* Wrap in TrackRefContext to fix the No TrackRef error */}
             <div className="relative w-full h-full">
                <VideoTrack trackRef={track} className="w-full h-full object-cover" />
                
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border border-white/5">
                        <span>{track.participant.name || track.participant.identity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Use custom logic instead of components that might fail without context */}
                        <div className="w-8 h-8 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-xl border border-white/5">
                            {track.participant.isMicrophoneEnabled ? <Mic className="w-3.5 h-3.5 text-blue-400" /> : <MicOff className="w-3.5 h-3.5 text-red-500" />}
                        </div>
                    </div>
                </div>

                {/* If no video track, show large avatar/initial */}
                {!track.participant.isCameraEnabled && track.source === Track.Source.Camera && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 z-0">
                        <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-3xl font-black border-[6px] border-white/10 shadow-2xl">
                            {track.participant.name?.charAt(0) || track.participant.identity.charAt(0)}
                        </div>
                    </div>
                )}
             </div>
          </div>
        ))
      ) : (
        <div className="col-span-full flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="text-slate-400 font-bold">Waiting for participants...</p>
        </div>
      )}
    </div>
  );
}

function MediaControls() {
  const { localParticipant } = useLocalParticipant();
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);

  const toggleMic = async () => {
    const newState = !isMicOn;
    await localParticipant.setMicrophoneEnabled(newState);
    setIsMicOn(newState);
  };

  const toggleCam = async () => {
    const newState = !isCamOn;
    await localParticipant.setCameraEnabled(newState);
    setIsCamOn(newState);
  };

  return (
    <div className="flex items-center gap-3">
        <button 
            onClick={toggleMic}
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl transition-all border ${isMicOn ? 'bg-white/10 border-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 border-red-500/40 text-red-500 hover:bg-red-500/30'}`}
        >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">{isMicOn ? 'On' : 'Muted'}</span>
        </button>
        <button 
             onClick={toggleCam}
             className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl transition-all border ${isCamOn ? 'bg-white/10 border-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 border-red-500/40 text-red-500 hover:bg-red-500/30'}`}
        >
            {isCamOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">{isCamOn ? 'On' : 'Off'}</span>
        </button>
    </div>
  );
}

function ControlButton({ icon, label, color = 'gray', active = false, onClick, badge }: any) {
    const colors: any = {
        blue: 'hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30',
        orange: 'hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/30',
        indigo: 'hover:bg-indigo-500/20 hover:text-indigo-400 hover:border-indigo-500/30',
        gray: 'hover:bg-white/10 hover:text-white hover:border-white/20'
    };

    return (
        <button 
            onClick={onClick}
            className={`relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all border ${active ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/20' : 'bg-white/5 border-white/5 text-slate-400'} ${colors[color]}`}
        >
            {icon}
            {badge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#0F172A]">
                    {badge}
                </span>
            )}
            {label && <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">{label}</span>}
        </button>
    );
}

function ParticipantsList() {
    const participants = useParticipants();
    return (
        <div className="space-y-4">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">{participants.length} PEOPLE IN CALL</p>
            {participants.map((p) => (
                <div key={p.identity} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold shadow-lg">
                            {p.name?.charAt(0) || p.identity.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-slate-200">{p.name || p.identity}</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{p.isLocal ? 'You (Host)' : 'Participant'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-60">
                        {p.isMicrophoneEnabled ? <Mic className="w-4 h-4 text-green-400" /> : <MicOff className="w-4 h-4 text-red-400" />}
                        {p.isCameraEnabled ? <VideoIcon className="w-4 h-4 text-green-400" /> : <VideoOff className="w-4 h-4 text-red-400" />}
                    </div>
                </div>
            ))}
        </div>
    );
}

function ChatBox() {
    const [msg, setMsg] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const { user } = useAuth();

    // Data Channel for real-time chat
    const { send } = useDataChannel('chat', (data) => {
        const payload = JSON.parse(new TextDecoder().decode(data.payload));
        setMessages(prev => [...prev, payload]);
    });

    const sendMessage = () => {
        if (!msg.trim()) return;
        const payload = {
            id: Date.now().toString(),
            user: user?.username || 'Anonymous',
            text: msg.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const encoder = new TextEncoder();
        send(encoder.encode(JSON.stringify(payload)), { reliable: true });
        setMessages(prev => [...prev, { ...payload, isMe: true }]);
        setMsg('');
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {messages.length > 0 ? (
                    messages.map((m) => (
                        <div key={m.id} className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[11px] font-black text-slate-500 uppercase">{m.user}</span>
                                <span className="text-[9px] text-slate-600 font-bold">{m.time}</span>
                            </div>
                            <div className={`p-4 rounded-2xl max-w-[85%] text-sm font-medium ${m.isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5'}`}>
                                {m.text}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                            <MessageSquare className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-500 font-bold">No messages yet</p>
                        <p className="text-slate-600 text-xs mt-1">Be the first to say hi!</p>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-2 pr-4 focus-within:bg-white/10 focus-within:border-white/20 transition-all">
                <input 
                    type="text" 
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Send a message..." 
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium py-3 px-4 placeholder:text-slate-600"
                />
                <button 
                    onClick={sendMessage}
                    className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Share2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
