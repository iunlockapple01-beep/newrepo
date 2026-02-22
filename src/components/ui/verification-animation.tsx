'use client';

import { useEffect, useRef } from 'react';

const icons = {
    iphone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="3" width="12" height="18" rx="2.5"></rect><line x1="12" y1="17" x2="12" y2="17.01"></line></svg>`,
    ipad: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2.5"></rect><line x1="12" y1="18" x2="12" y2="18.01"></line></svg>`,
    watch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 18h.01"></path><path d="M12 6h.01"></path><rect x="7" y="5" width="10" height="14" rx="3"></rect></svg>`,
    macbook: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2z"></path><line x1="2" y1="17" x2="22" y2="17"></line></svg>`,
    imac: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M9 16v4"></path><path d="M15 16v4"></path><path d="M9 20h6"></path></svg>`
};

const deviceTypes = Object.keys(icons);

interface Device {
    el: HTMLDivElement;
    cloneEl: HTMLDivElement;
    px: number;
    py: number;
    size: number;
    type: string;
    id: number;
}

export function VerificationAnimation() {
    const sceneRef = useRef<HTMLDivElement>(null);
    const devicesLayerRef = useRef<HTMLDivElement>(null);
    const lensRef = useRef<HTMLDivElement>(null);
    const lensContentRef = useRef<HTMLDivElement>(null);
    const statusTextRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);

    const devicesRef = useRef<Device[]>([]);
    const lensPosRef = useRef({ x: 0, y: 0 });
    const targetPosRef = useRef({ x: 0, y: 0 });
    const animationFrameId = useRef<number>();
    const currentTargetIndexRef = useRef(0);
    const scanStartTimeRef = useRef(0);

    useEffect(() => {
        const scene = sceneRef.current;
        const devicesLayer = devicesLayerRef.current;
        const lens = lensRef.current;
        const lensContent = lensContentRef.current;
        const statusText = statusTextRef.current;
        const progressBar = progressBarRef.current;

        if (!scene || !devicesLayer || !lens || !lensContent || !statusText || !progressBar) return;

        const deviceCount = 24;
        const scanDuration = 1200;
        const moveSpeed = 0.035;
        const lensRadius = 80;
        const zoomScale = 1.6;
        let sceneBounds = { width: 0, height: 0 };

        const updateSceneBounds = () => {
            const rect = scene.getBoundingClientRect();
            sceneBounds.width = rect.width;
            sceneBounds.height = rect.height;
        };

        const pickNewTarget = () => {
            if (devicesRef.current.length === 0) return;
            let nextIndex;
            let attempts = 0;
            do {
                nextIndex = Math.floor(Math.random() * devicesRef.current.length);
                attempts++;
            } while (nextIndex === currentTargetIndexRef.current && devicesRef.current.length > 1 && attempts < 10);
            
            currentTargetIndexRef.current = nextIndex;
            const device = devicesRef.current[nextIndex];
            targetPosRef.current = { x: device.px, y: device.py };
            scanStartTimeRef.current = Date.now();
        };

        const createDevices = () => {
            const padding = 70;
            const minDistance = 75;
            
            for (let i = 0; i < deviceCount; i++) {
                const type = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
                let x, y, validPosition;
                let attempts = 0;
                
                do {
                    validPosition = true;
                    x = padding + Math.random() * (sceneBounds.width - padding * 2);
                    y = padding + Math.random() * (sceneBounds.height - padding * 2);
                    
                    for (let device of devicesRef.current) {
                        const dx = x - device.px;
                        const dy = y - device.py;
                        if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
                            validPosition = false;
                            break;
                        }
                    }
                    attempts++;
                } while (!validPosition && attempts < 100);
                
                if (!validPosition) continue;
                
                const size = 28 + Math.random() * 14;
                
                const el = document.createElement('div');
                el.className = 'device-icon absolute text-slate-400';
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;
                el.style.width = `${size}px`;
                el.style.height = `${size}px`;
                el.innerHTML = icons[type as keyof typeof icons];
                el.style.animation = `float ${4 + Math.random() * 3}s ease-in-out infinite`;
                el.style.animationDelay = `${Math.random() * 3}s`;
                devicesLayer.appendChild(el);
                
                const cloneEl = document.createElement('div');
                cloneEl.className = 'device-icon absolute text-blue-600';
                cloneEl.style.width = `${size}px`;
                cloneEl.style.height = `${size}px`;
                cloneEl.innerHTML = icons[type as keyof typeof icons];
                cloneEl.style.opacity = '0';
                cloneEl.style.transition = 'opacity 0.3s ease';
                lensContent.appendChild(cloneEl);
                
                devicesRef.current.push({ el, cloneEl, px: x, py: y, size, type, id: i });
            }
            pickNewTarget();
        };

        const animate = () => {
            const now = Date.now();
            let lensPos = lensPosRef.current;
            let targetPos = targetPosRef.current;

            lensPos.x += (targetPos.x - lensPos.x) * moveSpeed;
            lensPos.y += (targetPos.y - lensPos.y) * moveSpeed;

            const minX = lensRadius, maxX = sceneBounds.width - lensRadius;
            const minY = lensRadius, maxY = sceneBounds.height - lensRadius;
            lensPos.x = Math.max(minX, Math.min(maxX, lensPos.x));
            lensPos.y = Math.max(minY, Math.min(maxY, lensPos.y));

            lens.style.transform = `translate(${lensPos.x - lensRadius}px, ${lensPos.y - lensRadius}px)`;

            const lensContentX = -lensPos.x * zoomScale + lensRadius;
            const lensContentY = -lensPos.y * zoomScale + lensRadius;
            lensContent.style.transform = `translate(${lensContentX}px, ${lensContentY}px) scale(${zoomScale})`;

            devicesRef.current.forEach(device => {
                const dx = lensPos.x - device.px;
                const dy = lensPos.y - device.py;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                device.cloneEl.style.left = `${device.px}px`;
                device.cloneEl.style.top = `${device.py}px`;
                
                if (distance < lensRadius * 0.6) {
                    device.el.classList.remove('inactive');
                    device.el.classList.add('active-scan');
                    device.cloneEl.style.opacity = '1';
                } else {
                    device.el.classList.remove('active-scan');
                    device.el.classList.add('inactive');
                    device.cloneEl.style.opacity = '0';
                }
            });

            const dist = Math.hypot(targetPos.x - lensPos.x, targetPos.y - lensPos.y);
            const timeScanned = now - scanStartTimeRef.current;
            
            if (dist < 15 && timeScanned > scanDuration) pickNewTarget();
            if (timeScanned > scanDuration * 3) pickNewTarget();

            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        let dots = 0;
        const textInterval = setInterval(() => {
            dots = (dots + 1) % 4;
            statusText.innerText = "Checking" + ".".repeat(dots);
        }, 500);

        const progressInterval = setInterval(() => {
            const width = parseFloat(progressBar.style.width) || 0;
            if (width >= 100) {
                progressBar.style.width = '0%';
                progressBar.style.transition = 'none';
                setTimeout(() => {
                    progressBar.style.transition = 'all 500ms ease-out';
                }, 50);
            } else {
                progressBar.style.width = (width + 0.5) + '%';
            }
        }, 150);

        const init = () => {
            updateSceneBounds();
            createDevices();
            if (devicesRef.current.length > 0) {
                const firstDevice = devicesRef.current[0];
                lensPosRef.current = { x: firstDevice.px, y: firstDevice.py };
                targetPosRef.current = { x: firstDevice.px, y: firstDevice.py };
            }
            animationFrameId.current = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            devicesLayer.innerHTML = '';
            lensContent.innerHTML = '';
            devicesRef.current = [];
            init();
        };

        init();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            clearInterval(textInterval);
            clearInterval(progressInterval);
        };
    }, []);

    return (
        <div className="main-container">
            <div className="bg-grid"></div>
            <div ref={sceneRef} className="scene-area">
                <div ref={devicesLayerRef} className="absolute inset-0 w-full h-full"></div>
                <div ref={lensRef} className="absolute w-40 h-40 z-20 flex items-center justify-center pointer-events-none will-change-transform">
                    <div className="lens-handle"></div>
                    <div className="lens-overlay">
                        <div ref={lensContentRef} className="lens-content"></div>
                        <div className="absolute inset-0 rounded-full overflow-hidden opacity-60">
                            <div className="scan-line"></div>
                        </div>
                    </div>
                    <div className="lens-rim"></div>
                    <div className="lens-inner-ring"></div>
                    <div className="lens-dashed-ring"></div>
                    <div className="absolute bottom-9 text-[8px] mono-font font-medium text-blue-600/70 tracking-[0.2em] uppercase z-30">
                        Scanning
                    </div>
                    <div className="absolute w-full h-[1px] bg-blue-500/20 z-30"></div>
                    <div className="absolute h-full w-[1px] bg-blue-500/20 z-30"></div>
                    <div className="absolute w-2 h-2 border border-blue-500/30 rounded-full z-30"></div>
                </div>
            </div>
            <div className="flex flex-col items-center pb-8 space-y-4 z-30">
                <div ref={statusTextRef} className="mono-font text-slate-500 text-sm font-medium tracking-wide">Checking</div>
                <div className="progress-container">
                    <div ref={progressBarRef} className="progress-fill w-0 transition-all duration-500 ease-out rounded-full"></div>
                </div>
            </div>
        </div>
    );
}
