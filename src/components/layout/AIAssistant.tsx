'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Loader2, 
  Sparkles, 
  ArrowRight,
  ShoppingBag,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { whatsappCustomerAssistant } from '@/ai/flows/whatsapp-customer-assistant';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Namaste! I am Neha\'s virtual assistant. How can I help you discover the perfect outfit today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const result = await whatsappCustomerAssistant({
        query: userMessage,
        userId: user?.uid || 'anonymous-guest'
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I\'m having a bit of trouble connecting to the boutique studio. Please try again or reach out via WhatsApp!' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger - Moved to bottom-6 to be below the social FAB */}
      <div className="fixed bottom-6 right-6 z-[60]">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="h-12 w-12 rounded-full bg-slate-900 hover:bg-black text-white shadow-2xl p-0 flex items-center justify-center border-2 border-white/20"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          </Button>
        </motion.div>
      </div>

      {/* Chat Window - Positioned above the tier of FABs */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 z-[60] w-[320px] sm:w-[380px] h-[500px] bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary p-6 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-headline font-bold uppercase tracking-widest">Boutique AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Always Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="opacity-60 hover:opacity-100 transition-opacity">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Body - Scrollable Area */}
            <div 
              ref={scrollRef}
              className="flex-1 p-6 overflow-y-auto overflow-x-hidden scroll-smooth"
            >
              <div className="space-y-6">
                {messages.map((msg, idx) => (
                  <div key={idx} className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === 'user' ? "ml-auto items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "p-4 rounded-2xl text-xs leading-relaxed shadow-sm",
                      msg.role === 'user' 
                        ? "bg-slate-900 text-white rounded-tr-none" 
                        : "bg-secondary/40 text-slate-700 rounded-tl-none border border-slate-100"
                    )}>
                      {msg.content}
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-300 mt-1.5 px-1">
                      {msg.role === 'assistant' ? 'Pehnava AI' : 'You'}
                    </span>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex flex-col items-start max-w-[85%]">
                    <div className="bg-secondary/40 p-4 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      <span className="text-[10px] font-medium text-slate-500 italic">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0 border-t bg-white/50">
              {[
                { icon: Info, label: 'Return Policy' },
                { icon: ShoppingBag, label: 'Track Order' },
                { icon: Sparkles, label: 'Style Advice' }
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => setInput(btn.label)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:bg-primary/5 hover:text-primary transition-colors whitespace-nowrap"
                >
                  <btn.icon className="h-2.5 w-2.5" /> {btn.label}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-6 border-t shrink-0 bg-white">
              <div className="relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="h-12 rounded-full bg-slate-50 border-none pl-5 pr-14 text-xs focus-visible:ring-primary/20"
                />
                <Button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  size="icon" 
                  className="absolute right-1 top-1 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-[0.2em] mt-4">
                Powered by Genkit AI
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
