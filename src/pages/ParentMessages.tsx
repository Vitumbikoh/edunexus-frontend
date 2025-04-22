
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Send, Mail, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define message types for better type checking
interface InboxMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  read: boolean;
  content: string;
}

interface SentMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  content: string;
}

type Message = InboxMessage | SentMessage;

// Type guard to check if a message is an InboxMessage
function isInboxMessage(message: Message): message is InboxMessage {
  return 'read' in message;
}

export default function ParentMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('inbox');
  const [composing, setComposing] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  if (!user?.parentData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>No data available.</p>
      </div>
    );
  }

  // Mock messages data
  const mockMessages: InboxMessage[] = [
    {
      id: '1',
      from: 'Mr. Smith (Math Teacher)',
      to: user.name,
      subject: 'Math Homework Update',
      date: '2025-04-18',
      read: true,
      content: 'Dear Parent, I wanted to let you know that your child has been doing exceptionally well in math class. The recent homework assignments have been completed with great attention to detail. Please encourage them to keep up the good work!'
    },
    {
      id: '2',
      from: 'Ms. Johnson (Science Teacher)',
      to: user.name,
      subject: 'Science Project Reminder',
      date: '2025-04-20',
      read: false,
      content: 'Dear Parent, This is a friendly reminder that the science project is due next Friday. Your child should be working on collecting data for their experiment. Please ensure they have all the materials needed to complete the project successfully.'
    },
    {
      id: '3',
      from: 'Principal Davis',
      to: user.name,
      subject: 'Upcoming Parent-Teacher Conference',
      date: '2025-04-21',
      read: false,
      content: 'Dear Parent, We would like to invite you to our upcoming parent-teacher conference scheduled for next month. This will be a great opportunity to discuss your child\'s progress and any concerns you might have. You can book your preferred time slot through our online portal.'
    }
  ];

  const sentMessages: SentMessage[] = [
    {
      id: '101',
      from: user.name,
      to: 'Ms. Williams (English Teacher)',
      subject: 'Question about Reading Assignment',
      date: '2025-04-15',
      content: 'Dear Ms. Williams, My child mentioned there was some confusion about the reading assignment for this week. Could you please clarify what chapters need to be completed by Friday? Thank you for your assistance.'
    },
    {
      id: '102',
      from: user.name,
      to: 'Coach Thompson',
      subject: 'Sports Day Participation',
      date: '2025-04-10',
      content: 'Hello Coach Thompson, I would like to confirm that my child will be participating in the upcoming sports day event. Please let me know if there are any specific preparations or equipment needed. Thank you.'
    }
  ];

  const handleOpenMessage = (message: Message) => {
    setSelectedMessage(message);
    // Mark as read if it was unread (only for inbox messages)
    if (isInboxMessage(message) && !message.read && activeTab === 'inbox') {
      message.read = true;
    }
  };

  const handleComposeMessage = () => {
    setComposing(true);
    setSelectedMessage(null);
  };

  const handleSendMessage = () => {
    // Here you would normally send the message to the API
    toast({
      title: "Message Sent",
      description: "Your message has been sent successfully.",
    });
    setComposing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Communicate with your child's teachers</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-4">
              <Button className="w-full mb-4" onClick={handleComposeMessage}>
                <Send className="mr-2 h-4 w-4" />
                Compose Message
              </Button>
              
              <div className="space-y-1">
                <Button 
                  variant={activeTab === 'inbox' ? 'default' : 'ghost'} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab('inbox')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Inbox
                  <Badge className="ml-auto" variant="secondary">
                    {mockMessages.filter(m => m.read === false).length}
                  </Badge>
                </Button>
                
                <Button 
                  variant={activeTab === 'sent' ? 'default' : 'ghost'} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab('sent')}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Sent
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-2">
          <Card className="h-full">
            {composing ? (
              <>
                <CardHeader>
                  <CardTitle>New Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To:</label>
                    <Input placeholder="Recipient" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject:</label>
                    <Input placeholder="Subject" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message:</label>
                    <Textarea 
                      placeholder="Type your message here" 
                      className="min-h-[200px]"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setComposing(false)}>Cancel</Button>
                  <Button onClick={handleSendMessage}>Send Message</Button>
                </CardFooter>
              </>
            ) : selectedMessage ? (
              <>
                <CardHeader>
                  <CardTitle>{selectedMessage.subject}</CardTitle>
                  <CardDescription>
                    {activeTab === 'inbox' ? `From: ${selectedMessage.from}` : `To: ${selectedMessage.to}`}
                    <span className="block">Date: {selectedMessage.date}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-background rounded-lg border">
                    <p className="whitespace-pre-line">{selectedMessage.content}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" onClick={() => setSelectedMessage(null)}>Back</Button>
                  {activeTab === 'inbox' && (
                    <Button className="ml-auto" onClick={handleComposeMessage}>
                      <Send className="mr-2 h-4 w-4" />
                      Reply
                    </Button>
                  )}
                </CardFooter>
              </>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>{activeTab === 'inbox' ? 'Inbox' : 'Sent Messages'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">{activeTab === 'inbox' ? 'From' : 'To'}</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeTab === 'inbox' ? (
                        mockMessages.map((message) => (
                          <TableRow 
                            key={message.id} 
                            className={`cursor-pointer ${!message.read ? 'font-medium' : ''}`}
                            onClick={() => handleOpenMessage(message)}
                          >
                            <TableCell>{message.from}</TableCell>
                            <TableCell>
                              {message.subject}
                              {!message.read && (
                                <Badge className="ml-2" variant="default">New</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{message.date}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        sentMessages.map((message) => (
                          <TableRow 
                            key={message.id} 
                            className="cursor-pointer"
                            onClick={() => handleOpenMessage(message)}
                          >
                            <TableCell>{message.to}</TableCell>
                            <TableCell>{message.subject}</TableCell>
                            <TableCell className="text-right">{message.date}</TableCell>
                          </TableRow>
                        ))
                      )}
                      {(activeTab === 'inbox' ? mockMessages : sentMessages).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                            No messages to display
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
