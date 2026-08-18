import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Category, WorkType, WorkItem } from '../../types';
import { useWorkItems } from '../../hooks/useWorkItems';
import ProjectModal from '../ProjectModal';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const Work: React.FC = () => {
  // 1. 커스텀 훅을 통해 전체 작업물 데이터 가져오기
  const { items: workItems, loading, error } = useWorkItems();

  // 2. 상태(State) 관리
  const [activeType, setActiveType] = useState<WorkType>('Created'); // 현재 선택된 작업 유형 (제작/참여)
  const [activeCategory, setActiveCategory] = useState<Category>('All'); // 현재 선택된 카테고리 (MV/Dance 등)
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null); // 모달에 띄울 현재 선택된 작업물
  const [isGridUpdating, setIsGridUpdating] = useState(false); // 필터 변경 시 그리드 깜빡임 효과 제어
  const [navDirection, setNavDirection] = useState<'next' | 'prev' | 'init'>('init'); // 모달 슬라이드 애니메이션 방향
  const [columnCount, setColumnCount] = useState(4); // 반응형 열 개수 상태

  // 화면 크기에 따른 동적 열 개수 설정
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumnCount(1);
      } else if (width < 768) {
        setColumnCount(2);
      } else if (width < 1024) {
        setColumnCount(3);
      } else {
        setColumnCount(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 필터 옵션 상수 정의
  const workTypes: WorkType[] = ['Created', 'Participated'];

  // 선호하는 카테고리 순서 정의 (구글 시트의 최신 카테고리 반영)
  const PREDEFINED_ORDER = useMemo(() => [
    'Official MV',
    'Unofficial MV',
    'Dance Film',
    'Dance Cover',
    'Web Drama',
    'Short Movie',
    'Concept Video'
  ], []);

  // 현재 선택된 작업 유형(Personal/Participation)에 존재하는 카테고리만 동적으로 생성
  const categories = useMemo(() => {
    const cats = new Set<string>();
    workItems.forEach(item => {
      if (item.type === activeType && item.category) {
        cats.add(item.category);
      }
    });

    // 선호 순서대로 정렬하되, 새로운 카테고리는 알파벳 순으로 정렬하여 뒤에 추가
    const sortedCats = Array.from(cats).sort((a, b) => {
      const idxA = PREDEFINED_ORDER.indexOf(a);
      const idxB = PREDEFINED_ORDER.indexOf(b);

      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return ['All', ...sortedCats];
  }, [workItems, activeType, PREDEFINED_ORDER]);

  // 작업 유형(Personal/Participation) 전환 시 해당 유형에 없는 카테고리가 선택되어 있으면 'All'로 자동 리셋
  useEffect(() => {
    if (activeCategory !== 'All' && !categories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  }, [activeType, categories, activeCategory]);

  // 3. 필터링 로직 (useMemo: 의존성 값이 변할 때만 재연산하여 성능 최적화)
  const filteredItems = useMemo(() => {
    return workItems.filter(item => {
      const typeMatch = item.type === activeType; // 작업 유형 일치 여부 확인
      // 'All'이면 모든 카테고리 통과, 아니면 해당 카테고리만 통과
      const categoryMatch = activeCategory === 'All' || item.category === activeCategory;
      return typeMatch && categoryMatch;
    });
  }, [activeType, activeCategory, workItems]);

  // 현재 모달에 떠있는 아이템이 필터링된 목록 중 몇 번째인지 인덱스 계산
  const currentIndex = useMemo(() => {
    if (!selectedWork) return -1;
    return filteredItems.findIndex(item => item.id === selectedWork.id);
  }, [selectedWork, filteredItems]);

  // 4. 네비게이션 핸들러 (다음/이전 프로젝트 이동)
  const handleNext = useCallback(() => {
    setNavDirection('next'); // 애니메이션 방향: 오른쪽에서 등장
    // 마지막 항목이면 처음으로, 아니면 다음 항목으로
    if (currentIndex < filteredItems.length - 1) {
      setSelectedWork(filteredItems[currentIndex + 1]);
    } else {
      setSelectedWork(filteredItems[0]); // 루프(Loop) 처리
    }
  }, [currentIndex, filteredItems]);

  const handlePrev = useCallback(() => {
    setNavDirection('prev'); // 애니메이션 방향: 왼쪽에서 등장
    // 첫 항목이면 마지막으로, 아니면 이전 항목으로
    if (currentIndex > 0) {
      setSelectedWork(filteredItems[currentIndex - 1]);
    } else {
      setSelectedWork(filteredItems[filteredItems.length - 1]); // 루프(Loop) 처리
    }
  }, [currentIndex, filteredItems]);

  // 모달 닫기 핸들러
  const closeModal = useCallback(() => {
    setSelectedWork(null);
    setNavDirection('init'); // 방향 초기화
  }, []);

  // 5. 키보드 이벤트 리스너 (화살표 키로 이동, ESC로 닫기)
  useEffect(() => {
    if (selectedWork) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'Escape') closeModal();
      };

      window.addEventListener('keydown', handleKeyDown);
      // 컴포넌트 언마운트 시 리스너 제거 (메모리 누수 방지)
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [selectedWork, handleNext, handlePrev, closeModal]);

  // 6. 필터 변경 시 그리드 재렌더링 효과 (깜빡임 애니메이션)
  useEffect(() => {
    setIsGridUpdating(true);
    // 50ms 동안 잠깐 숨겼다가 다시 보여줘서(fade-in) 전환 효과를 줌
    const timer = setTimeout(() => setIsGridUpdating(false), 50);
    return () => clearTimeout(timer);
  }, [activeType, activeCategory]);

  // 썸네일 클릭 시 모달 열기
  const openModal = useCallback((item: WorkItem) => {
    setNavDirection('init');
    setSelectedWork(item);
  }, []);

  // 7. 스크롤 감지 (제목 애니메이션용)
  const [textRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  // 에러 발생 시 UI 처리
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center text-red-500">
        Failed to load projects. Please try refreshing.
      </div>
    );
  }

  return (
    <div className="w-full px-6 relative">
      {/* A. 상단 헤더 영역 (제목 + 필터 버튼들) */}
      <div ref={textRef} className="flex flex-col items-center justify-center mb-16 md:mb-24 gap-8 md:gap-12">
        <div className="w-full text-center">
          <div className="overflow-hidden mb-8 md:mb-12">
            {/* 스크롤 시 아래에서 위로 올라오는 제목 애니메이션 */}
            <h2 className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9] transition-transform duration-[1.2s] cubic-bezier(0.16, 1, 0.3, 1) ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
              SELECTED PROJECTS
            </h2>
          </div>
        </div>

        {/* 필터 컨트롤 영역 */}
        <div className="flex flex-col items-center gap-6 md:gap-8 w-full">
          {/* 1. 작업 유형 필터 (Created / Participated) - 캡슐 모양 버튼 */}
          <div className="relative flex bg-slate-50 p-1.5 rounded-full overflow-hidden border border-slate-100 shadow-sm">
            {workTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`relative z-10 px-6 py-2 md:px-8 md:py-2.5 text-[10px] sm:text-xs font-bold tracking-[0.2em] transition-all duration-300 uppercase rounded-full whitespace-nowrap ${activeType === type ? 'text-white' : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {type === 'Created' ? 'Personal' : 'Participation'}
                {/* 선택된 버튼 뒤에 따라다니는 검은색 배경 애니메이션 */}
                {activeType === type && (
                  <div className="absolute inset-0 bg-slate-900 rounded-full -z-10 animate-in fade-in zoom-in-95 duration-200" />
                )}
              </button>
            ))}
          </div>

          {/* 2. 카테고리 필터 (MV / Dance Film 등) - 텍스트 탭 형태 */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold tracking-widest transition-all duration-300 border-b-2 uppercase whitespace-nowrap ${activeCategory === cat
                  ? 'border-slate-900 text-slate-900' // 선택됨: 진한 글씨 + 밑줄
                  : 'border-transparent text-slate-300 hover:text-slate-500 hover:border-slate-200' // 미선택: 연한 글씨
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* B. 그리드 컨텐츠 영역 */}
      {loading ? (
        // 로딩 중일 때 스켈레톤 UI (회색 박스 깜빡임) 표시
        <div className="flex flex-row gap-[10px] w-full">
          {Array.from({ length: columnCount }).map((_, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-[10px] flex-1">
              {[...Array(2)].map((_, i) => (
                <div 
                  key={i} 
                  className={`animate-pulse bg-slate-100 w-full rounded-lg ${
                    (colIdx + i) % 2 === 0 ? 'aspect-[9/16]' : 'aspect-[16/10]'
                  }`}
                ></div>
              ))}
            </div>
          ))}
        </div>
      ) : (() => {
        // Flexbox Columns에 맞춰 아이템 분배 (Chronological Flow)
        const columns: WorkItem[][] = Array.from({ length: columnCount }, () => []);
        filteredItems.forEach((item, index) => {
          columns[index % columnCount].push(item);
        });

        return (
          <div
            key={activeCategory + activeType + columnCount} // 키가 바뀌면 애니메이션 초기화
            className="flex flex-row gap-[10px] w-full min-h-[500px]"
          >
            {!isGridUpdating && columns.map((columnItems, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-[10px] flex-1">
                {columnItems.map((item) => {
                  const originalIndex = filteredItems.findIndex(fi => fi.id === item.id);
                  return (
                    <div
                      key={`${item.id}-${activeType}-${activeCategory}`}
                      className="stagger-item group cursor-pointer relative block w-full rounded-lg overflow-hidden"
                      style={{ animationDelay: `${originalIndex * 80}ms` }} // 순차적으로 나타나는 애니메이션 딜레이
                      onClick={() => openModal(item)}
                    >
                      {/* 이미지 컨테이너 */}
                      <div className={`relative w-full overflow-hidden bg-slate-50 transition-all duration-700 ${item.vertical ? 'aspect-[9/16]' : 'aspect-[16/10]'}`}>
                        {item.vertical && (
                          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider z-20 flex items-center gap-1 shadow-sm">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Vertical
                          </div>
                        )}
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-[1.5s] cubic-bezier(0.22, 1, 0.36, 1) group-hover:scale-105"
                        />

                        {/* 호버 오버레이 (모바일: 항상 보임 / 데스크탑: 호버 시 보임) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6 md:p-8">
                          <div className="transform translate-y-0 md:translate-y-4 md:group-hover:translate-y-0 transition-transform duration-500">
                            <span className="text-[8px] sm:text-[10px] font-bold tracking-[0.3em] text-white/70 uppercase block mb-2">{item.category}</span>
                            <h3 className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-white mb-2 md:mb-4 leading-tight">{item.title}</h3>
                            <div className="hidden md:flex items-center text-[10px] text-white/80 font-medium tracking-widest uppercase">
                              <span>View Project</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })()}


      {/* C. 프로젝트 상세 모달 (조건부 렌더링) */}
      <ProjectModal
        selectedWork={selectedWork}
        onClose={closeModal}
        onNext={handleNext}
        onPrev={handlePrev}
        navDirection={navDirection}
      />
    </div>
  );
};

export default Work;