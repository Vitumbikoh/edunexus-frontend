import React, { useState } from "react";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  date: string;
  read: boolean;
}

// Sample data – replace with real API calls
const sampleInbox: Message[] = [
  {
    id: "1",
    from: "Admin",
    to: "You",
    subject: "Welcome to edunexus",
    content: "Welcome! We are excited to have you on board. Please explore the system and reach out if you need any help.",
    date: "2026-03-06T08:00:00Z",
    read: false,
  },
  {
    id: "2",
    from: "Finance Department",
    to: "You",
    subject: "Fee Structure Update",
    content: "Please note that the fee structure for the upcoming term has been updated. Kindly review the changes in the Finance section.",
    date: "2026-03-05T14:30:00Z",
    read: true,
  },
];

const sampleSent: Message[] = [
  {
    id: "3",
    from: "You",
    to: "Admin",
    subject: "Re: Welcome to edunexus",
    content: "Thank you! Looking forward to the new term.",
    date: "2026-03-06T09:15:00Z",
    read: true,
  },
];

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Message | null>(null);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);

  const filteredInbox = sampleInbox.filter(
    (m) =>
      m.from.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSent = sampleSent.filter(
    (m) =>
      m.to.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    setSending(true);
    // TODO: integrate with real messaging API
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
    toast({ title: "Message sent", description: "Your message has been sent successfully." });
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

          <Tabs defaultValue="inbox">
            <TabsList className="w-full">
              <TabsTrigger value="inbox" className="flex-1">
                <Inbox className="h-4 w-4 mr-2" />
                Inbox
                {sampleInbox.filter((m) => !m.read).length > 0 && (
                  <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0">
                    {sampleInbox.filter((m) => !m.read).length}
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
                {filteredInbox.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No messages found.</p>
                ) : (
                  <div className="space-y-1">
                    {filteredInbox.map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => setSelected(msg)}
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
                {filteredSent.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No sent messages.</p>
                ) : (
                  <div className="space-y-1">
                    {filteredSent.map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => setSelected(msg)}
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
                  <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                    Close
                  </Button>
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
          <Card>
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
