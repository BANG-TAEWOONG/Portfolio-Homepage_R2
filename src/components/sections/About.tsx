import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LEVEL_MAPPING, SKILLS, TOOLS_DATA, EQUIPMENT_DATA } from '../../constants';
import { Skill, SkillItem as SkillItemType } from '../../types';
import { fetchSkillsData, fetchToolsData, fetchEquipmentData } from '../../services/googleSheetService';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useSiteTexts } from '../../hooks/useSiteTexts';
import EditableText from '../EditableText';

// ----------------------------------------------------------------------
// 1. 헬퍼 함수
// ----------------------------------------------------------------------

/**
 * 숙련도 점수(0~5)를 텍스트 등급(BEGINNER, EXPERT 등)으로 변환
 * @param level 숫자형 숙련도
 * @returns 매핑된 텍스트 레벨
 */
const renderLevel = (level: number) => {
  // 0~5 범위를 벗어나지 않도록 보정 및 반올림
  const safeLevel = Math.max(0, Math.min(5, Math.round(level)));
  return LEVEL_MAPPING[safeLevel] || 'BEGINNER';
};

// ----------------------------------------------------------------------
// 2. InteractiveSkillSection 컴포넌트
// (능력, 툴, 장비를 탭/필터 형태로 보여주는 인터랙티브 섹션)
// ----------------------------------------------------------------------

const InteractiveSkillSection: React.FC = () => {
  // 상태 관리
  const [skills, setSkills] = useState<SkillItemType[]>([]); // 불러온 스킬 데이터 저장
  const [loading, setLoading] = useState(true); // 데이터 로딩 상태
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  // 각 카테고리별 현재 선택된 필터 상태 저장 (예: Tools 카테고리는 'Editing' 필터 선택 등)
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string }>({
    Capabilities: '',
    Tools: '',
    Equipment: ''
  });

  const [activeBrand, setActiveBrand] = useState<string>('All');

  const categories = ['Capabilities', 'Tools', 'Equipment'];

  // 특정 카테고리의 유니크한 필터 목록 추출 (예: All, Editing, Color Grading...)
  const getFilters = (category: string) => {
    const categorySkills = skills.filter(s => s.category === category && !s.hidden);
    const filters = Array.from(new Set(categorySkills.map(s => s.filter))).filter(f => f);
    return ['All', ...filters];
  };

  const currentEquipmentFilter = useMemo(() => {
    const eqSkills = skills.filter(s => s.category === 'Equipment' && !s.hidden);
    const filters = Array.from(new Set(eqSkills.map(s => s.filter))).filter(f => f && f !== 'All');
    const current = activeFilters['Equipment'];
    return current && current !== 'All' && filters.includes(current) ? current : (filters[0] || 'All');
  }, [skills, activeFilters.Equipment]);

  useEffect(() => {
    setActiveBrand('All');
  }, [currentEquipmentFilter]);

  const equipmentBrands = useMemo(() => {
    const eqSkills = skills.filter(s => s.category === 'Equipment' && s.filter === currentEquipmentFilter && !s.hidden);
    const unique = new Set<string>();
    eqSkills.forEach(s => {
      if (s.brand) unique.add(s.brand.trim());
    });
    return ['All', ...Array.from(unique)];
  }, [skills, currentEquipmentFilter]);

  // 데이터 로드 효과
  useEffect(() => {
    const loadSkills = async () => {
      try {
        // 3개 시트 병렬 fetch (waterfall 방지)
        const [capabilities, tools, equipment] = await Promise.all([
          fetchSkillsData(),
          fetchToolsData(),
          fetchEquipmentData()
        ]);

        let combinedData: SkillItemType[] = [];

        // 1. Capabilities 처리 (실패 시 Fallback)
        if (capabilities && capabilities.length > 0) {
          combinedData = [...combinedData, ...capabilities];
        } else {
          combinedData = [...combinedData, ...mapToSkillItem(SKILLS, 'Capabilities', 'Main')];
        }

        // 2. Tools 처리 (실패 시 Fallback)
        if (tools && tools.length > 0) {
          combinedData = [...combinedData, ...tools];
        } else {
          combinedData = [...combinedData, ...mapToSkillItem(TOOLS_DATA, 'Tools', 'Main')];
        }

        // 3. Equipment 처리 (실패 시 Fallback)
        if (equipment && equipment.length > 0) {
          combinedData = [...combinedData, ...equipment];
        } else {
          combinedData = [...combinedData, ...mapToSkillItem(EQUIPMENT_DATA, 'Equipment', 'Main')];
        }

        setSkills(combinedData);
      } catch (error) {
        console.error('Failed to load skills:', error);
        // 전체 실패 시 전체 Fallback 로드
        const fallbackData = [
          ...mapToSkillItem(SKILLS, 'Capabilities', 'Main'),
          ...mapToSkillItem(TOOLS_DATA, 'Tools', 'Main'),
          ...mapToSkillItem(EQUIPMENT_DATA, 'Equipment', 'Main')
        ];
        setSkills(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    // 로컬 데이터를 컴포넌트 상태 포맷에 맞게 변환하는 내부 헬퍼 함수
    const mapToSkillItem = (items: { name: string; level: number }[], category: string, filter: string): SkillItemType[] =>
      items.map((item, idx) => ({
        category,
        filter,
        name: item.name,
        // constants의 0-100 점수를 0-5 점수로 변환 (fallback용)
        level: Math.round(item.level / 20),
        order: idx,
        hidden: false
      }));

    loadSkills();
  }, []);

  // 스킬 데이터 로드 시 각 카테고리의 첫 번째 필터를 기본값으로 설정
  useEffect(() => {
    if (skills.length > 0) {
      const initialFilters: { [key: string]: string } = {};
      let changed = false;
      categories.forEach((cat) => {
        const catSkills = skills.filter(s => s.category === cat && !s.hidden);
        const filters = Array.from(new Set(catSkills.map(s => s.filter))).filter(f => f && f !== 'All');
        const current = activeFilters[cat];
        if (!current || current === 'All' || !filters.includes(current)) {
          initialFilters[cat] = filters[0] || 'All';
          changed = true;
        } else {
          initialFilters[cat] = current;
        }
      });
      if (changed) {
        setActiveFilters(initialFilters);
      }
    }
  }, [skills]);

  // 해당 필터 그룹의 평균 숙련도 계산
  const getAverageLevel = (filterName: string, category: string) => {
    const targetSkills = skills.filter(s => s.category === category && s.filter === filterName);
    if (!targetSkills.length) return 0;
    const total = targetSkills.reduce((acc, curr) => acc + curr.level, 0);
    return total / targetSkills.length;
  };

  // 로딩 중 표시
  if (loading) {
    return <div className="text-center py-20 text-slate-300 animate-pulse">Loading skills from database...</div>;
  }

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16 lg:gap-20 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
    >
      {categories.map((category) => {
        // 현재 카테고리에 해당하는 스킬 필터링
        const categorySkills = skills.filter(s => s.category === category && !s.hidden);
        const overviewItems = getFilters(category).filter(f => f !== 'All'); // 'All'을 제외한 서브 필터 목록
        
        // 현재 선택된 필터 (없거나 All이면 첫 번째 서브 필터를 기본값으로)
        const currentFilter = activeFilters[category] && activeFilters[category] !== 'All'
          ? activeFilters[category]
          : (overviewItems[0] || 'All');

        // 현재 선택된 필터에 해당하는 스킬 목록
        const displaySkills = categorySkills.filter(s => s.filter === currentFilter);

        return (
          <div key={category} className="flex flex-col h-full">
            {/* 카테고리 헤더 */}
            <div className="flex justify-between items-baseline mb-8 md:mb-10">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold tracking-[0.5em] text-slate-400 uppercase">
                  {category}
                </h4>
              </div>

              <div className="flex items-center gap-4 md:gap-6">
                <span className="text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase text-slate-900 min-w-[80px] text-right animate-in fade-in duration-300">
                  {currentFilter}
                </span>
              </div>
            </div>

            {/* 컨텐츠 영역 (평균 게이지 바 + 구분선 + 세부 리스트) */}
            <div className="flex-1 transition-all duration-500 ease-in-out">
              {/* 분야별 평균 숙련도 리스트 (상단 노출) */}
              <div className="grid grid-cols-1 gap-2.5 mb-6">
                {overviewItems.map((field: string) => {
                  const avgLevel = getAverageLevel(field, category);
                  const isActive = currentFilter === field;
                  return (
                    <div
                      key={field}
                      onClick={() => setActiveFilters(prev => ({ ...prev, [category]: field }))}
                      className={`group cursor-pointer p-3 rounded-lg border transition-all duration-300 flex flex-col justify-between ${
                        isActive
                          ? 'bg-slate-50 border-slate-950 shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
                          : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex justify-between items-baseline mb-2">
                        <span className={`text-xs sm:text-sm font-bold tracking-tight transition-colors ${
                          isActive ? 'text-slate-950' : 'text-slate-600 group-hover:text-slate-900'
                        }`}>
                          {field}
                        </span>
                        <span className={`text-[9px] font-extrabold tracking-wider transition-colors uppercase ${
                          isActive ? 'text-slate-950 font-black' : 'text-slate-400 group-hover:text-slate-700'
                        }`}>
                          AVG. {renderLevel(avgLevel)}
                        </span>
                      </div>
                      
                      {/* 평균 숙련도 슬림 게이지 바 */}
                      <div className="h-[2px] w-full bg-slate-100 rounded-full relative overflow-hidden">
                        <div
                          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out ${
                            isActive ? 'bg-slate-950 w-full' : 'bg-slate-300'
                          }`}
                          style={{ width: `${(avgLevel / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 구분선 및 상세 정보 타이틀 */}
              <div className="relative flex py-2 items-center my-6">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-[9px] font-extrabold tracking-[0.25em] text-slate-400 uppercase">
                  {currentFilter} Details
                </span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              {/* 세부 리스트 (하단 노출 - 고정 최대 높이 & 커스텀 스크롤바로 3개 컬럼 높이 밸런스 유지 + 디졸브 애니메이션) */}
              <div
                key={currentFilter + (category === 'Equipment' ? `-${activeBrand}` : '')}
                className="space-y-5 animate-dissolve max-h-[340px] md:max-h-[380px] overflow-y-auto custom-scrollbar pr-2 min-h-[180px]"
              >
                {category === 'Equipment' ? (
                  // Equipment 전용 렌더링 (보유 장비 및 운용 가능 장비)
                  <div className="space-y-5">
                    {/* 브랜드 필터 칩 */}
                    <div className="flex flex-wrap gap-1 mb-2 overflow-x-auto pb-1.5 scrollbar-none border-b border-slate-100">
                      {equipmentBrands.map((brand) => (
                        <button
                          key={brand}
                          onClick={() => setActiveBrand(brand)}
                          className={`px-2.5 py-1 text-[8px] font-bold tracking-wider rounded border transition-all uppercase whitespace-nowrap ${
                            activeBrand === brand
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-400'
                          }`}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>

                    {/* 1. 보유 장비 (Owned Gear) */}
                    {(() => {
                      const filteredEq = displaySkills.filter(s => s.owned && (activeBrand === 'All' || s.brand?.trim() === activeBrand));
                      if (filteredEq.length === 0) return null;
                      return (
                        <div className="space-y-2.5">
                          <h5 className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                            Owned Gear
                          </h5>
                          <div className="grid grid-cols-1 gap-2.5">
                            {filteredEq.map((skill, idx) => (
                              <div
                                key={`${skill.name}-${idx}`}
                                className="stagger-item p-3 bg-white border border-slate-100 rounded-md hover:border-slate-300 transition-all duration-300 shadow-sm relative group/eqcard"
                                style={{ animationDelay: `${idx * 50}ms` }}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex flex-col">
                                    {skill.brand && (
                                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                                        {skill.brand}
                                      </span>
                                    )}
                                    <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight leading-tight">
                                      {skill.model || skill.name}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 shrink-0">
                                    <span className="text-[7px] font-bold bg-slate-950 text-white px-1.5 py-0.5 rounded tracking-widest leading-none">
                                      OWNED
                                    </span>
                                    {skill.quantity && skill.quantity > 1 && (
                                      <span className="text-[9px] font-bold text-slate-400 leading-none">
                                        QTY: {skill.quantity}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {(skill.description || skill.keyComponents || skill.condition) && (
                                  <div className="mt-2 pt-2 border-t border-slate-50 text-[10px] text-slate-500 font-light leading-relaxed space-y-1">
                                    {skill.description && (
                                      <p className="break-all">{skill.description}</p>
                                    )}
                                    {skill.keyComponents && (
                                      <p className="text-[9px] text-slate-400">
                                        <span className="font-semibold text-slate-500">Components:</span> {skill.keyComponents}
                                      </p>
                                    )}
                                    {skill.condition && (
                                      <p className="text-[9px] text-slate-400">
                                        <span className="font-semibold text-slate-500">Condition:</span> {skill.condition}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 2. 운용 가능 장비 (Experienced Gear) */}
                    {(() => {
                      const filteredExp = displaySkills.filter(s => !s.owned && (activeBrand === 'All' || s.brand?.trim() === activeBrand));
                      if (filteredExp.length === 0) return null;
                      return (
                        <div className="space-y-2.5 pt-1">
                          <h5 className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                            Experienced Gear
                          </h5>
                          <div className="flex flex-wrap gap-1.5">
                            {filteredExp.map((skill, idx) => (
                              <div
                                key={`${skill.name}-${idx}`}
                                className="stagger-item px-2 py-0.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all rounded text-[9px] font-medium text-slate-600 flex items-center gap-1 cursor-default"
                                style={{ animationDelay: `${idx * 40}ms` }}
                                title={`Familiarity Level: ${renderLevel(skill.level)}`}
                              >
                                <span className="tracking-tight">{skill.name}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span className="text-[8px] font-bold text-slate-400">L{skill.level}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {displaySkills.filter(s => activeBrand === 'All' || s.brand?.trim() === activeBrand).length === 0 && (
                      <div className="text-xs text-slate-300 py-4 text-center">No equipment found matching the brand.</div>
                    )}
                  </div>
                ) : (
                  // 일반 스킬/툴 뷰
                  <>
                    {displaySkills.map((skill, i) => (
                      <div
                        key={`${skill.name}-${i}`}
                        className="group stagger-item relative"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <div className="flex justify-between items-end mb-1">
                          <span className="text-xs sm:text-sm font-medium text-slate-800">{skill.name}</span>
                          <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-wider group-hover:text-slate-900 transition-colors">
                            {renderLevel(skill.level)}
                          </span>
                        </div>

                        {/* 스킬 프로그레스 바 */}
                        <div className="h-[2px] w-full bg-slate-100 relative overflow-hidden rounded-full">
                          {/* 검은색 바 (실제 숙련도) */}
                          <div
                            className="absolute top-0 left-0 h-full bg-slate-900 transition-all duration-[1.2s] ease-out w-0 group-hover:w-[100%]"
                            style={{ width: `${(skill.level / 5) * 100}%` }}
                          />
                          {/* 배경 애니메이션 바 (회색) */}
                          <div
                            className="h-full bg-slate-200 w-0 animate-[growWidth_1s_ease-out_forwards]"
                            style={{ width: `${(skill.level / 5) * 100}%`, animationDelay: `${(i * 50) + 150}ms` }}
                          />
                        </div>
                      </div>
                    ))}

                    {displaySkills.length === 0 && (
                      <div className="text-xs text-slate-300 py-4 text-center">No items found in this category.</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. Timeline 컴포넌트
// ----------------------------------------------------------------------

const Timeline: React.FC = () => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1, once: false });

  const timelineKeys = [
    {
      year: 'aboutTimeline1Year',
      title: 'aboutTimeline1Title',
      description: 'aboutTimeline1Desc',
    },
    {
      year: 'aboutTimeline2Year',
      title: 'aboutTimeline2Title',
      description: 'aboutTimeline2Desc',
    },
    {
      year: 'aboutTimeline3Year',
      title: 'aboutTimeline3Title',
      description: 'aboutTimeline3Desc',
    },
    {
      year: 'aboutTimeline4Year',
      title: 'aboutTimeline4Title',
      description: 'aboutTimeline4Desc',
    },
  ] as const;

  return (
    <div ref={ref} className="relative my-12 py-6">
      {/* Horizontal connector line (visible on sm and up) */}
      <div className="absolute top-8 left-[12.5%] right-[12.5%] h-[1px] bg-slate-200 hidden sm:block" />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 md:gap-12 relative z-10">
        {timelineKeys.map((item, idx) => (
          <div
            key={item.year}
            className={`flex flex-col items-center text-center transition-all duration-1000 transform ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: `${idx * 150}ms` }}
          >
            {/* Dot container */}
            <div className="w-4 h-4 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center relative mb-4 shadow-sm">
              <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-ping absolute duration-1000" />
              <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
            </div>

            {/* Year */}
            <EditableText
              textKey={item.year}
              className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mb-2 leading-none block"
              as="span"
            />

            {/* Title & Desc */}
            <div className="space-y-1.5 px-2">
              <EditableText
                textKey={item.title}
                className="text-sm font-bold text-slate-800 tracking-tight leading-tight block"
                as="h4"
              />
              <EditableText
                textKey={item.description}
                className="text-[11px] sm:text-xs text-slate-400 font-light leading-relaxed max-w-[240px] mx-auto break-keep block"
                as="p"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 4. About 메인 컴포넌트
// ----------------------------------------------------------------------

const About: React.FC = () => {
  const [textRef, isTextVisible] = useIntersectionObserver({ threshold: 0.1, once: false });
  const { texts, isEditMode } = useSiteTexts();

  return (
    <div className="w-full px-6">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-slate-900 mb-10 md:mb-20">ABOUT</h2>

      <div className="space-y-24 md:space-y-36">

        {/* 1. 소개 섹션 (Intro Section) */}
        <div ref={textRef} className="py-8 md:py-16">
          <div className="flex flex-col space-y-12">

            {/* 타이틀: Storyteller (그라데이션 텍스트 효과 포함) */}
            <div className="overflow-hidden">
              {isEditMode ? (
                <EditableText
                  textKey="aboutTitle"
                  className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-[0.9] text-slate-900 block"
                  as="h3"
                />
              ) : (
                <h3
                  className={`
                    text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-[0.9] 
                    break-words w-full
                    transition-transform duration-[1.2s] cubic-bezier(0.16, 1, 0.3, 1) 
                    ${isTextVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
                  `}
                >
                  <span className="text-slate-900 inline-block mr-4">{(texts.aboutTitle || "").split(' ').slice(0, -1).join(' ')}</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-500 to-slate-900 bg-[length:200%_auto] hover:bg-right transition-all duration-500 inline-block">
                    {(texts.aboutTitle || "").split(' ').slice(-1)[0] || ""}
                  </span>
                </h3>
              )}
            </div>

            <div className="flex flex-col gap-10 pt-8">
              {/* 인용구 섹션 (Quote) - 왼쪽에서 등장 애니메이션 */}
              <div className={`transition-all duration-1000 delay-300 ${isTextVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                <div className="border-l-2 border-slate-900 pl-6 py-2 flex items-baseline">
                  <span className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-500 font-light italic leading-relaxed">"</span>
                  <EditableText
                    textKey="aboutQuote"
                    className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-500 font-light italic leading-relaxed"
                  />
                  <span className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-500 font-light italic leading-relaxed">"</span>
                </div>
              </div>

              {/* 설명 본문 (Description) - 아래에서 위로 등장 애니메이션 */}
              <div className={`transition-all duration-1000 delay-500 ${isTextVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <EditableText
                  textKey="aboutDescription"
                  className="text-sm sm:text-base md:text-lg text-slate-800 font-light leading-loose break-keep block"
                  as="p"
                />
              </div>

              {/* 연혁 타임라인 (Timeline) */}
              <div className={`transition-all duration-1000 delay-700 ${isTextVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <Timeline />
              </div>
            </div>
          </div>
        </div>

        {/* 2. 스킬 섹션 (위에서 정의한 인터랙티브 컴포넌트 삽입) */}
        <InteractiveSkillSection />

        {/* 3. 핵심 가치 섹션 (Values Section) - 4개의 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 pb-20">
          {[
            { n: '01', t: 'aboutValue1Title', d: 'aboutValue1Desc' },
            { n: '02', t: 'aboutValue2Title', d: 'aboutValue2Desc' },
            { n: '03', t: 'aboutValue3Title', d: 'aboutValue3Desc' },
            { n: '04', t: 'aboutValue4Title', d: 'aboutValue4Desc' }
          ].map((v) => (
            <div key={v.n} className="group p-6 md:p-10 bg-white border border-slate-100 transition-all duration-700 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1 cursor-default">
              <span className="text-[9px] font-bold text-slate-200 group-hover:text-black transition-colors duration-500 mb-2 block tracking-widest">{v.n}</span>
              <EditableText textKey={v.t as any} className="font-bold text-slate-900 mb-2 text-xs sm:text-sm tracking-tight block" as="h5" />
              <EditableText textKey={v.d as any} className="text-[10px] sm:text-xs text-slate-400 leading-relaxed font-light block" as="p" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;