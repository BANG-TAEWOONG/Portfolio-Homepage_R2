import React, { useState, useEffect } from 'react';
import { smoothScrollTo } from '../../utils/smoothScroll';

interface NavbarProps {
  activeSection: string; // 현재 화면에 보이는 섹션 ID (부모 컴포넌트로부터 전달받음)
  onAdminClick?: () => void; // Admin 모달 호출 콜백
}

const Navbar: React.FC<NavbarProps> = ({ activeSection, onAdminClick }) => {
  // 1. 상태 관리
  const [isScrolled, setIsScrolled] = useState(false); // 사용자가 스크롤을 내렸는지 여부
  const [isHovered, setIsHovered] = useState(false);   // 네비게이션 바에 마우스를 올렸는지 여부
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 모바일 사이드바 열림 상태

  // 네비게이션 메뉴 항목들 (라벨과 이동할 섹션 ID)
  const navItems = [
    { label: 'HOME', id: 'home' },
    { label: 'WORK', id: 'work' },
    { label: 'ABOUT', id: 'about' },
    { label: 'CONTACT', id: 'contact' },
  ];

  // 2. 스크롤 이벤트 리스너 (네비게이션 표시 로직용)
  useEffect(() => {
    const handleScroll = () => {
      // 스크롤이 10px 이상 발생하면 isScrolled를 true로 설정
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    // 컴포넌트가 사라질 때 리스너 제거 (메모리 누수 방지)
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ESC 키로 사이드바 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    if (isSidebarOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  // 사이드바 열림 시 스크롤 잠금
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  // 3. 특정 섹션으로 부드럽게 이동하는 함수 (Smooth Scroll)
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    smoothScrollTo(id, 64, 900);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 backdrop-blur-md bg-white/80 border-b border-slate-100 ${isScrolled || isHovered
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-full hover:opacity-100 hover:translate-y-0'
          }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full px-6 h-16 md:h-20 flex items-center justify-between">
          {/* 좌측 로고 및 관리자 단추 */}
          <div className="flex items-center gap-2">
            <a
              href="#home"
              onClick={(e) => scrollToSection(e, 'home')}
              className="text-[11px] sm:text-xs md:text-sm font-medium tracking-[0.4em] text-slate-950 whitespace-nowrap uppercase mr-[-0.4em]"
            >
              TWOONG STUDIO
            </a>
            {onAdminClick && (
              <button
                onClick={onAdminClick}
                className="p-1 rounded text-slate-300 hover:text-slate-950 hover:bg-slate-50 transition-all duration-300 cursor-pointer"
                title="관리자 설정"
                aria-label="Admin Settings"
              >
                <svg className="w-3.5 h-3.5 md:w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>

          {/* 우측 메뉴 리스트 - 데스크탑 (md 이상) */}
          <div className="hidden md:flex md:space-x-12">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => scrollToSection(e, item.id)}
                className={`text-xs font-semibold tracking-widest transition-colors duration-300 hover:text-slate-900 ${activeSection === item.id
                  ? 'text-slate-900 border-b-2 border-slate-900 pb-1'
                  : 'text-slate-400'
                  }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* 햄버거 아이콘 (모바일) */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center text-slate-900 z-[201] relative cursor-pointer"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* 모바일 사이드바 드로어 — nav 바깥에 배치하여 fixed가 화면 전체에 적용 */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] bg-white z-[200] shadow-2xl transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col pt-24 px-6 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                scrollToSection(e, item.id);
                setIsSidebarOpen(false);
              }}
              className={`block py-4 px-2 text-sm font-semibold tracking-widest transition-colors duration-300 ${activeSection === item.id
                ? 'text-slate-900 border-l-2 border-slate-900 pl-4 bg-slate-50'
                : 'text-slate-400 hover:text-slate-900 pl-4'
                }`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* 배경 오버레이 — nav 바깥에 배치 */}
      <div
        className={`fixed inset-0 z-[199] bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        onClick={() => setIsSidebarOpen(false)}
      />
    </>
  );
};

export default React.memo(Navbar);