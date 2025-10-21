import sys
from collections import deque

def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    if not data:
        print(0)
        return

    it = iter(data)
    n = next(it); k = next(it); d = next(it)
    arr = [next(it) for _ in range(n)]

    if k > n or k <= 0 or n == 0:
        print(0)
        return

    # 윈도우 합, 최대/최소 덱(값이 아닌 인덱스 저장)
    win_sum = 0
    maxdq = deque()  # 값 내림차순 유지
    mindq = deque()  # 값 오름차순 유지

    # 초기 윈도우 [0, k-1]
    for i in range(k):
        x = arr[i]
        win_sum += x

        while maxdq and arr[maxdq[-1]] <= x:
            maxdq.pop()
        maxdq.append(i)

        while mindq and arr[mindq[-1]] >= x:
            mindq.pop()
        mindq.append(i)

    def ok():
        return (win_sum % 7 == 0) and (arr[maxdq[0]] - arr[mindq[0]] >= d)

    count = 1 if ok() else 0

    # 슬라이딩
    for i in range(k, n):
        # 나갈 인덱스와 들어올 값
        out_idx = i - k
        in_val = arr[i]

        # 합 갱신
        win_sum += in_val - arr[out_idx]

        # 최대 덱: 새 값 삽입
        while maxdq and arr[maxdq[-1]] <= in_val:
            maxdq.pop()
        maxdq.append(i)
        # 윈도우 밖 제거
        if maxdq[0] == out_idx:
            maxdq.popleft()

        # 최소 덱: 새 값 삽입
        while mindq and arr[mindq[-1]] >= in_val:
            mindq.pop()
        mindq.append(i)
        # 윈도우 밖 제거
        if mindq[0] == out_idx:
            mindq.popleft()

        if ok():
            count += 1

    print(count)

if __name__ == "__main__":
    main()
