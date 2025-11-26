
'use client';

import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LoginButton } from '@/components/login-button';
import { Cloud, Twitter, Facebook, Instagram } from 'lucide-react';

export default function ServicesPage() {
  const { data: user } = useUser();
  const router = useRouter();

  const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id);

  const handleUnlockClick = (device: { name: string, price: number }) => {
    const deviceImage = getImage('post-2');
    const params = new URLSearchParams({
        model: device.name,
        price: device.price.toString(),
    });
    if (deviceImage) {
        params.append('image', deviceImage.imageUrl);
    }

    if (!user) {
      router.push(`/login?redirect=/client-portal&${params.toString()}`);
    } else {
      router.push(`/client-portal?${params.toString()}`);
    }
  };

  const iphoneModels = [
    { name: 'iPhone X', price: 35 },
    { name: 'iPhone XR', price: 45 },
    { name: 'iPhone XS', price: 40 },
    { name: 'iPhone XS Max', price: 45 },
    { name: 'iPhone 11', price: 50 },
    { name: 'iPhone 11 Pro', price: 55 },
    { name: 'iPhone 11 Pro Max', price: 55 },
    { name: 'iPhone SE (2020)', price: 50 },
    { name: 'iPhone SE (2022)', price: 60 },
    { name: 'iPhone 12 Mini', price: 55 },
    { name: 'iPhone 12', price: 60 },
    { name: 'iPhone 12 Pro', price: 65 },
    { name: 'iPhone 12 Pro Max', price: 70 },
    { name: 'iPhone 13 Mini', price: 75 },
    { name: 'iPhone 13', price: 80 },
    { name: 'iPhone 13 Pro', price: 85 },
    { name: 'iPhone 13 Pro Max', price: 90 },
    { name: 'iPhone 14', price: 90 },
    { name: 'iPhone 14 Plus', price: 95 },
    { name: 'iPhone 14 Pro', price: 100 },
    { name: 'iPhone 14 Pro Max', price: 110 },
    { name: 'iPhone 15', price: 100 },
    { name: 'iPhone 15 Plus', price: 100 },
    { name: 'iPhone 15 Pro', price: 110 },
    { name: 'iPhone 15 Pro Max', price: 120 },
    { name: 'iPhone 16', price: 120 },
    { name: 'iPhone 16 Plus', price: 120 },
    { name: 'iPhone 16 Pro', price: 125 },
    { name: 'iPhone 16 Pro Max', price: 130 },
  ];

  const macbookModels = [
      { name: 'MacBook (12", 2016–2017)', price: 60 },
      { name: 'MacBook Air (2017–2019 Intel)', price: 80 },
      { name: 'MacBook Air (2020–2022 M1/M2)', price: 150 },
      { name: 'MacBook Air (2023–2024 M2/M3)', price: 140 },
      { name: 'MacBook Pro (2016–2019 Intel)', price: 90 },
      { name: 'MacBook Pro (2020 M1/M1 Pro)', price: 160 },
      { name: 'MacBook Pro (2021–2024 M1 Pro/Max, M2, M3)', price: 180 },
  ];

  const watchModels = [
      { name: 'Series 2 / 3', price: 30, note: 'Clean' },
      { name: 'Series 4 / 5', price: 40, note: 'Clean' },
      { name: 'Series 6 / SE (1st Gen)', price: 50, note: 'Clean' },
      { name: 'Series 8 / SE (2nd Gen)', price: 70, note: 'Clean' },
      { name: 'Series 9', price: 80, note: 'Clean' },
      { name: 'Ultra', price: 90, note: 'Clean' },
      { name: 'Ultra 2', price: 95, note: 'Clean' },
  ];

  const ipadModels = [
      { name: 'iPad (5th / 6th Gen, 2017–2018)', price: 60 },
      { name: 'iPad (7th / 8th Gen, 2019–2020)', price: 65 },
      { name: 'iPad (9th Gen, 2021)', price: 70 },
      { name: 'iPad (10th Gen, 2022–2024)', price: 75 },
      { name: 'iPad Air (3rd Gen, 2019)', price: 70 },
      { name: 'iPad Air (4th Gen, 2020)', price: 80 },
      { name: 'iPad Air (5th Gen, 2022)', price: 85 },
      { name: 'iPad Pro (2017 10.5" & 12.9")', price: 80 },
      { name: 'iPad Pro (2018 Face ID, 11" & 12.9")', price: 90 },
      { name: 'iPad Pro (2020 M1)', price: 100 },
      { name: 'iPad Pro (2021–2024 M1/M2)', price: 110 },
      { name: 'iPad Mini (5th Gen, 2019)', price: 65 },
      { name: 'iPad Mini (6th Gen, 2021)', price: 80 },
  ];

  const logoserverImage = getImage('logoserver');
  const telegramIconImage = getImage('telegram-icon');


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
                        <Link href="/services" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors ring-1 ring-inset ring-primary">Services</Link>
                        <Link href="/orders" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">My Account</Link>
                        <Link href="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Admin</Link>
                        <LoginButton />
                    </div>
                </div>
            </div>
        </div>
      </nav>

      <main className="pt-24">
        <section className="text-center py-12 px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Permanent iCloud Unlock (FMI OFF)</h1>
          <p className="mt-4 text-lg text-gray-600">Works for <strong>Clean</strong>, <strong>Lost with Info</strong>, and <strong>Lost without Info</strong> devices.</p>
        </section>

        <section className="py-12 px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">📱 iPhone Unlock Prices</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                            <tr className="border-b">
                                <th className="p-2">Model</th>
                                <th className="p-2">Price (USD)</th>
                                <th className="p-2"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {iphoneModels.map(device => (
                                <tr key={device.name} className="border-b">
                                <td>{device.name}</td>
                                <td>${device.price}</td>
                                <td><Button size="sm" className="btn-primary text-white" onClick={() => handleUnlockClick(device)}>Unlock iCloud</Button></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">💻 MacBook Unlock Prices (2016 → 2024)</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                            <tr className="border-b">
                                <th className="p-2">Model</th>
                                <th className="p-2">Price (USD)</th>
                                <th className="p-2"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {macbookModels.map(device => (
                                <tr key={device.name} className="border-b">
                                <td>{device.name}</td>
                                <td>${device.price}</td>
                                <td><Button size="sm" className="btn-primary text-white" onClick={() => handleUnlockClick(device)}>Unlock iCloud</Button></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">⌚ Apple Watch Unlock Prices (2016 → 2024)</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                            <tr className="border-b">
                                <th className="p-2">Model</th>
                                <th className="p-2">Price (USD)</th>
                                <th className="p-2"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {watchModels.map(device => (
                                <tr key={device.name} className="border-b">
                                <td>{device.note ? `${device.name} (${device.note})` : device.name}</td>
                                <td>${device.price}</td>
                                <td><Button size="sm" className="btn-primary text-white" onClick={() => handleUnlockClick(device)}>Unlock iCloud</Button></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">📱 iPad Unlock Prices (2016 → 2024)</h2>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                            <tr className="border-b">
                                <th className="p-2">Model</th>
                                <th className="p-2">Price (USD)</th>
                                <th className="p-2"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {ipadModels.map(device => (
                                <tr key={device.name} className="border-b">
                                <td>{device.name}</td>
                                <td>${device.price}</td>
                                <td><Button size="sm" className="btn-primary text-white" onClick={() => handleUnlockClick(device)}>Unlock iCloud</Button></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>

        <section className="text-center py-20 bg-white">
            <h2 className="text-3xl font-bold text-gray-900">Contact Us</h2>
            <p className="mt-4 text-lg text-gray-600">Ready to unlock your device? Get in touch with us today.</p>
            <a href="mailto:info@icloudserver.com">
                <Button className="mt-8 btn-primary text-white px-8 py-4 rounded-lg font-semibold text-lg h-auto">
                    Email Us
                </Button>
            </a>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <div className="text-2xl font-bold text-gradient mb-4 flex items-center gap-2">
                        <Cloud /> iCloud Server
                    </div>
                    <p className="text-gray-400">Professional Apple device unlocking service</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Services</h4>
                    <ul className="space-y-2 text-gray-400">
                        <li><Link href="/services" className="hover:text-white">iPhone Unlock</Link></li>
                        <li><Link href="/services" className="hover:text-white">iPad Unlock</Link></li>
                        <li><Link href="/services" className="hover:text-white">MacBook Unlock</Link></li>
                        <li><Link href="/services" className="hover:text-white">Apple Watch Unlock</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Support</h4>
                    <ul className="space-y-2 text-gray-400">
                        <li><a href="#" className="hover:text-white">Help Center</a></li>
                        <li><a href="#" className="hover:text-white">Contact Us</a></li>
                        <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Follow Us</h4>
                    <div className="flex space-x-4">
                        <a href="#" className="text-gray-400 hover:text-white"><Twitter className="text-xl" /></a>
                        <a href="#" className="text-gray-400 hover:text-white"><Facebook className="text-xl" /></a>
                        <a href="#" className="text-gray-400 hover:text-white"><Instagram className="text-xl" /></a>
                    </div>
                     <a href="https://t.me/iCloudServer" className="text-gray-400 hover:text-white inline-flex items-center mt-4">
                        Telegram
                        {telegramIconImage && (
                        <Image 
                            src={telegramIconImage.imageUrl} 
                            alt="Telegram" 
                            width={18} 
                            height={18}
                            className="ml-2"
                            data-ai-hint="telegram logo"
                        />)}
                    </a>
                </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                 <p>
                    <a href="/terms">Terms & Conditions</a> |
                    <a href="/privacy">Privacy Policy</a> |
                    <a href="/reviews">Reviews</a> |
                    <a href="/contact">Contact Us</a> |
                    <a href="/faq">FAQ</a>
                </p>
                <p className="mt-4">&copy; 2025 iCloud Server. All rights reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
