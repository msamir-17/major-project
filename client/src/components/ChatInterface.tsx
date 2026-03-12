"use client";

import React, { useState, useEffect , useRef  } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

// This is a "prop" - it's how we'll tell the chat window WHO we are talking to.

interface ChatInterfaceProps {
  recipientId: number;
  recipientName: string;
}

interface Message {
  id: number;
  sender_id: number;
  content: string;
  timestamp: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  recipientId,
  recipientName,
}) => {
  const { user } = useAuth();
  const { language, t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]); // This is our filing tray for messages
  const [isLoading, setIsLoading] = useState(true); // A flag to know when we are loading history
  const [newMessage, setNewMessage] = useState(''); // Holds the text in the input box
  const ws = useRef<WebSocket | null>(null); // Holds our live WebSocket "phone line"
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = user?.id;

  const [translatedByMessageId, setTranslatedByMessageId] = useState<Record<number, string>>({});
  const [isTranslatingByMessageId, setIsTranslatingByMessageId] = useState<Record<number, boolean>>({});
  const [showOriginalByMessageId, setShowOriginalByMessageId] = useState<Record<number, boolean>>({});
useEffect(() => {
      // 1. Fetch the history (you already wrote this part)
      const fetchHistory = async () => {
        setIsLoading(true);
        try {
          const token = localStorage.getItem('auth_token');
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

          const response = await fetch(`${API_URL}/api/messages/${recipientId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            setMessages([]);
            return;
          }

          const data = await response.json();
          setMessages(Array.isArray(data) ? data : []);
        } finally {
          setIsLoading(false);
        }
      };
      fetchHistory();

      // 2. Open the WebSocket "phone line"
      const token = localStorage.getItem('auth_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const wsUrl = API_URL.replace(/^http/, 'ws');
      ws.current = new WebSocket(`${wsUrl}/api/ws/${token}`);

      ws.current.onopen = () => {
        console.log("WebSocket connected!");
      };

      ws.current.onmessage = (event) => {
        // A new message has arrived from the server!
        const receivedMessage = JSON.parse(event.data);
        setMessages((prevMessages) => {
          if (receivedMessage?.id && prevMessages.some((m) => m.id === receivedMessage.id)) {
            return prevMessages;
          }
          if (
            receivedMessage?.sender_id === currentUserId &&
            typeof receivedMessage?.content === "string"
          ) {
            const optimisticIndex = prevMessages.findIndex(
              (m) => m.id < 0 && m.sender_id === currentUserId && m.content === receivedMessage.content,
            );
            if (optimisticIndex !== -1) {
              const next = prevMessages.slice();
              next.splice(optimisticIndex, 1);
              return [...next, receivedMessage];
            }
          }
          return [...prevMessages, receivedMessage];
        });
      };

      // This is a cleanup function. It runs when the user leaves the page.
      return () => {
        console.log("WebSocket disconnected.");
        ws.current?.close(); // Hang up the phone line
      };
    }, [recipientId]);

useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages.length]);

const translateMessage = async (message: Message) => {
  const messageId = message.id;
  if (!messageId) return;

  setIsTranslatingByMessageId((prev) => ({ ...prev, [messageId]: true }));
  try {
    const token = localStorage.getItem('auth_token');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const targetLanguage = language === "hi" ? "Hindi" : language === "es" ? "Spanish" : "English";

    const res = await fetch(`${API_URL}/api/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: message.content,
        target_language: targetLanguage,
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.detail || `Failed to translate (${res.status})`);
    }

    const translated = String(data?.translated_text || "").trim();
    if (!translated) throw new Error("Failed to translate");

    setTranslatedByMessageId((prev) => ({ ...prev, [messageId]: translated }));
    setShowOriginalByMessageId((prev) => ({ ...prev, [messageId]: false }));
  } catch (e) {
    setTranslatedByMessageId((prev) => ({
      ...prev,
      [messageId]: e instanceof Error ? e.message : "Failed to translate",
    }));
  } finally {
    setIsTranslatingByMessageId((prev) => ({ ...prev, [messageId]: false }));
  }
};
    
// This instruction runs only when the recipientId changes

const handleSendMessage = () => {
      const content = newMessage.trim();
      if (!ws.current || !content) return;

      const messagePayload = {
        recipient_id: recipientId,
        content,
      };

      // Optimistic UI: backend pushes to recipient, not to sender.
      // So we append our outgoing message immediately.
      if (currentUserId) {
        const optimistic: Message = {
          id: -Date.now(),
          sender_id: currentUserId,
          content,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);
      }

      ws.current.send(JSON.stringify(messagePayload));
      setNewMessage('');
    };
  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle>{t("chat.chat_with")} {recipientName}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
      {isLoading ? (
        <p>{t("chat.loading")}</p>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[80%]">
              <div
                className={
                  message.sender_id === currentUserId
                    ? "rounded-2xl px-3 py-2 text-sm bg-primary text-primary-foreground"
                    : "rounded-2xl px-3 py-2 text-sm bg-muted text-foreground"
                }
              >
                {translatedByMessageId[message.id] && !showOriginalByMessageId[message.id]
                  ? translatedByMessageId[message.id]
                  : message.content}
              </div>

              <div className="mt-1">
                {translatedByMessageId[message.id] ? (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                    onClick={() =>
                      setShowOriginalByMessageId((prev) => ({
                        ...prev,
                        [message.id]: !prev[message.id],
                      }))
                    }
                  >
                    {showOriginalByMessageId[message.id]
                      ? t("common.see_translation")
                      : t("common.show_original")}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                    onClick={() => translateMessage(message)}
                    disabled={!!isTranslatingByMessageId[message.id]}
                  >
                    {isTranslatingByMessageId[message.id] ? t("chat.translating") : t("chat.translate")}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex w-full items-center space-x-2">
          <Input
          placeholder={t("chat.type_message")}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button onClick={handleSendMessage}>
          <Send className="h-4 w-4" />
        </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ChatInterface;
