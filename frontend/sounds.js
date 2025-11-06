let audioContext = null;
let audioInitialized = false;

function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.debug('Audio context not available:', error);
            return null;
        }
    }
    
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {
        });
    }
    
    return audioContext;
}

function playSound(frequency, duration, type = 'sine', volume = 0.3) {
    try {
        const ctx = initAudioContext();
        if (!ctx) return;
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
        console.debug('Audio not available:', error);
    }
}

const CARD_HOVER_SOUND = 'assets/sounds/mixkit-arcade-game-jump-coin-216.wav';
const CARD_CLICK_SOUND = 'assets/sounds/mixkit-hard-typewriter-click-1119.wav';
const BUTTON_CLICK_SOUND = 'assets/sounds/mixkit-select-click-1109.wav';
const CHAT_MESSAGE_SOUND = 'assets/sounds/mixkit-message-pop-alert-2354.mp3';

let cardHoverAudio = null;
let cardClickAudio = null;
let buttonClickAudio = null;
let chatMessageAudio = null;

let isMuted = false;

function playAudioFile(audioObj, path, volume = 0.5) {
    if (isMuted) return audioObj;
    
    try {
        if (!audioObj) {
            audioObj = new Audio(path);
            audioObj.volume = volume;
        }
        audioObj.currentTime = 0;
        audioObj.play().catch((error) => {
            console.debug('Audio play failed:', error);
        });
        return audioObj;
    } catch (error) {
        console.debug('Audio initialization failed:', error);
        return null;
    }
}

export function playCardHover() {
    cardHoverAudio = playAudioFile(cardHoverAudio, CARD_HOVER_SOUND, 0.4);
}

export function playCardClick() {
    cardClickAudio = playAudioFile(cardClickAudio, CARD_CLICK_SOUND, 0.5);
}

export function playButtonClick() {
    buttonClickAudio = playAudioFile(buttonClickAudio, BUTTON_CLICK_SOUND, 0.5);
}

export function playChatMessage() {
    chatMessageAudio = playAudioFile(chatMessageAudio, CHAT_MESSAGE_SOUND, 0.3);
}

let bgmAudio = null;
let bgmFadeInterval = null;
let bgmStarted = false;
const BGM_VOLUME = 0.4;

let interactionListenersSetup = false;

export function playBGM(forceStart = false) {
    if (isMuted) return;
    
    if (bgmAudio && !bgmAudio.paused && bgmStarted) {
        return;
    }
    
    if (!bgmAudio) {
        try {
            bgmAudio = new Audio('assets/background/bgm.mp3');
            bgmAudio.loop = true;
            bgmAudio.volume = 0;
            bgmAudio.preload = 'auto';
        } catch (error) {
            console.debug('BGM initialization failed:', error);
            bgmStarted = false;
            return;
        }
    }
    
    try {
        const playPromise = bgmAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                bgmStarted = true;
                fadeInBGM(2.0);
                interactionListenersSetup = false;
            }).catch((error) => {
                console.debug('BGM autoplay blocked, will start on user interaction:', error);
                bgmStarted = false;
                
                if (!interactionListenersSetup) {
                    interactionListenersSetup = true;
                    
                    const startOnInteraction = () => {
                        if (bgmAudio && !isMuted) {
                            bgmAudio.play().then(() => {
                                bgmStarted = true;
                                fadeInBGM(2.0);
                                interactionListenersSetup = false;
                            }).catch((err) => {
                                console.debug('BGM play failed on interaction:', err);
                            });
                        }
                        document.removeEventListener('click', startOnInteraction);
                        document.removeEventListener('keydown', startOnInteraction);
                        document.removeEventListener('touchstart', startOnInteraction);
                        document.removeEventListener('mousedown', startOnInteraction);
                    };
                    
                    document.addEventListener('click', startOnInteraction, { once: true });
                    document.addEventListener('keydown', startOnInteraction, { once: true });
                    document.addEventListener('touchstart', startOnInteraction, { once: true });
                    document.addEventListener('mousedown', startOnInteraction, { once: true });
                }
            });
        } else {
            bgmStarted = true;
            fadeInBGM(2.0);
        }
    } catch (error) {
        console.debug('BGM play failed:', error);
        bgmStarted = false;
    }
}

function fadeInBGM(duration = 2.0) {
    if (!bgmAudio) return;
    
    const startVolume = bgmAudio.volume;
    const targetVolume = BGM_VOLUME;
    const startTime = Date.now();
    const durationMs = duration * 1000;
    
    if (bgmFadeInterval) {
        clearInterval(bgmFadeInterval);
    }
    
    bgmFadeInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        
        bgmAudio.volume = startVolume + (targetVolume - startVolume) * progress;
        
        if (progress >= 1) {
            clearInterval(bgmFadeInterval);
            bgmFadeInterval = null;
        }
    }, 50);
}

export function stopBGM(fadeOutDuration = 1.5) {
    if (!bgmAudio) return;
    
    const startVolume = bgmAudio.volume;
    const startTime = Date.now();
    const durationMs = fadeOutDuration * 1000;
    
    if (bgmFadeInterval) {
        clearInterval(bgmFadeInterval);
    }
    
    bgmFadeInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        
        bgmAudio.volume = startVolume * (1 - progress);
        
        if (progress >= 1) {
            bgmAudio.pause();
            bgmAudio.currentTime = 0;
            bgmAudio = null;
            clearInterval(bgmFadeInterval);
            bgmFadeInterval = null;
        }
    }, 50);
}

export function toggleMute() {
    isMuted = !isMuted;
    
    if (isMuted) {
        if (bgmAudio && !bgmAudio.paused) {
            stopBGM(1.0);
        }
    } else {
        if (bgmAudio && bgmStarted) {
            playBGM(true);
        } else {
            playBGM();
        }
    }
    
    return isMuted;
}

export function getMuteState() {
    return isMuted;
}

