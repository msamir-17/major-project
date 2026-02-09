"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Heart, AlertCircle, Phone, Mic, MicOff, Volume2, VolumeX, Loader2, MapPin } from "lucide-react"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  type?: "emergency" | "normal"
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm your SkillBridge AI assistant. I'm here to help you with skill development, mentorship, learning paths, and connecting with the right opportunities. How can I assist you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [userId] = useState(() => Math.floor(Math.random() * 1000000000))
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const currentMessageIdRef = useRef<string | null>(null)
  
  // Audio streaming refs - exactly like Google ADK
  const audioPlayerNodeRef = useRef<AudioWorkletNode | null>(null)
  const audioPlayerContextRef = useRef<AudioContext | null>(null)
  const audioRecorderNodeRef = useRef<AudioWorkletNode | null>(null)
  const audioRecorderContextRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioBufferRef = useRef<Uint8Array[]>([])
  const bufferTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Utility functions - exactly from Google ADK
  const base64ToArray = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = ""
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  const convertFloat32ToPCM = (inputData: Float32Array): ArrayBuffer => {
    const pcm16 = new Int16Array(inputData.length)
    for (let i = 0; i < inputData.length; i++) {
      pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 0x7fff))
    }
    return pcm16.buffer
  }

  // Audio worklet functions - exactly from Google ADK
  const startAudioPlayerWorklet = async (): Promise<[AudioWorkletNode, AudioContext]> => {
    const audioContext = new AudioContext({ sampleRate: 24000 })
    await audioContext.audioWorklet.addModule("/pcm-player-processor.js")
    const audioPlayerNode = new AudioWorkletNode(audioContext, "pcm-player-processor")
    audioPlayerNode.connect(audioContext.destination)
    return [audioPlayerNode, audioContext]
  }

  const startAudioRecorderWorklet = async (
    audioRecorderHandler: (pcmData: ArrayBuffer) => void
  ): Promise<[AudioWorkletNode, AudioContext, MediaStream]> => {
    const audioRecorderContext = new AudioContext({ sampleRate: 16000 })
    await audioRecorderContext.audioWorklet.addModule("/pcm-recorder-processor.js")

    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: { 
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
    })
    const source = audioRecorderContext.createMediaStreamSource(micStream)
    const audioRecorderNode = new AudioWorkletNode(audioRecorderContext, "pcm-recorder-processor")

    source.connect(audioRecorderNode)
    audioRecorderNode.port.onmessage = (event) => {
      const pcmData = convertFloat32ToPCM(event.data)
      audioRecorderHandler(pcmData)
    }

    return [audioRecorderNode, audioRecorderContext, micStream]
  }

  // Audio recorder handler - with voice activity detection
  const audioRecorderHandler = (pcmData: ArrayBuffer) => {
    // Voice activity detection to reduce noise
    const samples = new Int16Array(pcmData)
    const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length)
    
    // Only buffer audio if there's actual voice activity
    if (rms > 100) { // Threshold for voice activity
      audioBufferRef.current.push(new Uint8Array(pcmData))

      if (!bufferTimerRef.current) {
        bufferTimerRef.current = setInterval(sendBufferedAudio, 200)
      }
    }
  }

  // Send buffered audio - exactly from Google ADK
  const sendBufferedAudio = async () => {
    if (audioBufferRef.current.length === 0) return

    let totalLength = 0
    for (const chunk of audioBufferRef.current) {
      totalLength += chunk.length
    }

    const combinedBuffer = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of audioBufferRef.current) {
      combinedBuffer.set(chunk, offset)
      offset += chunk.length
    }

    if (isConnected && combinedBuffer.byteLength > 0) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/send/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mime_type: "audio/pcm",
            data: arrayBufferToBase64(combinedBuffer.buffer),
          })
        })

        if (response.ok) {
          console.log("[CLIENT TO AGENT] sent audio:", combinedBuffer.byteLength, "bytes")
        } else {
          console.error('Failed to send audio:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Error sending audio:', error)
      }
    }

    audioBufferRef.current = []
  }

  // Start voice conversation - like Google ADK
  const startVoiceConversation = async () => {
    try {
      console.log("Starting voice conversation...")
      
      // Start audio output worklet
      const [playerNode, playerContext] = await startAudioPlayerWorklet()
      audioPlayerNodeRef.current = playerNode
      audioPlayerContextRef.current = playerContext
      console.log("Audio player worklet started")

      // Start audio input worklet
      const [recorderNode, recorderContext, micStream] = await startAudioRecorderWorklet(audioRecorderHandler)
      audioRecorderNodeRef.current = recorderNode
      audioRecorderContextRef.current = recorderContext
      micStreamRef.current = micStream
      console.log("Audio recorder worklet started")

      setIsVoiceEnabled(true)
      setIsRecording(true)

      // Reconnect EventSource with audio mode
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      await connectToServer(true)

      const voiceStartMessage: Message = {
        id: Date.now().toString(),
        content: "🎤 Voice conversation started - Speak naturally, AI is listening...",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, voiceStartMessage])
      
    } catch (error) {
      console.error("Error starting voice conversation:", error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "❌ Failed to start voice conversation. Please check microphone permissions and try again.",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  // Stop voice conversation
  const stopVoiceConversation = async () => {
    console.log("Stopping voice conversation...")
    
    setIsRecording(false)
    setIsVoiceEnabled(false)

    // Clear audio buffer timer
    if (bufferTimerRef.current) {
      clearInterval(bufferTimerRef.current)
      bufferTimerRef.current = null
    }

    // Send any remaining buffered audio
    if (audioBufferRef.current.length > 0) {
      await sendBufferedAudio()
    }

    // Stop microphone stream
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop())
      micStreamRef.current = null
    }

    // Close audio contexts
    if (audioPlayerContextRef.current) {
      await audioPlayerContextRef.current.close()
      audioPlayerContextRef.current = null
    }

    if (audioRecorderContextRef.current) {
      await audioRecorderContextRef.current.close()
      audioRecorderContextRef.current = null
    }

    // Clear refs
    audioPlayerNodeRef.current = null
    audioRecorderNodeRef.current = null

    // Reconnect EventSource without audio mode
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    await connectToServer(false)

    const voiceStopMessage: Message = {
      id: Date.now().toString(),
      content: "🔴 Voice conversation stopped - Switched to text mode",
      sender: "ai",
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, voiceStopMessage])
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Initial connection on mount
  useEffect(() => {
    connectToServer(false)
    
    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (bufferTimerRef.current) {
        clearInterval(bufferTimerRef.current)
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioPlayerContextRef.current) {
        audioPlayerContextRef.current.close()
      }
      if (audioRecorderContextRef.current) {
        audioRecorderContextRef.current.close()
      }
    }
  }, [])

  // Connect to server using EventSource - exactly like Google ADK
  const connectToServer = async (audioMode = false) => {
    try {
      console.log(`Connecting to server in ${audioMode ? 'audio' : 'text'} mode...`)
      
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      // Check server health first
      try {
        const healthResponse = await fetch('http://127.0.0.1:8000/health')
        if (!healthResponse.ok) {
          throw new Error('Server not available')
        }
      } catch (error) {
        throw new Error('Server not reachable. Make sure your Python server is running on http://127.0.0.1:8000')
      }

      // Create EventSource connection - exactly like Google ADK
      const sse_url = `http://127.0.0.1:8000/events/${userId}?is_audio=${audioMode}`
      console.log("Connecting to:", sse_url)
      const eventSource = new EventSource(sse_url)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setIsConnected(true)
        console.log("Connected to SkillBridge AI")
        
        if (!audioMode) {
          const connectionMessage: Message = {
            id: Date.now().toString(),
            content: `✅ Connected to SkillBridge AI ${audioMode ? '(Voice Mode)' : '(Text Mode)'}`,
            sender: "ai",
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, connectionMessage])
        }
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log("Received data:", data)
          
          // Handle turn completion
          if (data.turn_complete === true) {
            setIsTyping(false)
            currentMessageIdRef.current = null
            console.log("Turn completed")
            return
          }

          // Handle interruption
          if (data.interrupted === true) {
            setIsTyping(false)
            if (audioPlayerNodeRef.current) {
              audioPlayerNodeRef.current.port.postMessage({ command: "endOfAudio" })
            }
            console.log("Turn interrupted")
            return
          }

          // Handle audio response
          if (data.mime_type === "audio/pcm" && data.data && audioPlayerNodeRef.current && !isMuted) {
            console.log("Received audio data:", data.data.length, "characters")
            const audioBuffer = base64ToArray(data.data)
            audioPlayerNodeRef.current.port.postMessage(audioBuffer)
          }

          // Handle text response
          if (data.mime_type === "text/plain" && data.data) {
            setIsTyping(true)
            
            if (currentMessageIdRef.current === null) {
              currentMessageIdRef.current = Math.random().toString(36).substring(7)
              const newMessage: Message = {
                id: currentMessageIdRef.current,
                content: data.data,
                sender: "ai",
                timestamp: new Date(),
              }
              setMessages((prev) => [...prev, newMessage])
            } else {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === currentMessageIdRef.current 
                    ? { ...msg, content: msg.content + data.data } 
                    : msg
                )
              )
            }
          }
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error)
        setIsConnected(false)
        
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: "❌ Connection lost. Please check server and try reconnecting.",
          sender: "ai",
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, errorMessage])
      }

    } catch (error) {
      console.error('Connection failed:', error)
      setIsConnected(false)
      
      const errorMsg =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `❌ Failed to connect to server. ${errorMsg}`,
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const disconnectFromServer = async () => {
    if (isVoiceEnabled) {
      await stopVoiceConversation()
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
    
    const disconnectMessage: Message = {
      id: Date.now().toString(),
      content: "🔴 Disconnected from SkillBridge AI",
      sender: "ai",
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, disconnectMessage])
  }

  // Send text message - exactly like Google ADK sendMessage function
  const sendMessage = async () => {
    if (!inputValue.trim() || !isConnected) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      const send_url = `http://127.0.0.1:8000/send/${userId}`
      const response = await fetch(send_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mime_type: "text/plain",
          data: inputValue,
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setInputValue("")
      console.log("Text message sent successfully")
      
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "❌ Failed to send message. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const toggleMute = () => {
    if (audioPlayerNodeRef.current && audioPlayerContextRef.current) {
      if (isMuted) {
        audioPlayerNodeRef.current.connect(audioPlayerContextRef.current.destination)
      } else {
        audioPlayerNodeRef.current.disconnect()
      }
      setIsMuted(!isMuted)
      
      const muteMessage: Message = {
        id: Date.now().toString(),
        content: `🔊 Audio ${isMuted ? 'unmuted' : 'muted'}`,
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, muteMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Send location data
  const sendLocation = async () => {
    if (!isConnected) return
    
    if (!navigator.geolocation) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        content: "❌ Geolocation is not supported by your browser.",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMsg])
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const long = position.coords.longitude
        
        try {
          const response = await fetch(`http://127.0.0.1:8000/send/${userId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mime_type: "text/plain",
              data: `My current location: Latitude ${lat}, Longitude ${long}`,
            })
          })

          if (response.ok) {
            const locationMsg: Message = {
              id: Date.now().toString(),
              content: `📍 Location shared: ${lat.toFixed(6)}, ${long.toFixed(6)}`,
              sender: "user",
              timestamp: new Date(),
            }
            setMessages(prev => [...prev, locationMsg])
          }
        } catch (error) {
          console.error('Error sending location:', error)
        }
      },
      (error) => {
        const errorMsg: Message = {
          id: Date.now().toString(),
          content: "❌ Unable to retrieve your location. Please check permissions.",
          sender: "ai",
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, errorMsg])
      }
    )
  }

  const quickActions = [
    { label: "Find Learning Path", action: "I want to create a learning path for web development", icon: Heart },
    { label: "Connect with Mentor", action: "Help me find a mentor for data science", icon: AlertCircle },
    { label: "Skill Assessment", action: "I want to assess my programming skills", icon: Phone },
    { label: "Career Guidance", action: "What career opportunities are available in AI/ML?", icon: Bot },
  ]

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Chat Interface */}
            <div className="lg:col-span-3">
              <Card className="h-[calc(100vh-12rem)] shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-accent/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-primary/10 rounded-full ring-2 ring-primary/20">
                        <Bot className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="font-serif text-xl">SkillBridge AI Assistant</CardTitle>
                        <div className="flex items-center space-x-3 mt-1">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-destructive"}`}
                            />
                            <span className="text-sm text-muted-foreground font-medium">
                              {isConnected ? "Connected" : "Disconnected"}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">ID: {userId}</span>
                          {isVoiceEnabled && (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                              <span className="text-sm text-green-600 font-medium">Voice Active</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!isVoiceEnabled ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={startVoiceConversation}
                          disabled={!isConnected}
                          className="hover:bg-primary/10 bg-transparent"
                        >
                          <Mic className="h-4 w-4 mr-2" />
                          Start Voice
                        </Button>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleMute}
                            className="hover:bg-muted bg-transparent"
                          >
                            {isMuted ? (
                              <VolumeX className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Volume2 className="h-4 w-4 text-primary" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={stopVoiceConversation}
                            className="hover:bg-destructive/10 bg-red-50 border-red-300"
                          >
                            <MicOff className="h-4 w-4 mr-2" />
                            Stop Voice
                          </Button>
                        </div>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-accent/10 border-accent/30 bg-transparent"
                        onClick={sendLocation}
                        disabled={!isConnected}
                      >
                        <MapPin className="h-4 w-4 mr-2 text-accent" />
                        Share Location
                      </Button>

                      {isConnected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={disconnectFromServer}
                          className="hover:bg-destructive/10 bg-transparent"
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => connectToServer(false)}
                          className="hover:bg-primary/10 bg-transparent"
                        >
                          <Bot className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 flex flex-col h-full">
                  <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
                    <div className="space-y-6">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`flex items-start space-x-3 max-w-[85%] ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                          >
                            <div
                              className={`p-2.5 rounded-full shadow-sm ${
                                message.sender === "user"
                                  ? "bg-primary/10 ring-1 ring-primary/20"
                                  : "bg-muted ring-1 ring-border"
                              }`}
                            >
                              {message.sender === "user" ? (
                                <User className="h-4 w-4 text-primary" />
                              ) : (
                                <Bot className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div
                              className={`p-4 rounded-2xl shadow-sm ${
                                message.sender === "user"
                                  ? "bg-primary text-primary-foreground rounded-tr-md"
                                  : "bg-muted/50 border border-border rounded-tl-md"
                              }`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                              <p className="text-xs opacity-70 mt-2 font-medium">
                                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="flex items-start space-x-3 max-w-[85%]">
                            <div className="p-2.5 rounded-full bg-muted ring-1 ring-border">
                              <Bot className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="bg-muted/50 border border-border p-4 rounded-2xl rounded-tl-md">
                              <div className="flex items-center space-x-2">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                                  <div
                                    className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.1s" }}
                                  />
                                  <div
                                    className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.2s" }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">AI is thinking...</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="border-t bg-muted/20 p-6">
                    {isVoiceEnabled && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-sm font-medium text-green-700">
                            Voice conversation active - Speak naturally or type below...
                          </span>
                          <Mic className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <Input
                        placeholder={
                          isVoiceEnabled
                            ? "Voice active - You can still type here..."
                            : isConnected
                            ? "Ask about skills, learning paths, mentorship, career guidance..."
                            : "Connect to start chatting..."
                        }
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 bg-background border-border focus:ring-2 focus:ring-primary/20"
                        disabled={!isConnected}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!inputValue.trim() || !isConnected}
                        className="bg-primary hover:bg-primary/90 shadow-sm"
                        size="default"
                      >
                        {!isConnected ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="font-serif text-lg flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickActions.map((action, index) => {
                    const IconComponent = action.icon
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left h-auto p-4 bg-background hover:bg-muted/50 border-border"
                        onClick={() => setInputValue(action.action)}
                      >
                        <IconComponent className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                        <span className="text-sm">{action.label}</span>
                      </Button>
                    )
                  })}
                </CardContent>
              </Card>

              {/* AI Features */}
              <Card className="shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="font-serif text-lg flex items-center">
                    <Bot className="h-5 w-5 mr-2 text-primary" />
                    AI Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-primary/5">
                    <Heart className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">Skill Development Paths</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-accent/5">
                    <AlertCircle className="h-4 w-4 text-accent flex-shrink-0" />
                    <span className="text-sm font-medium">Mentor Matching System</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-primary/5">
                    <Bot className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">Career Guidance AI</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                    <Send className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium">Opportunity Recommendations</span>
                  </div>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card className="shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="font-serif text-lg">System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-background">
                    <span className="text-sm font-medium">AI Assistant</span>
                    <Badge variant={isConnected ? "default" : "destructive"} className="font-medium">
                      {isConnected ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-background">
                    <span className="text-sm font-medium">Voice Mode</span>
                    <Badge variant={isVoiceEnabled ? "default" : "secondary"} className="font-medium">
                      {isVoiceEnabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-background">
                    <span className="text-sm font-medium">Audio Streaming</span>
                    <Badge variant={isRecording ? "default" : "secondary"} className="font-medium">
                      {isRecording ? "Listening" : "Stopped"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-background">
                    <span className="text-sm font-medium">Learning Engine</span>
                    <Badge variant="default" className="font-medium">
                      Ready
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}