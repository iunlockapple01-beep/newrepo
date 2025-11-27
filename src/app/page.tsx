
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Clock, MessageSquare, Users, LockOpen } from 'lucide-react';
import { LoginButton } from '@/components/login-button';
import { useUser } from '@/firebase';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';


const ADMIN_EMAIL = 'iunlockapple01@gmail.com';

const reviews = [
  {
    name: 'Emma R.',
    avatarUrl: 'https://picsum.photos/seed/emma/40/40',
    flag: '🇬🇧',
    date: 'May 20, 2024',
    images: [
      'https://picsum.photos/seed/review1a/200/300',
      'https://picsum.photos/seed/review1b/200/300'
    ],
    review: '"Absolutely thrilled with iCloud Server! My iPad Air 2 was unlocked incredibly fast. The process was straightforward, and their customer service was very helpful. Highly recommend for anyone needing a reliable unlock service. Thank you!"',
    unlockedDevice: 'iPad Air 2',
    imageHints: ['keypad', 'security']
  },
  {
    name: 'Michael S.',
    avatarUrl: 'https://picsum.photos/seed/michael/40/40',
    flag: '🇺🇸',
    date: 'April 15, 2024',
    images: [
      'https://picsum.photos/seed/review2a/200/300',
      'https://picsum.photos/seed/review2b/200/300'
    ],
    review: '"iCloud Server is truly reliable. I had an iPhone XS Max that needed unlocking, and they delivered exactly as promised. The support team was fantastic, guiding me through everything. A seamless and trustworthy experience from start to finish. Very satisfied!"',
    unlockedDevice: 'iPhone XS Max',
    imageHints: ['keypad', 'security']
  },
  {
    name: 'David K.',
    avatarUrl: 'https://picsum.photos/seed/david/40/40',
    flag: '🇰🇪',
    date: 'June 01, 2024',
    images: [
      'https://picsum.photos/seed/review3a/200/300',
      'https://picsum.photos/seed/review3b/200/300'
    ],
    review: '"My iPhone 11 Pro was unlocked in no time! I was skeptical at first, but iCloud Server proved to be super efficient and reliable. The instructions were clear, and I got my device working perfectly. Excellent service, highly recommended to everyone!"',
    unlockedDevice: 'iPhone 11 Pro',
    imageHints: ['keypad', 'security']
  },
    {
    name: 'Sofia G.',
    avatarUrl: 'https://picsum.photos/seed/sofia/40/40',
    flag: '🇪🇸',
    date: 'May 05, 2024',
    images: [
      'https://picsum.photos/seed/review4a/200/300',
      'https://picsum.photos/seed/review4b/200/300'
    ],
    review: '"Fantastic service for my Apple Watch Series 6! iCloud Server provided a super fast and secure unlock. Their customer service was excellent, answering all my questions promptly. I am very impressed with their professionalism and highly recommend them!"',
    unlockedDevice: 'Apple Watch Series 6',
    imageHints: ['keypad', 'security']
  },
  {
    name: 'Liam B.',
    avatarUrl: 'https://picsum.photos/seed/liam/40/40',
    flag: '🇨🇦',
    date: 'June 10, 2024',
    images: [
      'https://picsum.photos/seed/review5a/200/300',
      'https://picsum.photos/seed/review5b/200/300'
    ],
    review: '"Top-notch service! My MacBook Pro was stuck on the iCloud activation screen, and they unlocked it within a day. Communication was excellent throughout. I\'m amazed at how simple they made it. Will definitely use again if needed."',
    unlockedDevice: 'MacBook Pro 14"',
    imageHints: ['laptop', 'desk']
  },
  {
    name: 'Aisha N.',
    avatarUrl: 'https://picsum.photos/seed/aisha/40/40',
    flag: '🇳🇬',
    date: 'June 08, 2024',
    images: [
      'https://picsum.photos/seed/review6a/200/300',
      'https://picsum.photos/seed/review6b/200/300'
    ],
    review: '"I was about to give up on my old iPhone 12, but iCloud Server came to the rescue. The unlock was successful, and the price was very reasonable. The entire process felt secure and professional. Thank you so much for your help!"',
    unlockedDevice: 'iPhone 12',
    imageHints: ['phone', 'hand']
  },
  {
    name: 'Chloe L.',
    avatarUrl: 'https://picsum.photos/seed/chloe/40/40',
    flag: '🇦🇺',
    date: 'May 28, 2024',
    images: [
      'https://picsum.photos/seed/review7a/200/300',
      'https://picsum.photos/seed/review7b/200/300'
    ],
    review: '"Unlocking my iPad Pro was a breeze with iCloud Server. The team was responsive and kept me updated. It\'s great to have my device fully functional again. I couldn\'t be happier with the outcome. Highly trustworthy and efficient service!"',
    unlockedDevice: 'iPad Pro 11"',
    imageHints: ['tablet', 'creative']
  },
  {
    name: 'Kenji T.',
    avatarUrl: 'https://picsum.photos/seed/kenji/40/40',
    flag: '🇯🇵',
    date: 'June 12, 2024',
    images: [
      'https://picsum.photos/seed/review8a/200/300',
      'https://picsum.photos/seed/review8b/200/300'
    ],
    review: '"My Apple Watch SE had been locked for months. I found iCloud Server and decided to give them a try. Best decision ever! The unlock was quick and flawless. Their support is world-class. I highly recommend their services to everyone!"',
    unlockedDevice: 'Apple Watch SE',
    imageHints: ['smartwatch', 'lifestyle']
  }
];

const services = [
    {
      title: 'iPhone iCloud Unlock',
      description: 'We provide reliable solutions to remove iCloud locks from all iPhone models.',
      imageUrl: 'https://i.postimg.cc/8Cx2qKXT/iphone.jpg',
      deviceName: 'iPhone',
    },
    {
      title: 'iPad Unlock',
      description: 'Unlock your iPad easily and regain full access to your Apple ecosystem.',
      imageUrl: 'https://i.postimg.cc/XvZM1SLq/ipades.jpg',
      deviceName: 'iPad',
    },
    {
      title: 'MacBook Unlock',
      description: 'Get professional iCloud lock removal for MacBooks and access your data again.',
      imageUrl: 'https://i.postimg.cc/XqwP5n8B/mac1.png',
      deviceName: 'MacBook',
    },
    {
      title: 'Apple Watch Unlock',
      description: 'We also handle iCloud unlocks for all Apple Watch series quickly and securely.',
      imageUrl: 'https://i.postimg.cc/wBnCSf4v/watch.png',
      deviceName: 'Apple Watch',
    },
];

const AnimatedCounter = ({ endValue, duration = 2000, label, icon: Icon }: { endValue: number, duration?: number, label: string, icon: React.ElementType }) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    let start = 0;
                    const end = endValue;
                    if (start === end) return;

                    const totalMiliseconds = duration;
                    const
                        incrementTime = (totalMiliseconds / end) * 0.1;
                    
                    const timer = setInterval(() => {
                        start += Math.ceil(end / (totalMiliseconds / incrementTime) * 0.1);
                        if (start >= end) {
                            setCount(end);
                            clearInterval(timer);
                        } else {
                            setCount(start);
                        }
                    }, incrementTime);

                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [endValue, duration]);
    
    return (
        <div ref={ref} className="bg-white/10 backdrop-blur-sm p-4 rounded-lg text-center border border-white/20">
            <Icon className="h-8 w-8 mx-auto mb-2 text-white" />
            <p className="text-3xl font-bold">{Math.round(count).toLocaleString()}+</p>
            <p className="text-sm uppercase tracking-wider">{label}</p>
        </div>
    );
};


export default function IcloudServerPage() {
  const { data: user } = useUser();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const { toast } = useToast();
  const telegramIconImage = PlaceHolderImages.find(img => img.id === 'telegram-icon');

  const handleAddReviewClick = () => {
    const { id, dismiss } = toast({
        title: "Unable to Add Review",
        description: "You must have a completed unlock order with us to leave a review.",
    });

    setTimeout(() => {
        dismiss();
    }, 3000);
  };
  
  const [counters, setCounters] = useState({ users: 5378, devices: 9378 });

  useEffect(() => {
      const startDate = new Date('2024-01-01');
      const today = new Date();
      const timeDiff = today.getTime() - startDate.getTime();
      const daysPassed = Math.floor(timeDiff / (1000 * 3600 * 24));
      
      const registeredUsers = 5378 + Math.floor(daysPassed * 3.5); // avg of 2-5
      const unlockedDevices = 9378 + Math.floor(daysPassed * 9.5); // avg of 6-13

      setCounters({ users: registeredUsers, devices: unlockedDevices });
  }, []);

  return (
    <div className="bg-gray-50">
      {/* Navigation */}
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <Image src="https://i.postimg.cc/tCm66wrX/no-background.png" alt="iCloud Server Logo" width={90} height={24} />
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
                <LoginButton />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center apple-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            Professional iCloud Unlocking Service
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 animate-fade-in">
            Unlock your Apple devices safely and professionally. We support iPhones, iPads, MacBooks, and Apple Watches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in mb-8">
            <Link href="/services">
                <Button className="btn-primary text-white px-8 py-4 rounded-lg font-semibold text-lg h-auto">
                    View Services
                </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-md mx-auto animate-fade-in">
             <AnimatedCounter endValue={counters.users} label="Registered Users" icon={Users} />
             <AnimatedCounter endValue={counters.devices} label="Unlocked Devices" icon={LockOpen} />
          </div>
        </div>
      </section>

      {/* Services Section */}
        <section id="services" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
                    <p className="text-xl text-gray-600">Professional unlocking for all Apple devices</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {services.map((service, index) => (
                      <Link href="/services" key={index} className="block">
                        <div className="bg-gray-100 rounded-2xl p-6 text-center hover-lift h-full flex flex-col">
                            <div className="relative h-40 w-full mb-4 rounded-lg overflow-hidden">
                                <Image
                                    src={service.imageUrl}
                                    alt={service.title}
                                    layout="fill"
                                    objectFit="contain"
                                />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                            <p className="text-gray-600 mb-4 flex-grow">{service.description}</p>
                            <Button className="w-full btn-primary text-white py-2 rounded-lg mt-auto">
                                Unlock Now
                            </Button>
                        </div>
                      </Link>
                    ))}
                </div>
            </div>
        </section>

      {/* Reviews Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
            <p className="text-xl text-gray-600">Trusted by thousands of customers worldwide</p>
          </div>
          <div className="text-center mb-16">
            <Button onClick={handleAddReviewClick} className="btn-primary text-white">Add review</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map((review, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 md:w-1/3">
                    <div className="flex items-center mb-3">
                      <Image src={review.avatarUrl} alt={review.name} width={40} height={40} className="rounded-full mr-3" />
                      <div>
                        <p className="font-semibold text-gray-900 flex items-center">{review.name} <span className="ml-2">{review.flag}</span></p>
                        <p className="text-xs text-gray-500">Reviewed on: {review.date}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                        <Image src={review.images[0]} alt="Review image 1" layout="fill" objectFit="cover" data-ai-hint={review.imageHints.join(' ')} />
                      </div>
                       <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                        <Image src={review.images[1]} alt="Review image 2" layout="fill" objectFit="cover" data-ai-hint={review.imageHints.join(' ')} />
                      </div>
                    </div>
                </div>
                <div className="flex flex-col">
                    <p className="text-gray-700 text-sm mb-4 flex-grow">{review.review}</p>
                    <p className="text-sm font-semibold text-gray-500 mt-auto">Unlocked: {review.unlockedDevice}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-xl text-gray-600">We're here to help you</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Get in Touch</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 apple-gradient rounded-lg flex items-center justify-center mr-4">
                    <Mail className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Email</p>
                    <p className="text-gray-600">support@icloudserver.com</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 apple-gradient rounded-lg flex items-center justify-center mr-4">
                    <Phone className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Phone</p>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 apple-gradient rounded-lg flex items-center justify-center mr-4">
                    <Clock className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Hours</p>
                    <p className="text-gray-600">24/7 Support</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                <input type="text" placeholder="Your Name" className="w-full form-input rounded-lg px-4 py-3 h-auto" />
                <input type="email" placeholder="Your Email" className="w-full form-input rounded-lg px-4 py-3 h-auto" />
                <textarea placeholder="Your Message" rows={4} className="w-full form-input rounded-lg px-4 py-3" />
                <Button type="submit" className="w-full btn-primary text-white py-3 rounded-lg font-semibold h-auto">
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <div className="mb-4 flex items-center gap-2">
                        <Image src="https://i.postimg.cc/tCm66wrX/no-background.png" alt="iCloud Server Logo" width={90} height={24} />
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
