import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import Navbar from './components/layout/Navbar';
import { useIntersectionObserver } from './hooks/useIntersectionObserver';
import { useSiteTexts } from './hooks/useSiteTexts';
import { SiteTextsProvider } from './context/SiteTextsContext';
import EditableText from './components/EditableText';

// 컴포넌트 레이지 로딩 (초기 로딩 속도 향상)
const Home = lazy(() => import('./components/sections/Home'));
const Work = lazy(() => import('./components/sections/Work'));
const About = lazy(() => import('./components/sections/About'));
const Contact = lazy(() => import('./components/sections/Contact'));

const Admin = lazy(() => import('./components/Admin'));

// 섹션 스켈레톤 (로딩 중 표시)
const SectionLoader = () => (
  <div className="w-full h-[60vh] flex items-center justify-center bg-white">
    <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const RevealSection: React.FC<{ id: string; children: React.ReactNode; className?: string }> = ({ id, children, className }) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  return (
    <section id={id} ref={ref} className={`${className} reveal-view ${isVisible ? 'visible' : ''}`}>
      {children}
    </section>
  );
};

const AppContent: React.FC = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [showAdmin, setShowAdmin] = useState(false);
  const { texts, hasChanges, isSaving, saveChanges, discardChanges, pendingChanges, isEditMode, setIsEditMode } = useSiteTexts();

  // ── 시네마틱 인트로 오버레이 상태 ──
  const [introActive, setIntroActive] = useState(false);
  const [introFading, setIntroFading] = useState(false);

  useEffect(() => {
    const hasPlayed = sessionStorage.getItem('introPlayed');
    if (!hasPlayed) {
      setIntroActive(true);
      // 2.2초 동안 텍스트 애니메이션 진행 후 페이드 아웃 시작
      const fadeTimeout = setTimeout(() => {
        setIntroFading(true);
        // 1초간 페이드 아웃 완료 후 오버레이 완벽히 해제
        const removeTimeout = setTimeout(() => {
          setIntroActive(false);
          sessionStorage.setItem('introPlayed', 'true');
        }, 1000);
        return () => clearTimeout(removeTimeout);
      }, 2200);
      return () => clearTimeout(fadeTimeout);
    }
  }, []);

  useEffect(() => {
    // IntersectionObserver를 사용한 효율적인 Scroll Spy 구현
    const sections = ['home', 'work', 'about', 'contact'];
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px', // 화면 상단 20~30% 영역에 들어올 때 활성화
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleSave = async () => {
    const success = await saveChanges();
    if (success) {
      alert('구글 시트 전송 완료! 실시간 반영은 약 1~5분 정도 소요될 수 있으며, 로컬 페이지에는 즉시 임시 반영되었습니다.');
      setIsEditMode(false); // 저장 완료 시 편집 모드 자동 종료
    }
  };

  const pendingCount = Object.keys(pendingChanges).length;

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white">
      {/* Cinematic Intro Loader Overlay */}
      {introActive && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-1000 ease-in-out ${
            introFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div
            className={`text-white text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-widest whitespace-nowrap transition-all duration-[2200ms] ease-out ${
              introFading ? 'opacity-0 scale-[1.05] tracking-[1.5em]' : 'animate-letter-space'
            }`}
          >
            TWOONG STUDIO
          </div>
        </div>
      )}

      {/* Navbar - onAdminClick 콜백 연동 */}
      <Navbar activeSection={activeSection} onAdminClick={() => setShowAdmin(true)} />

      <main>
        <section id="home" className="scroll-mt-16 md:scroll-mt-20">
          <Suspense fallback={<SectionLoader />}>
            <Home isIntroPlaying={introActive && !introFading} />
          </Suspense>
        </section>

        <RevealSection id="work" className="py-16 md:py-32 bg-white scroll-mt-16 md:scroll-mt-20">
          <Suspense fallback={<SectionLoader />}>
            <Work />
          </Suspense>
        </RevealSection>

        <RevealSection id="about" className="py-16 md:py-32 bg-slate-50 scroll-mt-16 md:scroll-mt-20">
          <Suspense fallback={<SectionLoader />}>
            <About />
          </Suspense>
        </RevealSection>

        <RevealSection id="contact" className="py-16 md:py-40 scroll-mt-16 md:scroll-mt-20">
          <Suspense fallback={<SectionLoader />}>
            <Contact />
          </Suspense>
        </RevealSection>
      </main>

      {/* 푸터 - 탭 카운터 제거하고 미니멀하게 단순 카피라이트 출력 */}
      <footer className="py-12 text-center border-t border-slate-100 text-slate-300 text-[10px] tracking-[0.2em] uppercase">
        <p className="cursor-default select-none">
          &copy; {new Date().getFullYear()} <EditableText textKey="footerCopyright" />. All rights reserved.
        </p>
      </footer>

      {/* ── 인라인 편집 상태: 플로팅 저장/취소 세이브 바 ── */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[8000] bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-5 duration-300 border border-slate-800">
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-wider">임시 변경사항 ({pendingCount}건)</span>
            <span className="text-[10px] text-slate-400">구글 시트에 저장하기 전입니다.</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                discardChanges();
                setIsEditMode(false); // 취소 시 편집 모드 자동 종료
              }}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors shadow flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                  저장 중...
                </>
              ) : (
                '구글 시트에 저장하기'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── 인라인 편집 상태: 저장할 변경 사항이 없는 경우의 편집 종료 바 ── */}
      {!hasChanges && isEditMode && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[8000] bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-5 animate-in slide-in-from-bottom-5 duration-300 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold tracking-wider">화면 편집 모드 작동 중</span>
          </div>
          <button
            onClick={() => setIsEditMode(false)}
            className="px-3.5 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer shadow-sm"
          >
            편집 종료
          </button>
        </div>
      )}

      {/* Admin 모달 오버레이 */}
      {showAdmin && (
        <Suspense fallback={null}>
          <Admin onClose={() => setShowAdmin(false)} />
        </Suspense>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SiteTextsProvider>
      <AppContent />
    </SiteTextsProvider>
  );
};

export default App;
