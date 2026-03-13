import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send,
  Mail,
  Inbox,
  Search,
  MessageCircle,
  Clock,
  User,
  Reply,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MessageItem, messageService, RecipientOption } from "@/services/messageService";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Messages() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MessageItem | null>(null);
  const [inbox, setInbox] = useState<MessageItem[]>([]);
  const [sent, setSent] = useState<MessageItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [recipientSuggestions, setRecipientSuggestions] = useState<RecipientOption[]>([]);
  const [sending, setSending] = useState(false);
  const selectedFromInbox = !!selected && inbox.some((m) => m.id === selected.id);

  const filteredInbox = useMemo(() => inbox, [inbox]);
  const filteredSent = useMemo(() => sent, [sent]);

  useEffect(() => {
    if (!token) return;

    const run = async () => {
      setLoading(true);
      try {
        const [inboxResponse, sentResponse] = await Promise.all([
          messageService.getInbox(token, search),
          messageService.getSent(token, search),
        ]);
        setInbox(inboxResponse.messages || []);
        setSent(sentResponse.messages || []);
        setUnreadCount(inboxResponse.unreadCount || 0);

        setSelected((current) => {
          if (!current) return null;
          const merged = [...(inboxResponse.messages || []), ...(sentResponse.messages || [])];
          return merged.find((m) => m.id === current.id) || null;
        });
      } catch (error: any) {
        toast({
          title: "Failed to load messages",
          description: error.message || "Could not fetch messages.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token, search, toast]);

  useEffect(() => {
    if (!token || !composeTo.trim()) {
      setRecipientSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const recipients = await messageService.searchRecipients(token, composeTo);
        setRecipientSuggestions(recipients);
      } catch {
        setRecipientSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [token, composeTo]);

  const selectMessage = async (msg: MessageItem) => {
    setSelected(msg);

    if (!token || activeTab !== "inbox" || msg.read) return;

    try {
      await messageService.markAsRead(token, msg.id);
      setInbox((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m)));
      setUnreadCount((count) => Math.max(0, count - 1));
      setSelected((prev) => (prev?.id === msg.id ? { ...prev, read: true } : prev));
    } catch {
      // Keep UX smooth even if mark-read fails silently.
    }
  };

  const handleSend = async () => {
    if (!token) {
      toast({ title: "Not authenticated", description: "Please log in and try again.", variant: "destructive" });
      return;
    }
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    setSending(true);

    try {
      await messageService.sendMessage(token, {
        to: composeTo.trim(),
        subject: composeSubject.trim(),
        content: composeBody.trim(),
      });

      const sentResponse = await messageService.getSent(token, search);
      setSent(sentResponse.messages || []);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setRecipientSuggestions([]);
      setActiveTab("sent");

      toast({ title: "Message sent", description: "Your message has been sent successfully." });
    } catch (error: any) {
      toast({ title: "Send failed", description: error.message || "Unable to send message.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleReply = () => {
    if (!selected) return;
    setComposeTo(selected.from);
    setComposeSubject((prev) => {
      const base = selected.subject || "";
      if (prev.trim()) return prev;
      return /^re:/i.test(base) ? base : `Re: ${base}`;
    });
    const composeCard = document.getElementById("compose-card");
    composeCard?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Send and receive messages with staff, teachers, and administration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel — inbox / sent list */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "inbox" | "sent")}>
            <TabsList className="w-full">
              <TabsTrigger value="inbox" className="flex-1">
                <Inbox className="h-4 w-4 mr-2" />
                Inbox
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Sent
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inbox" className="mt-2">
              <ScrollArea className="h-[400px]">
                {loading ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">Loading messages...</p>
                ) : filteredInbox.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No messages found.</p>
                ) : (
                  <div className="space-y-1">
                    {filteredInbox.map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => selectMessage(msg)}
                        className={cn(
                          "w-full text-left rounded-lg border p-3 transition-colors hover:bg-accent",
                          selected?.id === msg.id && "bg-accent",
                          !msg.read && "border-primary/40 bg-primary/5"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={cn("text-sm truncate", !msg.read && "font-semibold")}>
                            {msg.from}
                          </span>
                          {!msg.read && (
                            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className={cn("text-xs truncate", !msg.read ? "font-medium" : "text-muted-foreground")}>
                          {msg.subject}
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(msg.date)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="sent" className="mt-2">
              <ScrollArea className="h-[400px]">
                {loading ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">Loading messages...</p>
                ) : filteredSent.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No sent messages.</p>
                ) : (
                  <div className="space-y-1">
                    {filteredSent.map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => selectMessage(msg)}
                        className={cn(
                          "w-full text-left rounded-lg border p-3 transition-colors hover:bg-accent",
                          selected?.id === msg.id && "bg-accent"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">To: {msg.to}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{msg.subject}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(msg.date)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel — message view + compose */}
        <div className="lg:col-span-2 space-y-4">
          {/* Message viewer */}
          {selected ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">{selected.subject}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span>From: <strong>{selected.from}</strong></span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(selected.date)}</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedFromInbox && (
                      <Button variant="outline" size="sm" onClick={handleReply} className="gap-1">
                        <Reply className="h-4 w-4" />
                        Reply
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.content}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-36 border-dashed">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Select a message to read it</p>
              </div>
            </Card>
          )}

          {/* Compose */}
          <Card id="compose-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                New Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="To (name or email)"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
              />
              {recipientSuggestions.length > 0 && (
                <div className="border rounded-md p-2 text-xs space-y-1">
                  {recipientSuggestions.map((recipient) => (
                    <button
                      key={recipient.id}
                      type="button"
                      className="w-full text-left px-2 py-1 rounded hover:bg-accent"
                      onClick={() => {
                        setComposeTo(recipient.email || recipient.username || recipient.label);
                        setRecipientSuggestions([]);
                      }}
                    >
                      {recipient.label}
                    </button>
                  ))}
                </div>
              )}
              <Input
                placeholder="Subject"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
              />
              <Textarea
                placeholder="Write your message…"
                rows={5}
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
              />
              <Button onClick={handleSend} disabled={sending} className="gap-2">
                <Send className="h-4 w-4" />
                {sending ? "Sending…" : "Send Message"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
