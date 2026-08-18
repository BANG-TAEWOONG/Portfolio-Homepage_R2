import Papa from 'papaparse';
import { WorkItem, Category, WorkType, SkillItem } from '../types';
import { getYouTubeId, getYouTubeThumbnail } from './youtube';
import { SiteTexts, DEFAULT_SITE_TEXTS } from '../siteTexts';

// ----------------------------------------------------------------------
// 1. 구글 시트 설정 및 상수 정의
// ----------------------------------------------------------------------

// '웹에 게시'된 구글 스프레드시트의 CSV 출력 URL
const GOOGLE_SHEET_BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRxJ4VI4bE5o7PXX7C4g_k_x8OO7tAnRYgGF0zGE9SCa5K6H9F1N6m78pEWldMa07sI7VqSDVlUgXb7/pub';

// 메인 프로젝트 데이터 (첫 번째 시트) URL
const GOOGLE_SHEET_CSV_URL = `${GOOGLE_SHEET_BASE_URL}?output=csv`;

// 스킬/장비 데이터가 있는 시트의 GID (고유 ID)
const SKILL_DB_GID = '865936350';
const GOOGLE_SHEET_SKILLS_URL = `${GOOGLE_SHEET_BASE_URL}?gid=${SKILL_DB_GID}&output=csv`;

// Tools 데이터가 있는 시트의 GID
const TOOLS_GID = '2121398315';
const GOOGLE_SHEET_TOOLS_URL = `${GOOGLE_SHEET_BASE_URL}?gid=${TOOLS_GID}&output=csv`;

// Equipment 데이터가 있는 시트의 GID 및 URL
const GOOGLE_SHEET_OLD_EQUIPMENT_URL = `${GOOGLE_SHEET_BASE_URL}?gid=1277913603&output=csv`;
const GOOGLE_SHEET_EQUIPMENT_URL = 'https://docs.google.com/spreadsheets/d/1dwCdnFeZMedaMdv0nOxTXJpMqxEaB_ParMEAl00jRRo/export?format=csv';

// 사이트 텍스트 시트 GID 및 URL (실시간 내보내기 API를 사용하여 5~10분 캐시 지연을 제거)
const SITE_TEXTS_GID = '877199329';
const SITE_TEXTS_SHEET_URL = `https://docs.google.com/spreadsheets/d/1dwCdnFeZMedaMdv0nOxTXJpMqxEaB_ParMEAl00jRRo/export?format=csv&gid=${SITE_TEXTS_GID}`;

// ----------------------------------------------------------------------
// 2. 데이터 인터페이스 (구글 시트 헤더와 1:1 매핑)
// ----------------------------------------------------------------------

// 프로젝트 시트의 행 데이터 타입 (Raw Data)
interface SheetRow {
    id: string;
    date: string;
    hidden: string;
    participation_level: string;
    project_type: string;
    client: string;
    artist: string;
    running_time: string;
    title: string;
    contribution_rate: string;
    my_role: string;
    use_tools: string;
    set_up: string;
    video_url: string;
    description: string;
    vertical?: string;
}

// 스킬(Capabilities) 시트의 행 데이터 타입 (Raw Data)
// 실제 시트 컬럼: id, hidden, source_table, group, skill_name, level, remark
interface SkillSheetRow {
    id: string;
    hidden: string;
    source_table: string;
    group: string;
    skill_name: string;
    level: string;
    remark?: string;
}

// Tools 시트의 행 데이터 타입 (Raw Data)
interface ToolSheetRow {
    id: string;
    hidden: string;
    source_table: string;
    group: string;
    vendor: string;
    tool_name: string;
    level: string;
    remark: string;
}

// Equipment 시트의 행 데이터 타입 (Raw Data)
interface EquipmentSheetRow {
    id: string;
    hidden: string;
    source_table: string;
    group: string;
    brand: string;
    name: string;
    level: string;
    remark: string;
}

// ----------------------------------------------------------------------
// 3. 헬퍼 함수 (데이터 변환 및 유틸리티)
// ----------------------------------------------------------------------

/**
 * 시트의 'project_type' 문자열을 앱 내부 'Category' 타입으로 변환 (시트의 카테고리명 원본 유지)
 */
function mapCategory(type: string): Category {
    if (!type) return 'Other';
    return type.trim();
}

/**
 * 시트의 'participation_level' 문자열을 'WorkType'으로 변환
 * (예: Personal -> Created / 그 외 -> Participated)
 */
const mapWorkType = (level: string): WorkType => {
    if (level.includes('Personal')) return 'Created';
    return 'Participated';
};

const addCacheBuster = (url: string): string => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
};

// ----------------------------------------------------------------------
// 4. 데이터 페칭 함수 (외부로 export)
// ----------------------------------------------------------------------

/**
 * 프로젝트 목록(Work Items) 가져오기
 * - PapaParse를 사용하여 CSV를 JSON으로 파싱
 * - 데이터 정제(Filtering) 및 매핑(Mapping) 수행
 */
export const fetchWorkItems = async (): Promise<WorkItem[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(addCacheBuster(GOOGLE_SHEET_CSV_URL), {
            download: true, // URL에서 직접 다운로드
            header: true,   // 첫 번째 줄을 키(Key)로 사용
            transformHeader: (h: string) => h.trim(), // CSV 헤더 공백 제거
            complete: (results) => {
                try {
                    const rows = results.data as SheetRow[];

                    const workItems: WorkItem[] = rows
                        // 1. 유효성 검사: ID와 제목이 있고, 숨김 처리되지 않은 항목만 필터링
                        .filter(row => row.id && row.title && (!row.hidden || row.hidden.trim().toUpperCase() !== 'TRUE'))
                        // 2. 데이터 매핑: Raw 데이터를 앱에서 사용하는 WorkItem 구조로 변환
                        .map(row => ({
                            id: row.id,
                            title: row.title,
                            // 썸네일 컬럼 삭제됨 -> 유튜브 썸네일 항상 자동 생성
                            thumbnail: getYouTubeThumbnail(row.video_url),
                            videoUrl: row.video_url,
                            category: mapCategory(row.project_type),
                            type: mapWorkType(row.participation_level),
                            runningTime: row.running_time,
                            releaseDate: row.date,
                            role: row.my_role ? row.my_role.replace(/"/g, '') : '', // role -> my_role
                            setup: row.set_up ? row.set_up.replace(/"/g, '') : '', // setup -> set_up
                            description: row.description,
                            contributionRate: row.contribution_rate, // 추가됨
                            vertical: row.vertical ? row.vertical.trim().toUpperCase() === 'TRUE' : false
                        }));

                    resolve(workItems);
                } catch (err) {
                    console.error('Error parsing work items:', err);
                    resolve([]);
                }
            },
            error: (err) => {
                console.error('Fetch error (work items):', err);
                resolve([]);
            }
        });
    });
};

/**
 * 스킬/장비 목록(Skill Items) 가져오기
 * - 별도의 시트(GID)에서 데이터 로드
 * - 정렬 순서(order)에 따라 데이터 정렬
 */
export const fetchSkillsData = async (): Promise<SkillItem[]> => {
    return new Promise((resolve) => {
        Papa.parse(addCacheBuster(GOOGLE_SHEET_SKILLS_URL), {
            download: true,
            header: true,
            transformHeader: (h: string) => h.trim(), // CSV 헤더 공백 제거
            complete: (results) => {
                try {
                    const rows = results.data as SkillSheetRow[];
                    const skills: SkillItem[] = rows
                        // 1. 필수값 체크: skill_name 존재 + hidden이 아닌 것
                        .filter(row => row.skill_name && row.skill_name.trim() && (!row.hidden || row.hidden.trim().toUpperCase() !== 'TRUE'))
                        // 2. 데이터 매핑: 시트 컬럼 → 앱 내부 SkillItem 구조
                        .map(row => ({
                            category: 'Capabilities',      // source_table 대신 고정값 사용
                            filter: row.group,              // group → filter
                            name: row.skill_name,           // skill_name → name
                            level: parseInt(row.level, 10) || 0,
                            hidden: false                   // 이미 필터링 완료
                        }));

                    resolve(skills);
                } catch (err) {
                    console.error('Error parsing skills:', err);
                    resolve([]); // 에러 발생 시 빈 배열 반환하여 앱 충돌 방지
                }
            },
            error: (err) => {
                console.error('Fetch error (skills):', err);
                resolve([]); // reject 대신 resolve([])로 변경 — 다른 fetch 실패 방지
            }
        });
    });
};

/**
 * Tools 목록 가져오기
 * - group -> filter, tool_name -> name 매핑
 * - category: 'Tools'
 */
export const fetchToolsData = async (): Promise<SkillItem[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(addCacheBuster(GOOGLE_SHEET_TOOLS_URL), {
            download: true,
            header: true,
            transformHeader: (h: string) => h.trim(), // CSV 헤더 공백 제거
            complete: (results) => {
                try {
                    const rows = results.data as ToolSheetRow[];
                    const tools: SkillItem[] = rows
                        .filter(row => row.tool_name && (!row.hidden || row.hidden.trim().toUpperCase() !== 'TRUE'))
                        .map(row => ({
                            category: 'Tools',
                            filter: row.group,
                            name: row.tool_name,
                            level: parseInt(row.level, 10) || 0,
                            hidden: false
                        }));
                    resolve(tools);
                } catch (err) {
                    console.error('Error parsing tools:', err);
                    resolve([]);
                }
            },
            error: (err) => {
                console.error('Fetch error (tools):', err);
                resolve([]);
            }
        });
    });
};

/**
 * Korean Category to English Filter mapper
 */
const mapCategoryToFilter = (cat: string): string => {
    if (!cat) return 'Accessories';
    const trimmed = cat.trim();
    if (trimmed === '카메라' || trimmed === '렌즈') return 'Camera';
    if (trimmed === '조명') return 'Lighting';
    if (trimmed === '그립') return 'Stabilizer & Rigs';
    return 'Accessories'; // 저장장치, 오디오, 악세서리, 기타, 파워 등
};

/**
 * Equipment 목록 가져오기
 * - 새 구글 시트에서 보유 장비(Owned) 데이터 로드
 * - 기존 구글 시트에서 운용 장비(Experienced) 데이터 로드 (level > 0인 것)
 * - 두 데이터 병합 및 중복 제거
 */
export const fetchEquipmentData = async (): Promise<SkillItem[]> => {
    // 1. 새 시트 (보유 장비) 페치 및 파싱
    const fetchOwned = (): Promise<SkillItem[]> => {
        return new Promise((resolve) => {
            Papa.parse(addCacheBuster(GOOGLE_SHEET_EQUIPMENT_URL), {
                download: true,
                header: true,
                transformHeader: (h: string) => h.trim(),
                complete: (results) => {
                    try {
                        const rows = results.data as any[];
                        const items: SkillItem[] = rows
                            .filter(row => {
                                const name = row['Equipment Name'] || row['Model'];
                                return name && (!row.hidden || row.hidden.trim().toUpperCase() !== 'TRUE');
                            })
                            .map(row => {
                                const brand = row['Brand']?.trim() || '';
                                const model = row['Model']?.trim() || '';
                                const eqName = row['Equipment Name']?.trim() || '';
                                const name = model ? `${brand} ${model}` : `${brand} ${eqName}`;
                                
                                const remarks = row['Remarks']?.trim() || '';
                                const isOwned = remarks.includes('보유') || remarks.toLowerCase().includes('owned') || true;

                                return {
                                    category: 'Equipment',
                                    filter: mapCategoryToFilter(row['Category']),
                                    name: name.trim(),
                                    level: 5, // 보유 장비는 기본적으로 마스터(5) 수준으로 지정
                                    hidden: false,
                                    brand,
                                    model,
                                    description: row['Description']?.trim() || '',
                                    keyComponents: row['Key Components']?.trim() || '',
                                    quantity: parseInt(row["Q'ty"], 10) || 1,
                                    condition: row['Condition']?.trim() || '',
                                    remark: remarks,
                                    owned: isOwned
                                };
                            });
                        resolve(items);
                    } catch (err) {
                        console.error('Error parsing new owned equipment:', err);
                        resolve([]);
                    }
                },
                error: (err) => {
                    console.error('Fetch error (new owned equipment):', err);
                    resolve([]);
                }
            });
        });
    };

    // 2. 기존 시트 (운용 장비) 페치 및 파싱
    const fetchExperienced = (): Promise<SkillItem[]> => {
        return new Promise((resolve) => {
            Papa.parse(addCacheBuster(GOOGLE_SHEET_OLD_EQUIPMENT_URL), {
                download: true,
                header: true,
                transformHeader: (h: string) => h.trim(),
                complete: (results) => {
                    try {
                        const rows = results.data as any[];
                        const items: SkillItem[] = rows
                            .filter(row => {
                                const name = row.name || '';
                                const hidden = row.hidden?.trim().toUpperCase() === 'TRUE';
                                const lvl = parseInt(row.level, 10) || 0;
                                return name && !hidden && lvl > 0;
                            })
                            .map(row => {
                                const brand = row.brand?.trim() || '';
                                const model = row.name?.trim() || '';
                                const name = model.startsWith(brand) ? model : `${brand} ${model}`;
                                
                                let filter = 'Accessories';
                                const grp = row.group?.trim();
                                if (grp === 'Camera' || grp === 'Lens' || grp === 'Drone') {
                                    filter = 'Camera';
                                } else if (grp === 'Lighting') {
                                    filter = 'Lighting';
                                } else if (grp === 'Gimbal' || grp === 'Tripod') {
                                    filter = 'Stabilizer & Rigs';
                                }

                                return {
                                    category: 'Equipment',
                                    filter: filter,
                                    name: name.trim(),
                                    level: parseInt(row.level, 10) || 0,
                                    hidden: false,
                                    brand,
                                    model,
                                    description: '',
                                    keyComponents: '',
                                    quantity: 1,
                                    condition: '',
                                    remark: row.remark || '',
                                    owned: false
                                };
                            });
                        resolve(items);
                    } catch (err) {
                        console.error('Error parsing old experienced equipment:', err);
                        resolve([]);
                    }
                },
                error: (err) => {
                    console.error('Fetch error (old experienced equipment):', err);
                    resolve([]);
                }
            });
        });
    };

    // 병렬로 실행 후 병합 및 중복제거
    const [ownedItems, experiencedItems] = await Promise.all([fetchOwned(), fetchExperienced()]);
    
    // 보유 중인 장비의 이름을 기준으로 기존 운용 장비와 중복 제거 (대소문자 무시)
    const ownedNames = new Set(ownedItems.map(item => item.name.toLowerCase()));
    const filteredExperienced = experiencedItems.filter(item => !ownedNames.has(item.name.toLowerCase()));

    return [...ownedItems, ...filteredExperienced];
};


// ----------------------------------------------------------------------
// 사이트 텍스트 시트 행 타입 (key | value)
// ----------------------------------------------------------------------
interface SiteTextRow {
    key: string;
    value: string;
}

/**
 * 사이트 텍스트 가져오기 (Google Sheets CMS)
 * - key/value 2열 구조의 CSV를 SiteTexts 객체로 변환
 * - \n 문자열을 실제 줄바꿈으로 치환
 */
export const fetchSiteTexts = async (): Promise<Partial<SiteTexts>> => {
    return new Promise((resolve) => {
        Papa.parse(addCacheBuster(SITE_TEXTS_SHEET_URL), {
            download: true,
            header: true,
            transformHeader: (h: string) => h.trim(),
            complete: (results) => {
                try {
                    const rows = results.data as SiteTextRow[];
                    const validKeys = Object.keys(DEFAULT_SITE_TEXTS);
                    const texts: Partial<SiteTexts> = {};

                    for (const row of rows) {
                        const key = row.key?.trim();
                        if (key && validKeys.includes(key) && row.value != null) {
                            (texts as Record<string, string>)[key] = row.value.replace(/\\n/g, '\n');
                        }
                    }

                    resolve(texts);
                } catch (err) {
                    console.error('Error parsing site texts:', err);
                    resolve({});
                }
            },
            error: (err) => {
                console.error('Fetch error (site texts):', err);
                resolve({});
            }
        });
    });
};