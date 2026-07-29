import React, { useState } from 'react';
import { useSiteTexts } from '../../hooks/useSiteTexts';
import EditableText from '../EditableText';
import InquiryModal from './InquiryModal';

const Contact: React.FC = () => {
  const { texts } = useSiteTexts();
  const [showToast, setShowToast] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  const handleEmailClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // 클립보드에 이메일 주소 복사
    if (texts.contactEmail) {
      navigator.clipboard.writeText(texts.contactEmail);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    }
  };

  return (
    // 전체 컨테이너: 텍스트 중앙 정렬(text-center) 및 좌우 패딩(px-6)
    <div className="w-full px-6 text-center relative">
      
      {/* 이메일 복사 완료 토스트 알림 */}
      {showToast && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[9999] bg-slate-900 text-white text-xs px-6 py-3.5 rounded-xl shadow-2xl tracking-wider animate-in fade-in slide-in-from-top-4 duration-300 border border-slate-800">
          📬 이메일 주소가 복사되었습니다! ({texts.contactEmail})
        </div>
      )}

      {/* 1. 섹션 헤더 영역 */}
      {/* 제목: CONTACT (반응형 폰트 크기 적용) */}
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-slate-900 mb-6 md:mb-8">CONTACT</h2>
      {/* 서브 텍스트: 협업 제안 메시지 (연한 회색, 얇은 폰트) */}
      <div className="mb-12 md:mb-16">
        <EditableText textKey="contactSubText" className="text-slate-400 text-xs md:text-sm font-light tracking-tight" as="p" />
      </div>

      {/* 2. 소셜 미디어 아이콘 링크 영역 */}
      <div className="flex justify-center items-center space-x-8 md:space-x-16">

        {/* A. 이메일 (mailto 링크 + 클릭 시 클립보드 자동 복사) */}
        <a 
          href={`mailto:${texts.contactEmail}`} 
          onClick={handleEmailClick}
          className="group cursor-pointer" 
          aria-label="Email"
          title="이메일 보내기 및 주소 복사"
        >
          <div className="flex items-center justify-center transition-all duration-500 transform group-hover:scale-125">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-slate-300 transition-colors duration-500 group-hover:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </a>

        {/* B. 인스타그램 (새 탭으로 열기) */}
        <a href={texts.contactInstagram} target="_blank" rel="noopener noreferrer" className="group" aria-label="Instagram">
          <div className="flex items-center justify-center transition-all duration-500 transform group-hover:scale-125">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-slate-300 transition-colors duration-500 group-hover:text-slate-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </div>
        </a>

        {/* C. 유튜브 (새 탭으로 열기) */}
        <a href={texts.contactYoutube} target="_blank" rel="noopener noreferrer" className="group" aria-label="YouTube">
          <div className="flex items-center justify-center transition-all duration-500 transform group-hover:scale-125">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-slate-300 transition-colors duration-500 group-hover:text-slate-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
        </a>

        {/* D. 비메오 (비활성) */}
        <span className="group cursor-not-allowed opacity-40" aria-label="Vimeo (준비 중)">
          <div className="flex items-center justify-center">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.396 7.158c-.093 2.026-1.507 4.799-4.245 8.32C15.477 18.961 13.028 20.71 10.9 20.71c-1.314 0-2.424-1.213-3.33-3.64l-1.81-6.623c-.682-2.5-1.414-3.75-2.193-3.75-.155 0-.696.325-1.62.977l-.971-1.254c1.022-.898 2.019-1.799 2.99-2.701 1.362-1.208 2.383-1.854 3.064-1.938 1.612-.185 2.6 1.05 2.962 3.704.417 3.061.696 4.962.835 5.7.325 1.701.682 2.551 1.066 2.551.278 0 .898-.588 1.855-1.764.958-1.176 1.477-2.072 1.554-2.689.154-1.237-.356-1.855-1.53-1.855-.541 0-1.1.123-1.67.37 1.114-3.649 3.232-5.419 6.355-5.311 2.321.077 3.404 1.562 3.25 4.456z" />
            </svg>
          </div>
        </span>
      </div>

      {/* 2-A. 캘린더 임베드 섹션 (반응형 유동적 크기 및 높이 확장 최적화) */}
      {texts.contactCalendarUrl && (
        <div className="mt-16 md:mt-20 w-full lg:max-w-[92vw] 2xl:max-w-[1500px] mx-auto px-2 sm:px-4">
          <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2">Schedule</h3>
          <p className="text-slate-500 text-xs sm:text-sm font-light mb-6 tracking-wide">촬영 가능 일정을 확인하고 문의해주세요</p>
          <div className="w-full h-[400px] sm:h-[500px] md:h-[650px] xl:h-[800px] bg-slate-50 rounded-lg overflow-hidden border border-slate-100 shadow-sm relative transition-all duration-300">
            <iframe
              src={texts.contactCalendarUrl}
              className="w-full h-full border-0 rounded-lg"
              loading="lazy"
              title="Schedule Calendar"
            />
          </div>
        </div>
      )}

      {/* 2-B. 촬영 문의하기 2가지 선택 버튼 (구글폼 / 웹 직접 신청) */}
      <div className="mt-12 md:mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
        {/* 구글 폼으로 신청하기 */}
        <a
          href={texts.contactFormUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 border border-slate-300 text-xs sm:text-sm font-bold tracking-[0.15em] uppercase text-slate-800 hover:bg-slate-100 hover:border-slate-400 transition-all duration-300 rounded-full shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Google Form으로 신청하기
        </a>

        {/* 웹에서 바로 1:1 신청하기 */}
        <button
          onClick={() => setIsInquiryOpen(true)}
          className="w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 bg-slate-900 text-white text-xs sm:text-sm font-bold tracking-[0.15em] uppercase hover:bg-slate-800 transition-all duration-300 rounded-full shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          웹에서 바로 신청하기
        </button>
      </div>

      {/* 1:1 문의 모달 컴포넌트 */}
      <InquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        contactEmail={texts.contactEmail}
      />

      {/* 3. 하단 정보 섹션 */}
      {/* 활동 지역 및 가능 여부 표시 */}
      <div className="mt-20 md:mt-32 pt-8 md:pt-12">
        <div className="mb-2">
          <EditableText textKey="contactLocation" className="text-[10px] sm:text-xs font-bold text-slate-900 uppercase tracking-[0.4em]" as="p" />
        </div>
        <div>
          <EditableText textKey="contactAvailability" className="text-[10px] sm:text-xs text-slate-300 uppercase tracking-widest font-light" as="p" />
        </div>
      </div>
    </div>
  );
};

export default Contact;