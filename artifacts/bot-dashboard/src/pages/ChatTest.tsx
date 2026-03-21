import React, { useState, useRef, useEffect } from "react";
import { useSendChatMessage } from "@workspace/api-client-react";
import { Send, Bot, User, Smartphone, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocalMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  time: string;
  meta?: {
    intent?: string;
    agent?: string;
    confidence?: number;
    processingTime?: number;
  };
}

export default function ChatTest() {
  const [messages, setMessages] = useState<LocalMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      content: '¡Hola! Soy tu asistente virtual inteligente. ¿En qué te puedo ayudar hoy?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  
  const chatMutation = useSendChatMessage();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userText = input.trim();
    setInput("");
    
    // Add user message immediately
    const userMsg: LocalMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await chatMutation.mutateAsync({
        data: {
          phone: "test-user-123",
          message: userText,
          clientName: "Test User"
        }
      });

      const botMsg: LocalMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: res.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta: {
          intent: res.intent,
          agent: res.agent,
          confidence: res.confidence,
          processingTime: res.processingTime
        }
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: LocalMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: 'Hubo un error de conexión al simular la respuesta.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const lastBotMessage = [...messages].reverse().find(m => m.role === 'bot' && m.meta);

  return (
    <div className="animate-fade-in flex flex-col lg:flex-row gap-8 h-[calc(100vh-8rem)]">
      {/* Phone Simulator */}
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-[400px] bg-black border-[8px] border-secondary rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col h-full ring-1 ring-border">
          {/* Top Notch */}
          <div className="absolute top-0 inset-x-0 h-6 bg-secondary rounded-b-2xl w-40 mx-auto z-20 flex items-center justify-center gap-2">
            <div className="w-12 h-1.5 bg-black rounded-full opacity-50" />
            <div className="w-1.5 h-1.5 bg-black rounded-full opacity-50" />
          </div>

          {/* Header */}
          <div className="bg-[#075e54] pt-10 pb-3 px-4 flex items-center gap-3 z-10 shadow-md">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base leading-tight">Bot Inteligente</h3>
              <p className="text-white/80 text-xs">en línea</p>
            </div>
          </div>

          {/* Chat Background */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#ece5dd] dark:bg-[#0b141a] space-y-4 bg-[url('https://i.pinimg.com/originals/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover bg-blend-overlay dark:bg-blend-multiply">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div 
                  className={cn(
                    "px-3 py-2 rounded-xl text-[15px] shadow-sm relative",
                    msg.role === 'user' 
                      ? "bg-[#dcf8c6] dark:bg-[#005c4b] text-black dark:text-white rounded-tr-none" 
                      : "bg-white dark:bg-[#202c33] text-black dark:text-white rounded-tl-none"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                    <span className="text-[10px]">{msg.time}</span>
                    {msg.role === 'user' && <CheckCircle2 size={10} className="text-blue-500" />}
                  </div>
                </div>
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="mr-auto bg-white dark:bg-[#202c33] px-4 py-3 rounded-xl rounded-tl-none shadow-sm flex items-center gap-1.5 w-16">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input Area */}
          <div className="bg-[#f0f0f0] dark:bg-[#202c33] p-2 px-3 flex items-end gap-2 pb-6">
            <form onSubmit={handleSend} className="flex-1 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-white dark:bg-[#2a3942] text-black dark:text-white rounded-full px-4 py-3 outline-none text-[15px] placeholder:text-muted-foreground border-none"
                disabled={chatMutation.isPending}
              />
              <button 
                type="submit"
                disabled={!input.trim() || chatMutation.isPending}
                className="w-12 h-12 shrink-0 rounded-full bg-[#00a884] flex items-center justify-center text-white disabled:opacity-50 hover:bg-[#008f6f] transition-colors"
              >
                <Send size={20} className="ml-1" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Inspector Panel */}
      <div className="lg:w-96 flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-display font-bold mb-2">Inspector IA</h2>
          <p className="text-muted-foreground">Monitorea el razonamiento del bot en tiempo real para el último mensaje.</p>
        </div>

        {lastBotMessage?.meta ? (
          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-xl shadow-black/5 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Agente Responsable</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="text-primary" size={18} />
                </div>
                <span className="font-bold text-lg">{lastBotMessage.meta.agent}</span>
              </div>
            </div>

            <div className="h-px w-full bg-border/50" />

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Clasificación de Intención</p>
              <div className="flex items-center justify-between bg-secondary/50 p-3 rounded-xl border border-border/50">
                <span className="font-semibold text-foreground capitalize">
                  {lastBotMessage.meta.intent?.replace('_', ' ')}
                </span>
                <span className="text-sm font-mono text-primary font-bold">
                  {((lastBotMessage.meta.confidence || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full mt-3 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(lastBotMessage.meta.confidence || 0) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="h-full bg-primary"
                />
              </div>
            </div>

            <div className="h-px w-full bg-border/50" />

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Tiempo de respuesta</span>
              <span className="font-mono bg-secondary px-2 py-1 rounded text-foreground font-medium">
                {lastBotMessage.meta.processingTime}ms
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-card/50 border border-border/50 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center h-64 text-muted-foreground">
            <AlertCircle size={32} className="mb-4 opacity-50" />
            <p>Envía un mensaje en el simulador para ver el análisis de la IA en tiempo real.</p>
          </div>
        )}

        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 mt-auto">
          <h4 className="font-semibold text-primary flex items-center gap-2 mb-2">
            <Smartphone size={18} />
            Tips de Pruebas
          </h4>
          <ul className="text-sm text-primary/80 space-y-2">
            <li className="flex gap-2"><ChevronRight size={16} className="shrink-0 mt-0.5" /> Intenta preguntar por un producto específico para activar el Agente de Ventas.</li>
            <li className="flex gap-2"><ChevronRight size={16} className="shrink-0 mt-0.5" /> Quejate de un problema para ver cómo el Agente de Soporte toma el control.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
