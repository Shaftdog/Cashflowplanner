'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '../ui/skeleton';

interface RecurringChatProps {
  onSendMessage: (message: string) => Promise<void>;
  isSending: boolean;
}

export default function RecurringChat({ onSendMessage, isSending }: RecurringChatProps) {
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (message.trim()) {
      await onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="space-y-4">
       <Alert>
        <Bot className="h-4 w-4" />
        <AlertDescription>
          Hi! I can help extract recurring expenses from your content. Try describing your monthly bills or uploading a statement. For example: "Rent is $1500 due on the 1st of each month"
        </AlertDescription>
      </Alert>

      {isSending && (
         <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
      )}

      <div className="flex w-full items-center space-x-2">
        <Input
          type="text"
          placeholder="Describe your recurring expenses or paste content here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isSending}
        />
        <Button onClick={handleSend} disabled={isSending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

