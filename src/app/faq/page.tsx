
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { LoginButton } from '@/components/login-button';
import { Cloud, MessageSquare } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


export default function FaqPage() {
  const { data: user } = useUser();
  const isAdmin = user?.email === 'iunlockapple01@gmail.com';
  const telegramIconImage = PlaceHolderImages.find(img => img.id === 'telegram-icon');

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
                <a href="/#about" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">About</a>
                <Link href="/contact" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Contact</Link>
                <LoginButton />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-32 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-lg">
          <h1 className="text-4xl font-bold text-center mb-8">Frequently Asked Questions</h1>
          
          <Accordion type="single" collapsible className="w-full">
            <h2 className="text-2xl font-semibold mt-6 mb-4 text-gray-900 border-b pb-2">General Questions</h2>
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg text-left">What is iCloud Server?</AccordionTrigger>
              <AccordionContent className="text-base text-gray-700 space-y-2">
                <p>iCloud Server is a trusted provider specializing in unlocking a wide range of Apple devices. We offer:</p>
                <ul className="list-disc list-inside space-y-1 pl-4">
                  <li>FMI OFF</li>
                  <li>iCloud account removal</li>
                  <li>Activation unlocks</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg text-left">How does your unlock work?</AccordionTrigger>
              <AccordionContent className="text-base text-gray-700">
                All unlocks are carried out through secure server systems — no jailbreak, no personal data access required. Provide the IMEI or Serial Number and we handle the rest.
              </AccordionContent>
            </AccordionItem>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 border-b pb-2">Supported Devices</h2>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg text-left">Which devices do you support?</AccordionTrigger>
              <AccordionContent className="text-base text-gray-700">
                 <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>iPhones: X – 15 Pro Max</li>
                    <li>iPads: 2016 – 2025 models</li>
                    <li>MacBooks: All models</li>
                    <li>Apple Watches: Series 5 – 8</li>
                 </ul>
              </AccordionContent>
            </AccordionItem>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 border-b pb-2">Payments & Refunds</h2>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg text-left">What are the accepted payment methods?</AccordionTrigger>
              <AccordionContent className="text-base text-gray-700">
                <ul className="list-disc list-inside space-y-1 pl-4">
                  <li>Binance Pay</li>
                  <li>Bitcoin</li>
                  <li>PayPal</li>
                  <li>USDT (TRC20)</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-5">
              <AccordionTrigger className="text-lg text-left">What is your refund policy?</AccordionTrigger>
              <AccordionContent className="text-base text-gray-700 space-y-2">
                <p>Refunds only for orders not completed or rejected. No refunds for devices already unlocked before order. Processing time: 1–3 business days.</p>
              </AccordionContent>
            </AccordionItem>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 border-b pb-2">Security & Privacy</h2>
             <AccordionItem value="item-6">
              <AccordionTrigger className="text-lg text-left">Is the unlock safe?</AccordionTrigger>
              <AccordionContent className="text-base text-gray-700">
                Yes. All unlocks are server-based. We do not perform hacking, phishing, or unauthorized bypasses.
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-7">
              <AccordionTrigger className="text-lg text-left">How do you secure my information?</AccordionTrigger>
              <AccordionContent className="text-base text-gray-700">
                We use multiple layers of protection. Refer to our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> for full details.
              </AccordionContent>
            </AccordionItem>

             <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 border-b pb-2">Customer Support</h2>
             <AccordionItem value="item-8">
              <AccordionTrigger className="text-lg text-left">How can I contact support?</AccordionTrigger>
              <AccordionContent className="text-base text-gray-700 space-y-2">
                <p>Support available 24/7.</p>
                <ul className="list-disc list-inside space-y-1 pl-4">
                    <li><span className="font-semibold">WhatsApp:</span> <a href="https://wa.me/message/EJ6T3XS4OWK3M1" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://wa.me/message/EJ6T3XS4OWK3M1</a></li>
                    <li><span className="font-semibold">Telegram:</span> <a href="https://t.me/iCloudServer" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@iCloudServer</a></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 border-b pb-2">Additional Questions</h2>
             <AccordionItem value="item-9">
              <AccordionTrigger className="text-lg text-left">Do you offer technician or bulk discounts?</AccordionTrigger>
              <AccordionContent className="text-base text-gray-700">
                Yes, we have special pricing for recurring customers and professionals.
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-10">
              <AccordionTrigger className="text-lg text-left">How long does unlocking take?</AccordionTrigger>
              <AccordionContent className="text-base text-gray-700">
                Most services complete in 1–3 business days, depending on device and service type.
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-11">
              <AccordionTrigger className="text-lg text-left">I forgot my device password. Can you help?</AccordionTrigger>
              <AccordionContent className="text-base text-gray-700">
                Yes, we can help unlock and reactivate your device even if the password is forgotten.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-12">
              <AccordionTrigger className="text-lg text-left">How can I join your community?</AccordionTrigger>
              <AccordionContent className="text-base text-gray-700">
                Join our Telegram group: <a href="https://t.me/iCloudServerGroup" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">iCloudServerGroup</a>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
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
