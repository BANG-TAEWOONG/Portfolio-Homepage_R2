import React, { useEffect, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { createPortal } from 'react-dom';
import { WorkItem } from '../types';
import { getYouTubeEmbedUrl } from '../services/youtube';

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

    // 스와이프 핸들러 정의 (터치 스와이프 감지)
    const handlers = useSwipeable({
        onSwipedLeft: () => onNext(),
        onSwipedRight: () => onPrev(),
        preventScrollOnSwipe: true,
        trackMouse: true // 마우스 및 터치 모두 지원
    });

    // 선택된 작업물이 없으면 렌더링하지 않음
    if (!selectedWork) return null;

    // React Portal을 사용하여 부모 컴포넌트의 DOM 계층구조를 벗어나 document.body에 직접 렌더링
    // (z-index 문제나 오버플로우 문제를 피하기 위함)
    return createPortal(
        <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center p-4 overflow-y-auto pointer-events-none">

            {/* 1. 배경 오버레이 (클릭 시 모달 닫힘) */}
            <div
                className="fixed inset-0 bg-white/10 backdrop-blur-md animate-modal-overlay pointer-events-auto"
                onClick={onClose}
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
                            <iframe
                                key={`${selectedWork.id}-iframe`}
                                src={getYouTubeEmbedUrl(selectedWork.videoUrl)}
                                className="w-full h-full absolute inset-0"
                                title={selectedWork.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        )}
                        {/* 영상 우상단 닫기 버튼 (X 아이콘) - 모바일에서만 노출하거나 PC에서도 유지? PC는 우측 텍스트 영역에 넣는게 나을수도 있으나 일단 유지 */}
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

                            {/* 하단 닫기 버튼 (텍스트 형태) */}
                            <div className="pt-8 border-t border-slate-50 mt-8">
                                <button
                                    onClick={onClose}
                                    className="flex items-center text-[9px] font-bold tracking-[0.3em] text-slate-900 group"
                                >
                                    <span className="mr-3 group-hover:-translate-x-1 transition-transform">←</span>
                                    CLOSE PROJECT
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