import sys
from collections import deque

def main():
    data = sys.stdin.read().strip().split()
    if not data:
        print(0); return
    it = iter(map(int, data))
    try:
        n = next(it); k = next(it); d = next(it)
    except StopIteration:
        print(0); return
    arr = [next(it) for _ in range(n)] if n>0 else []
    if k<=0 or k>n:
        print(0); return

    s = sum(arr[:k])
    maxdq = deque()
    mindq = deque()

    def push(i):
        x = arr[i]
        while maxdq and arr[maxdq[-1]] <= x: maxdq.pop()
        while mindq and arr[mindq[-1]] >= x: mindq.pop()
        maxdq.append(i); mindq.append(i)

    def clean(i):
        left = i - k + 1
        while maxdq and maxdq[0] < left: maxdq.popleft()
        while mindq and mindq[0] < left: mindq.popleft()

    for i in range(k): push(i)
    ans = 0
    if s % 7 == 0 and (arr[maxdq[0]] - arr[mindq[0]] >= d): ans += 1

    for i in range(k, n):
        s += arr[i] - arr[i-k]
        push(i); clean(i)
        if s % 7 == 0 and (arr[maxdq[0]] - arr[mindq[0]] >= d): ans += 1

    print(ans)

if __name__ == "__main__":
    main()
