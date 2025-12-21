
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { LoginButton } from '@/components/login-button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function UnlockingGuidePage() {
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
          <h1 className="text-4xl font-bold text-center mb-8">Detailed Explanation of Our Unlocking Process</h1>
          
          <div className="space-y-6 text-lg text-gray-700 prose lg:prose-xl max-w-none">
            <p>Dear Valued Clients,</p>
            <p>Here’s a clear and comprehensive guide to our unlocking process:</p>

            <section>
                <h2 className="font-semibold text-gray-900">1. IMEI or Serial Number Submission</h2>
                <p>On the services page, you will find a list of supported device models. Select the model you wish to unlock, enter the IMEI or Serial Number, and click the Check button. Our server will verify the details and provide full information about your device, including whether it is eligible for unlock.</p>
            </section>
            
            <section>
                <h2 className="font-semibold text-gray-900">2. Payment</h2>
                <p>Once device support is confirmed, you can proceed with the unlock and make the required payment. We support several secure payment methods, including:</p>
                <ul>
                    <li><strong>USDT (BEP20)</strong> – Highly recommended. Payment is made directly to the server’s address with no additional fees.</li>
                    <li>Binance Bitcoin</li>
                    <li>Other crypto payments</li>
                    <li>Skrill</li>
                </ul>
                <p>Please note: For payment methods other than USDT BEP20, additional fees may apply.</p>
            </section>

            <section>
                <h2 className="font-semibold text-gray-900">3. Registration</h2>
                <p>After your payment is confirmed, we register your device’s IMEI or Serial Number with our official unlock service provider. This is a crucial step that initiates the unlocking process. Registration may take some time—up to 24 hours—as it depends on server queues and processing times.</p>
            </section>

            <section>
                <h2 className="font-semibold text-gray-900">4. Unlock and Activation</h2>
                <p>Once registration is complete, we activate your device. During this stage:</p>
                <ul>
                    <li>Find My iPhone (FMI) is turned off</li>
                    <li>Activation Lock is permanently removed</li>
                </ul>
                <p>This ensures the device is ready for setup.</p>
            </section>

            <section>
                <h2 className="font-semibold text-gray-900">5. Firmware Restoration (If Required)</h2>
                <p>If your device is passcode-locked, disabled, unavailable, or in lost mode, it may require a full firmware restoration. This process uses fresh IPSW firmware and a Windows or macOS PC with tools such as 3uTools or iTunes.</p>
                <p>If you're unfamiliar with this procedure, we will guide you step-by-step through downloading and installing the correct firmware from official sources to ensure a smooth restoration.</p>
            </section>

            <section>
                <h2 className="font-semibold text-gray-900">6. Devices on Activation Lock / Hello Screen</h2>
                <p>If your device is already on the Activation Lock or Hello screen, a full restore may not be necessary. Simply:</p>
                <ul>
                    <li>Go to Connect to Wi-Fi,</li>
                    <li>Connect to your network,</li>
                    <li>Allow the device to refresh its iCloud status.</li>
                </ul>
                <p>Once FMI has been turned off on our side, you will be able to skip the Activation Lock, as the previous owner’s account will be completely removed.</p>
            </section>

            <section>
                <h2 className="font-semibold text-gray-900">7. Final Setup</h2>
                <p>After the unlock is completed, you can set up your device normally and sign in with a new iCloud account. The device will no longer be linked to the previous owner, giving you full access and control.</p>
            </section>

            <section>
                <h2 className="font-semibold text-gray-900">8. Technical Support</h2>
                <p>Our dedicated support team is available throughout the process to assist you with any questions or technical issues. We ensure that your unlocking experience is smooth, transparent, and stress-free.</p>
            </section>

            <section>
                <h2 className="font-semibold text-gray-900">A Safe, Permanent Unlock</h2>
                <p>Our unlock solution is:</p>
                <ul>
                    <li>Permanent</li>
                    <li>Safe</li>
                    <li>Reliable</li>
                    <li>Free from phishing, jailbreaking, or bypass methods</li>
                </ul>
                <p>We pride ourselves on offering professional and legitimate services.</p>
            </section>

            <p>If you have any questions or need further assistance, please feel free to contact us.</p>
            <p>Your satisfaction and peace of mind are our priorities. Thank you for choosing icloud unlocks!</p>

            <p>Best regards,<br/>The icloud unlocks Team</p>

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
