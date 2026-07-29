import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface InquiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    contactEmail: string;
}

const InquiryModal: React.FC<InquiryModalProps> = ({ isOpen, onClose, contactEmail }) => {
    const [clientName, setClientName] = useState('');
    const [clientContact, setClientContact] = useState('');
    const [projectType, setProjectType] = useState('MV');
    const [schedule, setSchedule] = useState('');
    const [budget, setBudget] = useState('');
    const [details, setDetails] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const formattedMessage = `[TWOONG STUDIO 프로젝트 촬영 문의]
성함/클라이언트: ${clientName || '미기재'}
연락처/이메일: ${clientContact || '미기재'}
프로젝트 유형: ${projectType}
희망 일정: ${schedule || '미정'}
예산 범위: ${budget || '미정'}

[상세 내용 및 참고 링크]
${details || '내용 없음'}
`;

    const handleCopyAndMail = () => {
        navigator.clipboard.writeText(formattedMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);

        const subject = encodeURIComponent(`[프로젝트 문의] ${clientName ? clientName + ' - ' : ''}${projectType}`);
        const body = encodeURIComponent(formattedMessage);
        window.open(`mailto:${contactEmail}?subject=${subject}&body=${body}`, '_blank');
    };

    return createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            {/* 배경 오버레이 */}
            <div
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* 모달 윈도우 */}
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl z-[3010] overflow-hidden animate-modal-container my-auto flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] block mb-1">PROJECT INQUIRY</span>
                        <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">1:1 촬영 문의하기</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-6 md:p-8 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">성함 / 클라이언트 *</label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="예: 홍길동 / AAA 엔터"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">연락처 / 이메일 *</label>
                            <input
                                type="text"
                                value={clientContact}
                                onChange={(e) => setClientContact(e.target.value)}
                                placeholder="010-0000-0000 / email@example.com"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">프로젝트 유형</label>
                            <select
                                value={projectType}
                                onChange={(e) => setProjectType(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                            >
                                <option value="MV">MV (뮤직비디오)</option>
                                <option value="Dance Film">Dance Film</option>
                                <option value="Dance Cover">Dance Cover</option>
                                <option value="Commercial / Branding">Commercial / 광고</option>
                                <option value="Other">기타 문의</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">촬영 희망 일정</label>
                            <input
                                type="text"
                                value={schedule}
                                onChange={(e) => setSchedule(e.target.value)}
                                placeholder="예: 8월 중순"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">예산 범위</label>
                            <input
                                type="text"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder="예: 협의 / OOO만원"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">상세 내용 및 참고 레퍼런스 링크</label>
                        <textarea
                            rows={4}
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="프로젝트 컨셉, 촬영 장소, 유튜브 레퍼런스 링크 등을 자유롭게 입력해주세요."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={handleCopyAndMail}
                        className="flex-1 px-6 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase hover:bg-slate-800 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {copied ? '복사됨 & 메일 앱 연결 중...' : '문의 이메일 작성하기'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default InquiryModal;
