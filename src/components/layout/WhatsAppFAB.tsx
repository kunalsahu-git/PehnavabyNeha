"use client";

import { MessageCircle, Instagram, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function WhatsAppFAB() {
  const [isHovered, setIsHovered] = useState(false);

  const openWhatsApp = () => {
    window.open("https://wa.me/918888888888", "_blank");
  };

  const openInstagram = () => {
    window.open("https://instagram.com/pehnavabyneha", "_blank");
  };

  return (
    <div 
      className="fixed bottom-20 right-6 z-[60] flex flex-col items-center gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isHovered && (
          <>
            {/* Instagram Option */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={openInstagram}
                className="h-12 w-12 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] hover:opacity-90 shadow-xl p-0 flex items-center justify-center text-white border-2 border-white"
              >
                <Instagram className="h-6 w-6" />
                <span className="sr-only">Visit Instagram</span>
              </Button>
            </motion.div>

            {/* WhatsApp Option */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              <Button
                onClick={openWhatsApp}
                className="h-12 w-12 rounded-full bg-[#25D366] hover:bg-[#128C7E] shadow-xl p-0 flex items-center justify-center text-white border-2 border-white"
              >
                <MessageSquare className="h-6 w-6" />
                <span className="sr-only">Chat on WhatsApp</span>
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <Button
        className="h-14 w-14 rounded-full bg-primary text-white shadow-2xl p-0 flex items-center justify-center group relative overflow-hidden ring-4 ring-white/20"
      >
        <MessageCircle 
          className={`h-8 w-8 transition-all duration-300 ${isHovered ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`} 
        />
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isHovered ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
        >
          <span className="font-bold text-[10px] uppercase tracking-tighter">Hi!</span>
        </div>
        <span className="sr-only">Connect with us</span>
      </Button>
    </div>
  );
}
