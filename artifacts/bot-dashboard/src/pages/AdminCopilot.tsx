import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "admin" | "ai";
  content: string;
}

export default function AdminCopilot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "¡Hola! Soy tu Co-Piloto administrativo. Puedo ayudarte con dudas sobre la configuración del bot, productos o estadísticas. ¿Qué necesitas?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "admin", content: userText }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "ai", content: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", content: "Lo siento, hubo un error al procesar tu consulta." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden">
      <div className="p-4 border-b border-border/50 bg-secondary/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <Sparkle size={22} />
          </div>
          <div>
            <h2 className="font-bold text-lg">Admin Co-Pilot</h2>
            <p className="text-xs text-muted-foreground">Expertos en tu sistema de ventas</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.role === "admin" ? "flex-row-reverse" : "flex-row")}>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", msg.role === "admin" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
              {msg.role === "admin" ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn("max-w-[80%] px-4 py-3 rounded-2xl", msg.role === "admin" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none")}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Bot size={16} className="animate-pulse" />
            </div>
            <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-none animate-pulse">
              <div className="flex gap-1.5 h-4 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce delay-150" />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t border-border/50 bg-secondary/10">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe tu consulta administrativa..."
            className="flex-1 bg-background border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-primary text-primary-foreground p-3 rounded-xl disabled:opacity-50 transition-transform active:scale-95 shadow-md shadow-primary/20"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
