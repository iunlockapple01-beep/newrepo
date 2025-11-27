
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { LoginButton } from '@/components/login-button';
import { MessageSquare } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-center mb-8">Terms & Conditions – iCloud Server</h1>
          
          <div className="space-y-6 text-lg text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Introduction</h2>
              <p>Welcome to iCloud Server. These Terms and Conditions outline the rules and guidelines for using our services. By accessing or using any part of our platform, you agree to follow these terms. If you do not accept any section of these Terms, please discontinue use of our services.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Services Provided</h2>
              <p>iCloud Server offers professional unlocking solutions for Apple devices, including iPhones, iPads, MacBooks, and Apple Watches. Our services include:</p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Disabling Find My iPhone (FMI OFF)</li>
                <li>Removing previous iCloud accounts</li>
                <li>Restoring device access when activation is blocked</li>
              </ul>
              <p className="mt-2">All processes are performed securely through server-side methods.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Eligibility</h2>
              <p>To use our services, you must:</p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Be at least 18 years old (or have guardian approval)</li>
                <li>Own the device or have verifiable permission from the owner</li>
                <li>Provide accurate and complete device information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Payments</h2>
              <p>We accept secure payments through:</p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Binance Pay</li>
                <li>Bitcoin</li>
                <li>PayPal</li>
                <li>USDT (TRC20)</li>
              </ul>
              <p className="mt-2">Full payment is required before work on your order begins.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Refund Policy</h2>
              <p>Refunds are available ONLY for orders that are rejected or cannot be completed. Refunds are issued via the same payment method used.</p>
              <p className="mt-2">Please allow up to 7 business days for processing.</p>
              <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-800">No Refund Provided For:</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Devices already unlocked before purchase</li>
                <li>Wrong device details submitted by the customer</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Disclaimer</h2>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>You agree not to use iCloud Server for any illegal or unauthorized activity.</li>
                <li>Our service does not involve phishing, hacking, or unlawful security bypass.</li>
                <li>All unlocking is done via verified server systems without jailbreak or extraction of personal data.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Limitation of Liability</h2>
              <p>iCloud Server is not responsible for indirect, incidental, or consequential damages. Our total liability will never exceed the amount paid for a service.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Privacy</h2>
              <p>Your privacy is important to us. Personal information is used solely for completing your unlock request. We do not share your information unless required by law.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Updates to Terms</h2>
              <p>iCloud Server may revise these Terms at any time. Changes take effect immediately once posted on our website. Continued use of our services means you accept the updated Terms.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Governing Law</h2>
              <p>These Terms are governed by the laws of the region in which iCloud Server operates. Any disputes will be handled exclusively through the courts of that jurisdiction.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Contact Us</h2>
              <p>If you have questions regarding these Terms, reach out to us:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li><span className="font-semibold">WhatsApp:</span> <a href="https://wa.me/message/EJ6T3XS4OWK3M1" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://wa.me/message/EJ6T3XS4OWK3M1</a></li>
                <li><span className="font-semibold">Telegram:</span> <a href="https://t.me/iCloudServer" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@iCloudServer</a></li>
              </ul>
            </section>
            
             <p className="text-center pt-6">By using our platform, you confirm that you have read, understood, and agree to these Terms.</p>
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
