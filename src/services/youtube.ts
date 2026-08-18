/**
 * 비디오 URL 파싱 및 플랫폼별 임베드/썸네일 유틸리티
 * - YouTube, Instagram, Vimeo 등 다양한 영상 플랫폼 지원
 */

const YOUTUBE_REGEX = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
const INSTAGRAM_REGEX = /(?:instagram\.com|instagr\.am)\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/;
const VIMEO_REGEX = /(?:vimeo\.com\/)(\d+)/;

export type VideoPlatform = 'youtube' | 'instagram' | 'vimeo' | 'other';

export const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(YOUTUBE_REGEX);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const getInstagramId = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(INSTAGRAM_REGEX);
    return match ? match[1] : null;
};

export const getVimeoId = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(VIMEO_REGEX);
    return match ? match[1] : null;
};

export const getVideoPlatform = (url: string): VideoPlatform => {
    if (!url) return 'other';
    if (getYouTubeId(url)) return 'youtube';
    if (getInstagramId(url)) return 'instagram';
    if (getVimeoId(url)) return 'vimeo';
    return 'other';
};

/**
 * 플랫폼별 최적화된 임베드 URL 반환
 */
export const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) return '';
    
    // 1. YouTube
    const ytId = getYouTubeId(url);
    if (ytId) {
        return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`;
    }
    
    // 2. Instagram
    const instaId = getInstagramId(url);
    if (instaId) {
        return `https://www.instagram.com/p/${instaId}/embed/captioned/`;
    }

    // 3. Vimeo
    const vimeoId = getVimeoId(url);
    if (vimeoId) {
        return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
    }

    return url;
};

/**
 * 플랫폼별 썸네일 이미지 URL 생성
 */
export const getYouTubeThumbnail = (url: string): string => {
    if (!url) return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1470&auto=format&fit=crop';
    
    // 1. YouTube
    const ytId = getYouTubeId(url);
    if (ytId) {
        return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    }

    // 2. Instagram
    const instaId = getInstagramId(url);
    if (instaId) {
        // 인스타그램 미디어 썸네일 리다이렉트 엔드포인트
        return `https://www.instagram.com/p/${instaId}/media/?size=l`;
    }

    return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1470&auto=format&fit=crop';
};
