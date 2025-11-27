
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { LoginButton } from '@/components/login-button';
import { MessageSquare } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function RefundPolicyPage() {
  const { data: user } = useUser();
  const isAdmin = user?.email === 'iunlockapple01@gmail.com';
  const telegramIconImage = PlaceHolderImages.find(img => img.id === 'telegram-icon');

  return (
    <div className="bg-gray-50 text-gray-800">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <Image src="https://i.postimg.cc/05hC7gM8/logo.png" alt="iCloud Server Logo" width={140} height={40} />
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
          <h1 className="text-4xl font-bold text-center mb-8">Refund Policy – iCloud Server</h1>
          
          <div className="space-y-6 text-lg text-gray-700 prose lg:prose-xl max-w-none">
            <p>At iCloud Server, we value transparency, fairness, and customer satisfaction. Our refund policy is designed to protect both the client and the service provider while ensuring a smooth unlocking experience.</p>
            
            <section>
              <h2 className="font-semibold text-gray-900">1. Eligibility for Refund</h2>
              <p>A refund is issued only if the unlock process is not completed due to reasons from our side or server-side limitations. Refunds apply in the following cases:</p>
              <ul>
                <li>The device fails to unlock after successful registration.</li>
                <li>The server marks the service as Rejected, Unsupported, or Failed.</li>
                <li>We determine that the device is not eligible for unlocking after payment was made.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-gray-900">2. Non-Refundable Situations</h2>
              <p>A refund will not be issued in the following cases:</p>
               <ul>
                <li>The client provides wrong IMEI or serial number.</li>
                <li>The device changes status (e.g., new iCloud lock, lost mode, blacklisted) after the order is placed.</li>
                <li>The client restores, erases, or attempts third-party bypasses, causing conflicts during the unlock process.</li>
                <li>The client cancels the order while the unlock is already in progress or registration is completed.</li>
                <li>The client fails to follow instructions for device activation after FMI is turned off.</li>
              </ul>
            </section>

             <section>
                <h2 className="font-semibold text-gray-900">3. Refund Method</h2>
                <p>Refunds are sent using the same payment method used during the transaction.</p>
                <p>Crypto refunds (USDT, BTC, ETH) are returned exactly as received, except:</p>
                <ul>
                    <li>Network fees are deducted.</li>
                    <li>Refund is based on value received, not current market price.</li>
                </ul>
            </section>

             <section>
                <h2 className="font-semibold text-gray-900">4. Processing Time</h2>
                <p>Refunds are processed within 1–48 hours, depending on verification and network confirmation times for crypto payments.</p>
            </section>
            
             <section>
                <h2 className="font-semibold text-gray-900">5. Device Status Verification</h2>
                <p>Before approving any refund, we will:</p>
                 <ul>
                    <li>Check server logs.</li>
                    <li>Verify registration results.</li>
                    <li>Confirm unlock attempt records.</li>
                </ul>
                <p>This ensures fairness and prevents misuse.</p>
            </section>

            <section>
                <h2 className="font-semibold text-gray-900">6. Technical Issues</h2>
                <p>If an unlock delay occurs due to:</p>
                 <ul>
                    <li>Server maintenance</li>
                    <li>System congestion</li>
                    <li>Extended registration times</li>
                </ul>
                <p>We may request additional time before initiating a refund. Most unlocks complete successfully, so patience is appreciated.</p>
            </section>

            <section>
                <h2 className="font-semibold text-gray-900">7. Integrity & Security</h2>
                 <ul className="list-disc list-inside">
                    <li>We do not store or request personal information from previous owners.</li>
                    <li>Your device details remain confidential and are used strictly for unlocking purposes.</li>
                </ul>
            </section>
            
            <section>
                <h2 className="font-semibold text-gray-900">8. Contact for Refunds</h2>
                <p>To request a refund, contact us with:</p>
                 <ul>
                    <li>Order ID</li>
                    <li>IMEI/Serial</li>
                    <li>Payment screenshot</li>
                    <li>A brief explanation</li>
                </ul>
                <p>Our team will review and respond promptly.</p>
            </section>

          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <div className="mb-4 flex items-center gap-2">
                        <Image src="https://i.postimg.cc/05hC7gM8/logo.png" alt="iCloud Server Logo" width={140} height={40} />
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
