
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { LoginButton } from '@/components/login-button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
                 <Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} />
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</Link>
              <Link href="/services" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Services</Link>
              {user && (
                <Link href="/my-account" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">My Account</Link>
              )}
              {isAdmin && (
                <Link href="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Admin</Link>
              )}
              <LoginButton />
            </div>
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="flex flex-col gap-4 p-4">
                    <Link href="/" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">Home</Link>
                    <Link href="/services" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">Services</Link>
                    {user && (
                      <Link href="/my-account" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">My Account</Link>
                    )}
                    {isAdmin && (
                      <Link href="/admin" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">Admin</Link>
                    )}
                    <div className='pt-4'>
                      <LoginButton />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-32 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-lg">
          <h1 className="text-4xl font-bold text-center mb-8">Privacy Policy – iCloud Unlocks</h1>
          
          <div className="space-y-6 text-lg text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Introduction</h2>
              <p>At iCloud Unlocks, we are committed to respecting and protecting your privacy. This policy describes the type of information we collect and how we manage and safeguard it.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Information We Collect</h2>
              <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-800">Personal Information</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Name, email, phone number</li>
                <li>Device identifiers such as IMEI, serial number, and model</li>
                <li>Payment-related information (we do not store full payment details)</li>
              </ul>
              <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-800">Non-Personal Information</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Website usage data</li>
                <li>IP address, browser type, operating system</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">How Your Information Is Used</h2>
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Deliver and improve our unlocking services</li>
                <li>Provide customer support</li>
                <li>Process and verify payments</li>
                <li>Communicate updates and service information</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Sharing of Information</h2>
              <p>We do not sell or trade your information. We may share limited data with:</p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Trusted service partners that assist in service operations</li>
                <li>Authorities if legally required</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Security Measures</h2>
              <p>We use industry-standard practices to protect your data. However, no online system is 100% secure, and we cannot guarantee absolute protection.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Your Rights</h2>
              <p>You may request:</p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Copies of your personal data</li>
                <li>Corrections to inaccurate information</li>
                <li>Deletion of certain data (subject to legal limitations)</li>
                <li>To object to specific types of processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Changes to Policy</h2>
              <p>This Privacy Policy may be updated periodically. New versions will be posted with an updated date.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">Contact Information</h2>
              <p>For privacy-related inquiries:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li><span className="font-semibold">Telegram:</span> <a href="https://t.me/iCloudUnlocks_2023" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@iCloudUnlocks_2023</a></li>
              </ul>
            </section>

            <p className="text-center pt-6">Thank you for trusting iCloud Unlocks.</p>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <div className="mb-4 flex items-center gap-2">
                        <Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} />
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
                        <li><Link href="/unlocking-guide" className="hover:text-white">Unlocking Guide</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Join our Telegram</h4>
                    <a href="https://t.me/iCloudUnlocks2023" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white inline-flex items-center">
                        {telegramIconImage && <Image 
                            src={telegramIconImage.imageUrl} 
                            alt="Telegram Group" 
                            width={18} 
                            height={18}
                            className="mr-2"
                        />}
                        Telegram Channel
                    </a>
                    <h4 className="font-semibold mb-4 mt-4">Contact Us</h4>
                     <a href="https://t.me/iCloudUnlocks_2023" className="text-gray-400 hover:text-white inline-flex items-center mb-2">
                        {telegramIconImage && <Image 
                             src={telegramIconImage.imageUrl} 
                            alt="Telegram" 
                            width={18} 
                            height={18}
                            className="mr-2"
                        />}
                        Contact us on Telegram
                    </a>
                </div>
            </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2023 iCloud Unlocks. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
