
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { LoginButton } from '@/components/login-button';
import { Cloud, Twitter, Facebook, Instagram, Mail, Phone, Clock, MessageSquare, Building } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContactPage() {
  const { data: user } = useUser();
  const isAdmin = user?.email === 'iunlockapple01@gmail.com';
  const telegramIconImage = PlaceHolderImages.find(img => img.id === 'telegram-icon');

  const contactMethods = [
    { 
      icon: MessageSquare, 
      title: 'WhatsApp', 
      value: 'Start a Chat', 
      link: 'https://wa.me/message/EJ6T3XS4OWK3M1',
      note: 'For immediate support'
    },
    { 
      icon: 'telegram',
      title: 'Telegram', 
      value: '@iCloudServer', 
      link: 'https://t.me/iCloudServer',
      note: 'Direct messaging'
    },
    { 
      icon: Mail, 
      title: 'Email', 
      value: 'support@icloudserver.com', 
      link: 'mailto:support@icloudserver.com',
      note: 'For detailed inquiries'
    },
  ];
  
  const socialChannels = [
    { icon: 'telegram', name: 'Telegram Group', handle: 'iCloudServerGroup', link: 'https://t.me/iCloudServerGroup' },
    { icon: Twitter, name: 'Twitter', handle: '@iCloudServer', link: '#' },
    { icon: Facebook, name: 'Facebook', handle: 'iCloud Server', link: '#' },
  ];

  return (
    <div className="bg-gray-50 text-gray-800">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gradient flex items-center gap-2">
                <Cloud /> iCloud Server
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</Link>
                <Link href="/services" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Services</Link>
                {user && (
                  <Link href="/my-account" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">My Account</Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Admin</Link>
                )}
                <Link href="/#about" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">About</Link>
                <Link href="/contact" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors ring-1 ring-inset ring-primary">Contact</Link>
                <LoginButton />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-32 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-lg">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold">Contact Us</h1>
            <p className="text-lg text-gray-600 mt-2">We’re here to help you with all unlocking requests.</p>
          </div>
          
          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">Customer Support (24/7)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {contactMethods.map(method => (
                  <a key={method.title} href={method.link} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors">
                    <div className="flex items-center gap-4">
                      {method.icon === 'telegram' && telegramIconImage ? (
                        <Image src={telegramIconImage.imageUrl} alt="Telegram" width={24} height={24} />
                      ) : (
                        <method.icon className="w-6 h-6 text-primary" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">{method.title}</p>
                        <p className="text-blue-600 hover:underline">{method.value}</p>
                        <p className="text-xs text-gray-500">{method.note}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">Social Channels</h2>
                 <ul className="space-y-3 mt-4">
                  {socialChannels.map(channel => (
                     <li key={channel.name}>
                      <a href={channel.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-primary">
                        {channel.icon === 'telegram' && telegramIconImage ? <Image src={telegramIconImage.imageUrl} alt="Telegram" width={20} height={20} /> : <channel.icon className="w-5 h-5" />}
                        <span>{channel.name}: <span className="font-semibold">{channel.handle}</span></span>
                      </a>
                     </li>
                  ))}
                 </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">Office Hours</h2>
                <div className="mt-4 space-y-3 text-gray-700">
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 mt-1 text-primary"/>
                        <div>
                            <p className="font-semibold">Physical Office Hours</p>
                            <ul className="list-disc list-inside text-gray-600">
                                <li>Mon–Fri: 9:00 AM – 6:00 PM CST</li>
                                <li>Sat: 10:00 AM – 4:00 PM CST</li>
                                <li>Sun: Closed</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Building className="w-5 h-5 mt-1 text-primary"/>
                        <div>
                            <p className="font-semibold">Mailing Address</p>
                            <address className="not-italic text-gray-600">
                                iCloud Server<br />
                                123 Unlock Services Lane<br />
                                Tech City, TX 75001, USA
                            </address>
                        </div>
                    </div>
                </div>
              </section>
            </div>
            
            <div className="text-center text-gray-600 pt-8 border-t">
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Feedback</h3>
                <p>We welcome suggestions and customer feedback at any time.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <div className="text-2xl font-bold text-gradient mb-4 flex items-center gap-2">
                        <Cloud /> iCloud Server
                    </div>
                    <p className="text-gray-400">Professional Apple device unlocking service</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Support</h4>
                    <ul className="space-y-2 text-gray-400">
                        <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
                        <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                        <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                        <li><Link href="/refund-policy" className="hover:text-white">Refund Policy</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Join our Telegram</h4>
                    <a href="https://t.me/iCloudServerGroup" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white inline-flex items-center">
                        <Image 
                            src={telegramIconImage?.imageUrl || ''} 
                            alt="Telegram Group" 
                            width={18} 
                            height={18}
                            className="mr-2"
                        />
                        Telegram Channel
                    </a>
                    <h4 className="font-semibold mb-4 mt-4">Contact Us</h4>
                     <a href="https://t.me/iCloudServer" className="text-gray-400 hover:text-white inline-flex items-center mb-2">
                        <Image 
                             src={telegramIconImage?.imageUrl || ''} 
                            alt="Telegram" 
                            width={18} 
                            height={18}
                            className="mr-2"
                        />
                        Contact us on Telegram
                    </a>
                     <a href="https://wa.me/message/EJ6T3XS4OWK3M1" className="text-gray-400 hover:text-white inline-flex items-center">
                        <MessageSquare className="mr-2" />
                        Contact us on WhatsApp
                    </a>
                </div>
            </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 iCloud Server. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

    