"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import PageWrapper from '@/components/PageWrapper';
import UserDashboardButton from '@/components/UserDashboardButton';

const ChatPage = () => {
  const params = useParams();
  const recipientId = Number(params.id);
  const [recipientName, setRecipientName] = useState<string>(`User #${recipientId}`);

  const API_URL = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    []
  );

  useEffect(() => {
    const loadRecipient = async () => {
      if (!Number.isFinite(recipientId)) return;
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${API_URL}/api/users/${recipientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => null);
        if (res.ok && data?.full_name) {
          setRecipientName(data.full_name);
        } else {
          setRecipientName(`User #${recipientId}`);
        }
      } catch {
        setRecipientName(`User #${recipientId}`);
      }
    };

    loadRecipient();
  }, [API_URL, recipientId]);

  return (
    <PageWrapper>
      <div className="container mx-auto max-w-2xl py-8">
        <div className="sticky top-0 z-40 -mx-4 px-4 py-4 bg-background/80 backdrop-blur-sm border-b border-border mb-6">
          <div className="flex items-center justify-between gap-3">
            <UserDashboardButton />
          </div>
        </div>
        <ChatInterface recipientId={recipientId} recipientName={recipientName} />
      </div>
    </PageWrapper>
  );
};

export default ChatPage;