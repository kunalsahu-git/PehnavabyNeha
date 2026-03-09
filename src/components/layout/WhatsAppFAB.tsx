"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WhatsAppFAB() {
  const openWhatsApp = () => {
    window.open("https://wa.me/918888888888", "_blank");
  };

  return (
    <Button
      onClick={openWhatsApp}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#128C7E] shadow-2xl z-50 p-0 flex items-center justify-center group"
    >
      <MessageCircle className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
      <span className="sr-only">Support on WhatsApp</span>
    </Button>
  );
}