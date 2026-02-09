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
  const [messages, setMessages] = useState<Message[]>([]); // This is our filing tray for messages
  const [isLoading, setIsLoading] = useState(true); // A flag to know when we are loading history
  const [newMessage, setNewMessage] = useState(''); // Holds the text in the input box
  const ws = useRef<WebSocket | null>(null); // Holds our live WebSocket "phone line"
useEffect(() => {
      // 1. Fetch the history (you already wrote this part)
      const fetchHistory = async () => {
        // ... your existing fetchHistory code is here ...
      };
      fetchHistory();

      // 2. Open the WebSocket "phone line"
      const token = localStorage.getItem('auth_token');
      // We are connecting to the /ws/{token} endpoint you built on the backend
      // NOTE: 'ws://' is for WebSocket connections, not 'http://'
      ws.current = new WebSocket(`ws://localhost:8000/api/ws/${token}`);

      ws.current.onopen = () => {
        console.log("WebSocket connected!");
      };

      ws.current.onmessage = (event) => {
        // A new message has arrived from the server!
        const receivedMessage = JSON.parse(event.data);
        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
      };

      // This is a cleanup function. It runs when the user leaves the page.
      return () => {
        console.log("WebSocket disconnected.");
        ws.current?.close(); // Hang up the phone line
      };
    }, [recipientId]);
    
// This instruction runs only when the recipientId changes

const handleSendMessage = () => {
      if (ws.current && newMessage.trim()) {
        const messagePayload = {
          recipient_id: recipientId,
          content: newMessage,
        };
        ws.current.send(JSON.stringify(messagePayload)); // Send the message down the phone line
        setNewMessage(''); // Clear the input box
      }
    };
  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle>Chat with {recipientName}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
      {isLoading ? (
        <p>Loading history...</p>
      ) : (
        messages.map((message) => (
          <div key={message.id}>
            <p className="text-sm p-2 bg-muted rounded-lg w-fit">
              {message.content}
            </p>
          </div>
        ))
      )}
    </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex w-full items-center space-x-2">
          <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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
