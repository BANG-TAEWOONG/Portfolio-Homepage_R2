import React, { useEffect, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { createPortal } from 'react-dom';
import { WorkItem } from '../types';
import { getYouTubeEmbedUrl, getVideoPlatform } from '../services/youtube';

// 컴포넌트에서 사용할 Props 타입 정의
interface ProjectModalProps {
    selectedWork: WorkItem | null;  // 현재 선택된 프로젝트 데이터
    onClose: () => void;            // 모달 닫기 함수
    onNext: () => void;             // 다음 프로젝트로 이동
    onPrev: () => void;             // 이전 프로젝트로 이동
    navDirection: 'next' | 'prev' | 'init'; // 애니메이션 방향 결정 (다음/이전/초기)
}

const ProjectModal: React.FC<ProjectModalProps> = ({ selectedWork, onClose, onNext, onPrev, navDirection }) => {
    // 애니메이션 효과를 위한 상태 관리
    const [transitionClass, setTransitionClass] = useState('animate-modal-container');

    // 네비게이션 방향이나 선택된 프로젝트가 바뀔 때마다 애니메이션 클래스 업데이트
    useEffect(() => {
        if (navDirection === 'next') setTransitionClass('animate-slide-right'); // 오른쪽에서 들어옴
        else if (navDirection === 'prev') setTransitionClass('animate-slide-left'); // 왼쪽에서 들어옴
        else setTransitionClass('animate-modal-container'); // 기본 페이드인
    }, [navDirection, selectedWork?.id]);

    // 모달이 열려 있을 때 배경(바깥 페이지) 스크롤 완벽 차단
    useEffect(() => {
        if (selectedWork) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow || '';
            };
        }
    }, [selectedWork]);

    // 스와이프 핸들러 정의 (터치 스와이프 감지)
    const handlers = useSwipeable({
        onSwipedLeft: () => onNext(),
        onSwipedRight: () => onPrev(),
        preventScrollOnSwipe: true,
        trackMouse: true // 마우스 및 터치 모두 지원
    });

    // 선택된 작업물이 없으면 렌더링하지 않음
    if (!selectedWork) return null;

    const platform = getVideoPlatform(selectedWork.videoUrl);

    // React Portal을 사용하여 부모 컴포넌트의 DOM 계층구조를 벗어나 document.body에 직접 렌더링
    // (z-index 문제나 오버플로우 문제를 피하기 위함)
    return createPortal(
        <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center p-4 overflow-hidden pointer-events-none select-none">

            {/* 1. 배경 오버레이 (클릭 시 모달 닫힘, 배경 휠 스크롤 전파 방지) */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-md animate-modal-overlay pointer-events-auto cursor-pointer"
                onClick={onClose}
                onWheel={(e) => e.preventDefault()}
                onTouchMove={(e) => e.preventDefault()}
            ></div>

            {/* 2. 모달 메인 컨텐츠 래퍼 */}
            <div
                {...handlers}
                key={selectedWork.id}
                // transitionClass에 따라 슬라이드 애니메이션 적용
                className={`relative w-full max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] z-[2010] my-4 lg:my-8 pointer-events-auto ${transitionClass} flex-shrink-0`}
            >
                {/* 3. 데스크탑용 사이드 네비게이션 버튼 (화살표) */}
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    className="hidden lg:flex absolute top-1/2 -left-12 xl:-left-20 -translate-y-1/2 z-[2030] p-2 text-slate-300 hover:text-slate-600 transition-all duration-300 hover:scale-110"
                    aria-label="Previous Project"
                >
                    <svg className="w-12 h-12 drop-shadow-lg filter" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="hidden lg:flex absolute top-1/2 -right-12 xl:-right-20 -translate-y-1/2 z-[2030] p-2 text-slate-300 hover:text-slate-600 transition-all duration-300 hover:scale-110"
                    aria-label="Next Project"
                >
                    <svg className="w-12 h-12 drop-shadow-lg filter" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* 4. 내부 카드 컨테이너 (흰색 배경) - PC에선 가로 배치 */}
                <div className="w-full bg-white rounded-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col lg:flex-row lg:h-[80vh] lg:min-h-[70vh] lg:max-h-[85vh]">

                    {/* A. 비디오 섹션 */}
                    <div className={`bg-black relative shrink-0 self-stretch flex items-center justify-center ${selectedWork.vertical ? 'w-full aspect-[9/16] lg:w-auto lg:h-full lg:aspect-[9/16]' : 'w-full lg:w-2/3 aspect-video lg:aspect-auto lg:h-full'}`}>
                        {selectedWork.videoUrl && (
                            platform === 'instagram' ? (
                                <iframe
                                    key={`${selectedWork.id}-insta-iframe`}
                                    src={getYouTubeEmbedUrl(selectedWork.videoUrl)}
                                    className="w-full h-full absolute inset-0 bg-slate-950"
                                    title={selectedWork.title}
                                    frameBorder="0"
                                    scrolling="no"
                                    allowTransparency={true}
                                    allow="encrypted-media"
                                ></iframe>
                            ) : platform === 'other' && !selectedWork.videoUrl.endsWith('.mp4') ? (
                                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-white space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-sm font-semibold tracking-tight">{selectedWork.title}</h4>
                                    <a
                                        href={selectedWork.videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 bg-white text-slate-900 font-bold text-xs rounded-full uppercase tracking-wider hover:bg-slate-200 transition-colors shadow-lg"
                                    >
                                        공식 사이트에서 영상 보기 ↗
                                    </a>
                                </div>
                            ) : (
                                <iframe
                                    key={`${selectedWork.id}-iframe`}
                                    src={getYouTubeEmbedUrl(selectedWork.videoUrl)}
                                    className="w-full h-full absolute inset-0"
                                    title={selectedWork.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            )
                        )}
                        {/* 영상 우상단 닫기 버튼 (X 아이콘) */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 z-[2030] p-1.5 text-white/50 hover:text-white transition-all duration-300 lg:hidden"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* B. 텍스트 컨텐츠 섹션 (스크롤 가능, 남은 공간 차지) */}
                    <div className={`p-6 lg:p-10 bg-white overflow-y-auto custom-scrollbar relative flex-grow ${selectedWork.vertical ? 'w-full lg:w-auto max-h-[50vh] lg:max-h-[85vh]' : 'w-full lg:w-1/3 max-h-[60vh] lg:max-h-[85vh]'}`}>
                        {/* PC용 닫기 버튼 (스크롤 시에도 우상단 고정 - Sticky) */}
                        <button
                            onClick={onClose}
                            className="hidden lg:flex sticky top-0 right-0 float-right z-30 p-2 text-slate-400 hover:text-slate-900 bg-white/90 backdrop-blur-sm rounded-full transition-all shadow-sm hover:scale-110 cursor-pointer"
                            aria-label="Close modal"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="space-y-6 md:space-y-8">

                            {/* 헤더: 카테고리 및 제목 */}
                            <div>
                                <span className="text-[7px] md:text-[9px] font-bold tracking-[0.4em] text-slate-300 uppercase block mb-2">{selectedWork.category}</span>
                                <div className="flex items-center justify-between gap-4">
                                    <h3 className="text-[12px] md:text-2xl font-bold text-slate-900 tracking-tighter leading-tight">{selectedWork.title}</h3>

                                    {/* 모바일용 네비게이션 버튼 (제목 옆에 작게 표시됨) */}
                                    <div className="flex items-center space-x-2 lg:hidden text-slate-300 shrink-0">
                                        <button onClick={onPrev} className="hover:text-slate-900 transition-colors p-1">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button onClick={onNext} className="hover:text-slate-900 transition-colors p-1">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                {/* 구분선 */}
                                <div className="h-[2px] w-8 md:w-10 bg-slate-900 mt-4"></div>
                            </div>

                            {/* 상세 정보 그리드 */}
                            <div className="grid grid-cols-1 gap-6 md:gap-8">
                                {/* 역할 (Role) & 참여율 */}
                                <section>
                                    <h4 className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-1">Role</h4>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-[10px] md:text-xs font-semibold text-slate-900">{selectedWork.role}</p>
                                        {selectedWork.contributionRate && (
                                            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                                참여율 {selectedWork.contributionRate}
                                            </span>
                                        )}
                                    </div>
                                </section>

                                {/* 기간(Duration) 및 출시일(Release) */}
                                <div className="grid grid-cols-2 gap-4">
                                    <section>
                                        <h4 className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-1">Duration</h4>
                                        <p className="text-[10px] md:text-xs font-semibold text-slate-900">{selectedWork.runningTime}</p>
                                    </section>
                                    <section>
                                        <h4 className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-1">Release</h4>
                                        <p className="text-[10px] md:text-xs font-semibold text-slate-900">{selectedWork.releaseDate}</p>
                                    </section>
                                </div>

                                {/* 설명 (Description) */}
                                <section>
                                    <h4 className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-2">Description</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed font-light whitespace-pre-line">{selectedWork.description}</p>
                                </section>
                            </div>

                            {/* 플랫폼 바로가기 액션 버튼 */}
                            {selectedWork.videoUrl && (
                                <div className="pt-4">
                                    <a
                                        href={selectedWork.videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                                            platform === 'instagram'
                                                ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white hover:opacity-90'
                                                : platform === 'youtube'
                                                ? 'bg-red-600 text-white hover:bg-red-700'
                                                : 'bg-slate-900 text-white hover:bg-slate-800'
                                        }`}
                                    >
                                        {platform === 'instagram' && (
                                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                            </svg>
                                        )}
                                        {platform === 'youtube' && (
                                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                            </svg>
                                        )}
                                        <span>
                                            {platform === 'instagram' ? 'Instagram에서 열기' : platform === 'youtube' ? 'YouTube에서 열기' : '원본 링크 바로가기'} ↗
                                        </span>
                                    </a>
                                </div>
                            )}

                            {/* 하단 닫기 버튼 (우측 하단 정렬) */}
                            <div className="pt-6 border-t border-slate-50 mt-6 flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="flex items-center text-[9px] font-bold tracking-[0.3em] text-slate-900 group cursor-pointer hover:text-slate-500 transition-colors"
                                >
                                    CLOSE PROJECT
                                    <span className="ml-3 group-hover:translate-x-1 transition-transform">→</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body // Portal 타겟: body 태그 바로 아래
    );
};

export default React.memo(ProjectModal);