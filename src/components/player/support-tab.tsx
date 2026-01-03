'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, MessageCircle, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';


const supportChannels = [
    {
        icon: Users,
        title: 'Join our Discord',
        description: 'Get instant support from the community and staff. Ask questions, report issues, and stay updated.'
    },
    {
        icon: MessageCircle,
        title: 'WhatsApp',
        description: 'Chat with our support team directly on WhatsApp for quick assistance with your queries.'
    },
    {
        icon: Phone,
        title: 'Phone Call',
        description: 'For urgent issues, you can call our dedicated support line during business hours for direct help.'
    }
]

export function SupportTab() {
  return (
     <Card>
        <CardHeader>
            <CardTitle>Help & Support</CardTitle>
            <CardDescription>
                Need help? Choose one of our support channels below to get assistance.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {supportChannels.map((channel, index) => (
                 <Card key={index} className="grid grid-cols-1 md:grid-cols-[auto,1fr,auto] items-center gap-4 p-6 bg-muted/50">
                    <div className="flex items-center justify-center bg-primary/10 text-primary h-12 w-12 rounded-lg">
                        <channel.icon className="h-6 w-6"/>
                    </div>
                    <div className="flex flex-col">
                        <h3 className="font-semibold">{channel.title}</h3>
                        <p className="text-sm text-muted-foreground">{channel.description}</p>
                    </div>
                    <div className="md:ml-auto">
                        <Button
                            disabled
                            variant="outline"
                            className={cn(
                                "w-full md:w-auto",
                                "opacity-50 bg-gray-700/50 hover:bg-gray-700/50 cursor-not-allowed",
                                "border-yellow-500/50"
                            )}
                        >
                            Coming Soon
                        </Button>
                    </div>
                </Card>
            ))}
        </CardContent>
    </Card>
  );
}
