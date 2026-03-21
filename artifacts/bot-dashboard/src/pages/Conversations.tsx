import React, { useState } from "react";
import { useGetConversations, useGetClientConversations } from "@workspace/api-client-react";
import { MessageSquare, Calendar, User, Search, ChevronRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Conversations() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { data, isLoading } = useGetConversations({ limit: 50 });
  const { data: historyData, isLoading: historyLoading } = useGetClientConversations(selectedClientId || "", {
    query: { enabled: !!selectedClientId }
  });

  const convos = data?.data || [];

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Conversaciones</h1>
        <p className="text-muted-foreground mt-1">Historial completo de interacciones de los usuarios.</p>
      </div>

      <div className="flex-1 bg-card border border-border/50 rounded-2xl shadow-xl shadow-black/5 overflow-hidden flex">
        {/* List Panel */}
        <div className={cn(
          "w-full lg:w-1/3 flex flex-col border-r border-border/50 transition-all duration-300",
          selectedClientId ? "hidden lg:flex" : "flex"
        )}>
          <div className="p-4 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                className="w-full bg-secondary text-foreground rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 ring-primary/50 transition-all text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="h-16 bg-secondary/50 rounded-xl animate-pulse"/>)}
              </div>
            ) : convos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No hay conversaciones.</div>
            ) : (
              convos.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClientId(c.clientId)}
                  className={cn(
                    "w-full text-left p-4 border-b border-border/20 hover:bg-secondary/50 transition-colors flex gap-3",
                    selectedClientId === c.clientId && "bg-secondary border-l-4 border-l-primary"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                    {c.clientName ? c.clientName.charAt(0).toUpperCase() : <User size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <p className="font-semibold text-sm truncate">{c.clientName || c.clientPhone}</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {format(new Date(c.updatedAt), 'MMM d, HH:mm', { locale: es })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                    {c.lastAgent && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                        {c.lastAgent}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* History Panel */}
        <div className={cn(
          "flex-1 flex flex-col bg-background/50",
          !selectedClientId ? "hidden lg:flex items-center justify-center" : "flex"
        )}>
          {!selectedClientId ? (
            <div className="text-center text-muted-foreground">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
              <p>Selecciona una conversación para ver el historial</p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-card border-b border-border/50 flex items-center gap-4">
                <button 
                  onClick={() => setSelectedClientId(null)}
                  className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-secondary text-foreground"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h3 className="font-bold text-foreground">
                    {convos.find(c => c.clientId === selectedClientId)?.clientName || 
                     convos.find(c => c.clientId === selectedClientId)?.clientPhone}
                  </h3>
                  <p className="text-xs text-muted-foreground">Historial completo</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {historyLoading ? (
                  <div className="flex justify-center p-8"><span className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>
                ) : historyData?.messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">Sin mensajes previos.</div>
                ) : (
                  historyData?.messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "flex flex-col max-w-[80%]",
                        msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {msg.role === 'user' ? 'Cliente' : msg.agent || 'Bot'}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50">
                          {format(new Date(msg.createdAt), 'HH:mm', { locale: es })}
                        </span>
                      </div>
                      <div 
                        className={cn(
                          "px-4 py-3 rounded-2xl text-[15px] shadow-sm relative leading-relaxed",
                          msg.role === 'user' 
                            ? "bg-secondary text-secondary-foreground rounded-tr-none border border-border/50" 
                            : "bg-primary/10 text-foreground rounded-tl-none border border-primary/20"
                        )}
                      >
                        {msg.message}
                        {msg.role === 'bot' && msg.intent && (
                          <div className="mt-3 pt-3 border-t border-primary/20 text-[10px] flex items-center justify-between text-primary/80 font-mono">
                            <span>Intent: {msg.intent}</span>
                            <span>Conf: {(msg.confidence! * 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
