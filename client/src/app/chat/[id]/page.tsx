
    "use client";

    import React from 'react';
    import { useParams } from 'next/navigation';
    import ChatInterface from '@/components/ChatInterface';
    import PageWrapper from '@/components/PageWrapper';

    const ChatPage = () => {
      const params = useParams();
      const recipientId = Number(params.id); // Get the ID from the URL

      // For now, we'll just use a placeholder name.
      // Later, we can fetch the user's real name.
      const recipientName = `User #${recipientId}`;

      return (
        <PageWrapper>
          <div className="container mx-auto max-w-2xl py-8">
            <ChatInterface
              recipientId={recipientId}
              recipientName={recipientName}
            />
          </div>
        </PageWrapper>
      );
    };

    export default ChatPage;