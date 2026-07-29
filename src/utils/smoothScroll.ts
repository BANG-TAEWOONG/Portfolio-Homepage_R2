/**
 * 럭셔리 커스텀 JS 스크롤 애니메이션 (requestAnimationFrame)
 * 브라우저 버그나 OS 설정에 상관없이 100% 부드러운 스크롤 애니메이션 보장
 */
export const smoothScrollTo = (targetId: string, offset: number = 64, duration: number = 900) => {
    const element = document.getElementById(targetId);
    if (!element) return;

    const startPosition = window.pageYOffset || document.documentElement.scrollTop;
    const targetPosition = element.getBoundingClientRect().top + startPosition - offset;
    const distance = targetPosition - startPosition;
    let startTime: number | null = null;

    // Cubic Easing 함수 (부드러운 시작과 감속 효과)
    const easeInOutCubic = (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const step = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const ease = easeInOutCubic(progress);

        window.scrollTo(0, startPosition + distance * ease);

        if (timeElapsed < duration) {
            requestAnimationFrame(step);
        }
    };

    requestAnimationFrame(step);
};
