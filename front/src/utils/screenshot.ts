/**
 * 메시지 스크린샷 관련 유틸리티 함수들
 */

/**
 * 현재 뷰포트에 보이는 메시지들의 첫 번째와 마지막 ID를 계산합니다.
 * Intersection Observer API를 사용하여 정확한 범위를 찾습니다.
 */
export function calculateVisibleMessageRange(
    messageContainer: HTMLElement | null,
    messageSelector: string = '[data-message-id]'
): { fromId: number | null; toId: number | null } {
    if (!messageContainer) {
        return { fromId: null, toId: null };
    }

    const messages = messageContainer.querySelectorAll(messageSelector);
    if (messages.length === 0) {
        return { fromId: null, toId: null };
    }

    const visibleMessages: number[] = [];
    
    // Intersection Observer를 사용하여 현재 보이는 메시지들 찾기
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const messageId = entry.target.getAttribute('data-message-id');
                    if (messageId) {
                        const id = parseInt(messageId, 10);
                        if (!isNaN(id)) {
                            visibleMessages.push(id);
                        }
                    }
                }
            });
        },
        {
            root: null, // 뷰포트 기준
            rootMargin: '0px',
            threshold: 0.1 // 10% 이상 보이면 visible로 간주
        }
    );

    // 모든 메시지 요소 관찰
    messages.forEach((message) => {
        observer.observe(message);
    });

    // 잠시 대기 후 결과 반환 (동기적으로 처리하기 위해)
    const visibleIds = Array.from(messages)
        .filter((message) => {
            const rect = message.getBoundingClientRect();
            const containerRect = messageContainer.getBoundingClientRect();
            
            // 컨테이너 내에서 보이는지 확인
            return rect.top < containerRect.bottom && rect.bottom > containerRect.top;
        })
        .map((message) => {
            const messageId = message.getAttribute('data-message-id');
            return messageId ? parseInt(messageId, 10) : null;
        })
        .filter((id): id is number => id !== null)
        .sort((a, b) => a - b);

    observer.disconnect();

    if (visibleIds.length === 0) {
        return { fromId: null, toId: null };
    }

    return {
        fromId: visibleIds[0],
        toId: visibleIds[visibleIds.length - 1]
    };
}

/**
 * 스크롤 위치 기반으로 메시지 범위를 계산합니다.
 * 더 간단한 방법으로 스크롤 위치를 기준으로 합니다.
 */
export function calculateMessageRangeByScroll(
    messageContainer: HTMLElement | null,
    messageSelector: string = '[data-message-id]'
): { fromId: number | null; toId: number | null } {
    if (!messageContainer) {
        return { fromId: null, toId: null };
    }

    const messages = messageContainer.querySelectorAll(messageSelector);
    if (messages.length === 0) {
        return { fromId: null, toId: null };
    }

    const containerRect = messageContainer.getBoundingClientRect();
    const visibleMessages: number[] = [];

    messages.forEach((message) => {
        const rect = message.getBoundingClientRect();
        
        // 컨테이너 내에서 보이는지 확인
        if (rect.top < containerRect.bottom && rect.bottom > containerRect.top) {
            const messageId = message.getAttribute('data-message-id');
            if (messageId) {
                const id = parseInt(messageId, 10);
                if (!isNaN(id)) {
                    visibleMessages.push(id);
                }
            }
        }
    });

    if (visibleMessages.length === 0) {
        return { fromId: null, toId: null };
    }

    visibleMessages.sort((a, b) => a - b);

    return {
        fromId: visibleMessages[0],
        toId: visibleMessages[visibleMessages.length - 1]
    };
}

/**
 * 현재 채팅 패널의 너비를 계산합니다.
 * 반응형 디자인을 고려하여 최소/최대값을 적용합니다.
 */
export function calculateChatPanelWidth(
    panelElement: HTMLElement | null,
    options?: { minWidth?: number; maxWidth?: number }
): number {
    const minWidth = options?.minWidth || 600;
    const maxWidth = options?.maxWidth || 1200;
    
    if (!panelElement) {
        return Math.min(maxWidth, Math.max(minWidth, 960)); // 기본값
    }

    const width = panelElement.clientWidth;
    return Math.min(maxWidth, Math.max(minWidth, width));
}

/**
 * 메시지 범위가 유효한지 확인합니다.
 * 너무 많은 메시지를 요청하지 않도록 제한합니다.
 */
export function validateMessageRange(
    fromId: number | null,
    toId: number | null,
    maxMessages: number = 200
): { isValid: boolean; error?: string } {
    if (fromId === null || toId === null) {
        return { isValid: false, error: '메시지 범위를 찾을 수 없습니다.' };
    }

    if (fromId > toId) {
        return { isValid: false, error: '메시지 범위가 잘못되었습니다. (fromId > toId)' };
    }

    const messageCount = toId - fromId + 1;
    if (messageCount > maxMessages) {
        return { 
            isValid: false, 
            error: `너무 많은 메시지입니다. (${messageCount}개, 최대 ${maxMessages}개)` 
        };
    }

    return { isValid: true };
}

/**
 * 스크린샷 다운로드 에러를 사용자 친화적인 메시지로 변환합니다.
 */
export function formatScreenshotError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('403') || message.includes('권한')) {
        return '채팅방에 접근할 권한이 없습니다.';
    }
    
    if (message.includes('400') || message.includes('잘못')) {
        return '메시지 범위가 잘못되었습니다.';
    }
    
    if (message.includes('404') || message.includes('없음')) {
        return '요청한 메시지를 찾을 수 없습니다.';
    }
    
    if (message.includes('413') || message.includes('너무 많은')) {
        return '너무 많은 메시지입니다. 범위를 줄여주세요.';
    }
    
    if (message.includes('network') || message.includes('fetch')) {
        return '네트워크 연결을 확인해주세요.';
    }
    
    return '스크린샷 생성에 실패했습니다. 잠시 후 다시 시도해주세요.';
}
